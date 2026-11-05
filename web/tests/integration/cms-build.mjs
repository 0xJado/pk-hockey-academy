import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = resolve(webRoot, "../output");
await mkdir(outputRoot, { recursive: true });
const manifest = resolve(outputRoot, "cms-integration-manifest.json");
await writeFile(manifest, JSON.stringify({ complete: false }));
const logs = resolve(outputRoot, "cms-build-logs");
await mkdir(logs, { recursive: true });
const output = await mkdtemp(resolve(outputRoot, "cms-integration-"));
const fixture = pathToFileURL(
  resolve(webRoot, "tests/integration/sanity-fixture.mjs"),
).href;
const env = {
  ...process.env,
  PUBLIC_LAUNCH_READY: "false",
  SITE_URL: "",
  SANITY_PROJECT_ID: "",
  SANITY_DATASET: "",
  SANITY_READ_TOKEN: "",
  SANITY_PREVIEW_READ_TOKEN: "",
  SANITY_TRAINING_ENABLED: "false",
  SANITY_TRAINERS_ENABLED: "false",
  SANITY_SOCIAL_ENABLED: "false",
  PUBLIC_SANITY_STUDIO_URL: "",
  NODE_OPTIONS: "",
  // Exercise the hosting adapter. Its bundled functions also let isolated
  // artifacts live outside web/, without Node's external dependency lookup.
  VERCEL: "1",
};
const build = async (name, settings) => {
  const folder = resolve(output, name);
  const result = spawnSync(
    process.execPath,
    [
      resolve(webRoot, "node_modules/astro/bin/astro.mjs"),
      "build",
      "--outDir",
      folder,
    ],
    {
      cwd: webRoot,
      env: { ...env, ...settings },
      encoding: "utf8",
      timeout: 120000,
    },
  );
  await writeFile(
    resolve(logs, `${name}.log`),
    (result.stdout ?? "") +
      (result.stderr ?? "") +
      (result.error?.message ?? ""),
  );
  if (result.error) throw result.error;
  // The adapter keeps public prerendered output in client/, with private
  // preview functions separate from the static artifacts scanned below.
  return { folder: resolve(folder, "client"), result };
};
const files = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map(async (entry) =>
        entry.isDirectory()
          ? files(resolve(directory, entry.name))
          : [resolve(directory, entry.name)],
      ),
    )
  ).flat();
const scan = async (directory, starter) => {
  let count = 0;
  for (const file of (await files(directory)).filter((path) =>
    /\.(?:html|js|css|json|xml|txt)$/.test(path),
  )) {
    const content = await readFile(file, "utf8");
    for (const marker of [
      "test-token-never-real",
      "DRAFT_DO_NOT_EXPOSE",
      "RELEASE_DO_NOT_EXPOSE",
      "HIDDEN_DO_NOT_EXPOSE",
      "INACTIVE_DO_NOT_EXPOSE",
      "UNAPPROVED_DO_NOT_EXPOSE",
      "OLD_SOCIAL_COPY_DO_NOT_EXPOSE",
      "MISSING_DOWNLOAD_DO_NOT_EXPOSE",
    ]) {
      assert.equal(
        content.includes(marker),
        false,
        `Private/test marker in ${file}`,
      );
    }
    if (starter)
      assert.equal(
        content.includes("Technisches Testprofil"),
        false,
        `Fixture leaked into starter build: ${file}`,
      );
    count++;
  }
  return count;
};

const starter = await build("starter", {});
assert.equal(
  starter.result.status,
  0,
  starter.result.stdout + starter.result.stderr,
);
assert.match(
  await readFile(resolve(starter.folder, "trainerpool/index.html"), "utf8"),
  /Pierre Klein/,
);
console.log(
  `Starter build passed; ${await scan(starter.folder, true)} public text artifacts scanned.`,
);

