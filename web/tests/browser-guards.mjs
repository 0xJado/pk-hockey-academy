// Mutate disposable compiled copies, never application source or live content.
import assert from "node:assert/strict";
import { cp, readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const webRoot = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(webRoot, "../output");
const manifest = JSON.parse(
  await readFile(resolve(output, "cms-integration-manifest.json"), "utf8"),
);
assert.equal(manifest.complete, true, "Run test:cms first");
const directory = await mkdtemp(resolve(output, "browser-guards-"));
const results = [];
for (const mode of ["overflow", "navigation"]) {
  const root = resolve(directory, mode);
  await cp(resolve(webRoot, manifest.starter), root, { recursive: true });
  const home = resolve(root, "index.html");
  const original = await readFile(home, "utf8");
  const changed =
    mode === "overflow"
      ? original.replace(
          "</head>",
          "<style>html{min-width:2000px!important}</style></head>",
        )
      : original.replace(
          /(class="header-cta"[^>]*href=")\/trainingstermine"/,
          '$1/missing-test-route"',
        );
  assert.notEqual(changed, original, `Mutation was not applied: ${mode}`);
  await writeFile(home, changed);
  const evidence = resolve(output, "playwright/guards", mode);
  await mkdir(evidence, { recursive: true });
  const result = spawnSync(
    process.execPath,
    [resolve(webRoot, "tests/browser.mjs")],
    {
      cwd: webRoot,
      env: {
        ...process.env,
        PK_BROWSER_ROOT: root,
        PK_BROWSER_OUTPUT: evidence,
        PK_TRAINING_FIXTURE: "false",
      },
      encoding: "utf8",
      timeout: 180000,
    },
  );
  await writeFile(
    resolve(evidence, "run.log"),
    (result.stdout ?? "") + (result.stderr ?? ""),
  );
  if (result.error) throw result.error;
  assert.notEqual(result.status, 0, `Browser suite falsely passed ${mode}`);
  const log = result.stdout + result.stderr;
  assert.match(
    log,
    mode === "overflow" ? /at 1440/ : /page.waitForURL: Timeout/,
    `Unexpected failure: ${mode}`,
  );
  if (mode === "navigation")
    assert.match(
      log,
      /trainingstermine/,
      "Navigation guard failed for an unrelated reason",
    );
  results.push({ mode, expectedFailure: true });
  console.log(`${mode}: browser suite rejected the broken compiled site.`);
}
await writeFile(
  resolve(output, "playwright/guards/result.json"),
  JSON.stringify(results, null, 2),
);
