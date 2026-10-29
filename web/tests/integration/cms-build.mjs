import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputRoot = resolve(webRoot, "../output");
await mkdir(outputRoot, { recursive: true });
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
  SANITY_TRAINERS_ENABLED: "false",
  SANITY_SOCIAL_ENABLED: "false",
  PUBLIC_SANITY_STUDIO_URL: "",
  NODE_OPTIONS: "",
  // Exercise the hosting adapter. Its bundled functions also let isolated
  // artifacts live outside web/, without Node's external dependency lookup.
  VERCEL: "1",
};
const build = (name, settings) => {
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

const starter = build("starter", {});
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
]) {
  const trace = resolve(output, `${mode}-requests.jsonl`);
  const { folder, result } = build(mode, {
    SANITY_PROJECT_ID: "cmsqa123",
    SANITY_DATASET: "qa",
    SANITY_READ_TOKEN: mode === "public" ? "" : "test-token-never-real",
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
  if (mode !== "malformed-gallery") {
    assert.ok(
      requests.some((request) => request.type === "trainers"),
      "Server-only coach configuration was not activated.",
    );
  }
  assert.ok(
    requests.every(
      (request) =>
        request.perspective === "published" &&
        request.authenticated === (mode !== "public") &&
        request.hasAuthorization === (mode !== "public"),
    ),
    "Unexpected CMS transport configuration.",
  );
  if (mode === "malformed" || mode === "malformed-gallery") {
    assert.notEqual(result.status, 0);
    assert.match(
      result.stdout + result.stderr,
      mode === "malformed"
        ? /approved trainer profile has invalid required fields/
        : /approved gallery album.*invalid content/,
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
  const pool = await readFile(
    resolve(folder, "trainerpool/index.html"),
    "utf8",
  );
  const home = await readFile(resolve(folder, "index.html"), "utf8");
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
console.log(`CMS integration passed. Isolated artifacts retained at ${output}`);