for (const mode of [
  "normal",
  "public",
  "empty",
  "malformed",
  "malformed-gallery",
  "malformed-media-kit",
  "malformed-training",
  "malformed-site-images",
]) {
  const trace = resolve(output, `${mode}-requests.jsonl`);
  const { folder, result } = await build(mode, {
    SANITY_PROJECT_ID: "cmsqa123",
    SANITY_DATASET: "qa",
    SANITY_READ_TOKEN: mode === "public" ? "" : "test-token-never-real",
    SANITY_TRAINING_ENABLED: "true",
    SANITY_TRAINERS_ENABLED: "true",
    SANITY_SOCIAL_ENABLED: "true",
    PUBLIC_SANITY_STUDIO_URL: "https://pk-hockey-academy.sanity.studio/",
    NODE_OPTIONS: `--import=${fixture}`,
    PK_CMS_QA_TRACE: trace,
    PK_CMS_QA_MODE: mode,
  });
  const requests = (await readFile(trace, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  if (
    mode !== "malformed-gallery" &&
    mode !== "malformed-media-kit" &&
    mode !== "malformed-training" &&
    mode !== "malformed-site-images"
  ) {
    assert.ok(
      requests.some((request) => request.type === "trainers"),
      "Server-only coach configuration was not activated.",
    );
  }
  assert.ok(
    requests
      .filter((request) => request.type !== "media-kit-file")
      .every(
        (request) =>
          request.perspective === "published" &&
          request.authenticated === (mode !== "public") &&
          request.hasAuthorization === (mode !== "public"),
      ),
    "Unexpected CMS transport configuration.",
  );
  assert.ok(
    requests
      .filter((request) => request.type === "media-kit-file")
      .every((request) => request.hasAuthorization === false),
    "CDN received a CMS token.",
  );
  if (
    mode === "malformed" ||
    mode === "malformed-gallery" ||
    mode === "malformed-media-kit" ||
    mode === "malformed-training" ||
    mode === "malformed-site-images"
  ) {
    assert.notEqual(result.status, 0);
    assert.match(
      result.stdout + result.stderr,
      mode === "malformed"
        ? /approved trainer profile has invalid required fields/
        : mode === "malformed-gallery"
          ? /approved gallery album.*invalid content/
          : mode === "malformed-training"
            ? /Invalid approved session/
            : mode === "malformed-site-images"
              ? /Invalid approved website image/
              : /approved media-kit download is invalid/,
    );
    console.log(
      `${mode}: malformed approved content correctly rejected the build.`,
    );
    continue;
  }
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(
    requests.some((request) => request.type === "gallery"),
    "Server-only gallery configuration was not activated.",
  );
  const schedule = await readFile(
    resolve(folder, "trainingstermine/index.html"),
    "utf8",
  );
  const venuePage = await readFile(
    resolve(folder, "trainingsstaetten/index.html"),
    "utf8",
  );
  if (mode === "empty") {
    assert.equal(schedule.includes("Technischer Testtermin"), false);
    assert.equal(venuePage.includes("Technische Testhalle"), false);
  } else {
    assert.match(schedule, /Technischer Testtermin/);
    assert.match(venuePage, /Technische Testhalle/);
    assert.match(venuePage, /Technische Testadresse/);
    assert.equal(schedule.includes("Bei SpielerPlus anmelden"), false);
  }
  const pool = await readFile(
    resolve(folder, "trainerpool/index.html"),
    "utf8",
  );
  const home = await readFile(resolve(folder, "index.html"), "utf8");
  assert.ok(requests.some((request) => request.type === "site-images"));
  if (mode === "public") {
    assert.match(home, /alt="Technisches Philosophie-Ersatzbild"/);
    assert.match(home, /alt="Technisches Standort-Ersatzbild"/);
    assert.doesNotMatch(home, /\/images\/(blade|rink)\.svg/);
    assert.doesNotMatch(home, /JEDER SCHRITT ZÄHLT\. · ILLUSTRATION|DEINE REGION\. DEIN EIS\. · ILLUSTRATION/);
    assert.match(home, /<link rel="icon" href="https:\/\/cdn\.sanity\.io\/images\/cmsqa123\/qa\//);
    assert.doesNotMatch(home, /pk-hockey-crest/);
  } else {
    assert.match(home, /\/images\/blade\.svg/);
    assert.match(home, /\/images\/rink\.svg/);
    assert.doesNotMatch(home, /Technisches Philosophie-Ersatzbild|Technisches Standort-Ersatzbild/);
  }
  assert.match(home, /data-hero-line>MINDSET\./);
  if (mode === "empty") {
    assert.match(home, /data-hero-line>SKILLS\./);
  } else {
    assert.match(home, /data-hero-line>EISHOCKEY\./);
    assert.match(home, /Technischer Testtext für die Startseite\./);
  }
  if (mode === "public") {
    assert.match(home, /alt="Technisches Hero-Ersatzbild"/);
    assert.doesNotMatch(home, /hero-academy-players-retouched/);
    assert.match(home, /data-hero-motion-bar[^>]*hidden[^>]*>[\s\S]*?<header/);
    assert.match(home, /<video data-hero-video="https:\/\/cdn\.sanity\.io\/files\/cmsqa123\/qa\/hero-fixture\.mp4"[^>]*preload="none"/);
    assert.doesNotMatch(home, /<video[^>]+\ssrc=/);
  } else {
    assert.doesNotMatch(home, /hero-academy-players-retouched/);
    assert.match(home, /<div class="hero-art"[^>]*>\s*<\/div>/);
    assert.doesNotMatch(home, /Technisches Hero-Ersatzbild/);
    assert.doesNotMatch(home, /<div[^>]*data-hero-motion-bar|hero-fixture\.mp4/);
  }
  const trainingPage = await readFile(resolve(folder, "training/index.html"), "utf8");
  for (const page of [home, trainingPage]) {
    assert.match(page, /off-ice-running/);
    if (mode === "public") {
      assert.match(page, /alt="Technisches On-Ice Ersatzbild"/);
      assert.doesNotMatch(page, /on-ice-practice/);
    } else {
      assert.match(page, /on-ice-practice/);
    }
  }
  const downloads = await readFile(
    resolve(folder, "medienkit/index.html"),
    "utf8",
  );
  assert.ok(
    requests.some((request) => request.type === "media-kit"),
    "Media-kit CMS did not activate.",
  );
  if (mode === "empty") {
    assert.match(downloads, /Downloads in Vorbereitung/);
    assert.equal(downloads.includes('class="media-download"'), false);
    assert.equal(downloads.includes("PK-Hockey-Academy-Logo.png"), false);
  } else {
    assert.match(downloads, /Technischer Testdownload A/);
    assert.match(downloads, /Technischer Testdownload B/);
    assert.match(downloads, /Technischer Nutzungshinweis/);
    assert.match(downloads, /keine abgestimmten Nutzungshinweise/);
    assert.match(
      downloads,
      /cdn\.sanity\.io\/files\/cmsqa123\/qa\/abc.pdf\?dl=Academy-Test.pdf/,
    );
    if (mode === "public") {
      assert.ok(
        downloads.indexOf("Testdownload B") <
          downloads.indexOf("Testdownload A"),
      );
      assert.match(downloads, /Geänderter technischer Downloadtext/);
      assert.match(downloads, /def.png\?dl=Academy-Test-Edited.png/);
    } else {
      assert.ok(
        downloads.indexOf("Testdownload A") <
          downloads.indexOf("Testdownload B"),
      );
      assert.match(downloads, /&lt;script&gt;window.__downloadXss/);
      assert.equal(downloads.includes("<script>window.__downloadXss"), false);
    }
  }
  const socialPage = await readFile(
    resolve(folder, "galerie/index.html"),
    "utf8",
  );
  assert.ok(
    requests.some((request) => request.type === "social"),
    "Social CMS configuration did not activate.",
  );
  if (mode === "empty") {
    assert.equal(socialPage.includes("Technischer Testbeitrag"), false);
  } else {
    assert.match(socialPage, /Technischer Testbeitrag/);
    assert.match(
      socialPage,
      /href="https:\/\/www.instagram.com\/p\/fixture123\/"/,
    );
    assert.match(
      socialPage,
      /href="https:\/\/www.instagram.com\/fixtureacademy\/"/,
    );
    assert.match(socialPage, /Dieser Beitrag ist aktuell nicht verfügbar/);
    assert.equal(socialPage.includes("<script>window.__socialXss"), false);
    assert.match(socialPage, /&lt;script&gt;window.__socialXss/);
    assert.equal(socialPage.includes("instagram.com/embed"), false);
    assert.equal(socialPage.includes("connect.facebook.net"), false);
  }
  if (mode === "normal" || mode === "public") {
    assert.match(pool, /Technisches Testprofil A/);
    assert.match(pool, /Technisches Testprofil B/);
    const firstName =
      mode === "public"
        ? "Technisches Testprofil B"
        : "Technisches Testprofil A";
    const secondName =
      mode === "public"
        ? "Technisches Testprofil A"
        : "Technisches Testprofil B";
    assert.ok(pool.indexOf(firstName) < pool.indexOf(secondName));
    assert.match(pool, /&lt;script&gt;/);
    assert.equal(pool.includes("<script>window.__coachXss"), false);
    assert.ok(home.includes(firstName));
    assert.equal(home.includes(secondName), false);
    if (mode === "public") {
      assert.match(pool, /Geänderte Testrolle/);
      assert.match(pool, /def-800x1000/);
      const gallery = await readFile(
        resolve(folder, "galerie/index.html"),
        "utf8",
      );
      const album = await readFile(
        resolve(folder, "galerie/cms-test-album/index.html"),
        "utf8",
      );
      assert.match(gallery, /Technisches Testalbum/);
      assert.match(album, /Technisches Testalbum/);
      assert.doesNotMatch(album, /gallery-goalie\./);
      assert.match(album, /https:\/\/cdn\.sanity\.io\/images\/cmsqa123\/qa\//);
    }
  } else {
    assert.match(pool, /Aktuell sind keine Trainerprofile veröffentlicht/);
    assert.equal(pool.includes("Pierre Klein"), false);
    assert.equal(home.includes("trainer-feature"), false);
  }
  const admin = await readFile(
    resolve(folder, "verwaltung/index.html"),
    "utf8",
  );
  assert.match(admin, /href="https:\/\/pk-hockey-academy\.sanity\.studio\/"/);
  assert.match(admin, /content="noindex,nofollow"/);
  console.log(
    `${mode}: CMS activation, rendering and ${await scan(folder, false)} public text artifacts passed.`,
  );
}
const launch = await build("launch-gates", {
  PUBLIC_LAUNCH_READY: "true",
  SITE_URL: "https://pkhockeyacademy.de",
});
assert.equal(
  launch.result.status,
  0,
  launch.result.stdout + launch.result.stderr,
);
for (const route of [
  "interviews",
  "spieler-interview",
  "trainer-interview",
]) {
  const html = await readFile(
    resolve(launch.folder, route, "index.html"),
    "utf8",
  );
  assert.equal(
    /<(input|textarea|form)(?:\s|>)/i.test(html),
    false,
    route + " exposed test inputs at launch",
  );
}
const launchSitemap = await readFile(
  resolve(launch.folder, "sitemap.xml"),
  "utf8",
);
for (const route of [
  "interviews",
  "spieler-interview",
  "trainer-interview",
])
  assert.equal(launchSitemap.includes("/" + route), false);
console.log(
  "Launch gates passed: no interview test inputs or sitemap entries.",
);
await writeFile(
  manifest,
  JSON.stringify(
    {
      schemaVersion: 1,
      complete: true,
      starter: relative(webRoot, starter.folder),
      training: relative(webRoot, resolve(output, "public/client")),
    },
    null,
    2,
  ),
);
console.log(`CMS integration passed. Browser manifest: ${manifest}`);
