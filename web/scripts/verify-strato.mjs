import assert from "node:assert/strict";
import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { loadEnv } from "vite";

export async function verifyStrato() {
  await rm(new URL("../../output/strato/READY.json", import.meta.url), { force: true });
  const root = fileURLToPath(new URL("../../output/strato/public/", import.meta.url));
  const walk = async (folder) => (await Promise.all(
    (await readdir(folder, { withFileTypes: true })).map((entry) =>
      entry.isDirectory() ? walk(resolve(folder, entry.name)) : resolve(folder, entry.name)),
  )).flat();
  const files = await walk(root);
  const names = files.map((file) => relative(root, file).replaceAll("\\", "/"));
  for (const route of ["index.html", "training/index.html", "trainingstermine/index.html", "trainerpool/index.html", "anmeldung/index.html", "404.html", ".htaccess", "api/registration.php", "api/preview-unavailable.php"])
    assert.ok(names.includes(route), `Missing STRATO artifact: ${route}`);
  for (const name of names) {
    assert.ok(!/(^|\/)(node_modules|server|redaktion|\.vercel|\.env[^/]*)(\/|$)/.test(name), `Runtime/private artifact: ${name}`);
    assert.ok(!/\.(mjs|ts|astro|map)$/.test(name), `Source/server artifact: ${name}`);
  }
  const env = loadEnv("production", fileURLToPath(new URL("../", import.meta.url)), "");
  const privateTokens = [env.SANITY_PREVIEW_READ_TOKEN, env.SANITY_READ_TOKEN].filter(Boolean);
  for (const file of files.filter((file) => /\.(html|js|json|css|txt|xml)$/.test(file))) {
    const content = await readFile(file, "utf8");
    for (const token of privateTokens)
      assert.ok(!content.includes(token), "Private CMS token in STRATO output");
    assert.ok(!content.includes('id="pk-visual-editing"'), "Draft preview exported");
  }
  await writeFile(new URL("../../output/strato/READY.json", import.meta.url), JSON.stringify({
    target: "strato", files: files.length, verifiedAt: new Date().toISOString(),
    registration: "inactive", privatePreview: "unavailable", hostingVerified: false,
  }, null, 2) + "\n");
  console.log(`Verified ${files.length} STRATO files; no Node server. Hosting/PHP acceptance remains pending.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyStrato();
