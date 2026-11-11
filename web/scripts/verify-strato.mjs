import assert from "node:assert/strict";
import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { loadEnv } from "vite";
import { createHash } from "node:crypto";

export async function verifyStrato(output=new URL('../../output/strato/',import.meta.url)) {
  await rm(new URL('READY.json',output), { force: true });
  const root = fileURLToPath(new URL('public/',output));
  const walk = async (folder) => (await Promise.all(
    (await readdir(folder, { withFileTypes: true })).map((entry) =>
      entry.isDirectory() ? walk(resolve(folder, entry.name)) : resolve(folder, entry.name)),
  )).flat();
  const files = await walk(root);
  const names = files.map((file) => relative(root, file).replaceAll("\\", "/"));
  for (const route of ["index.html", "training/index.html", "trainingstermine/index.html", "trainerpool/index.html", "anmeldung/index.html", "404.html", ".htaccess", "api/registration.php", "api/preview-unavailable.php"])
    assert.ok(names.includes(route), `Missing STRATO artifact: ${route}`);
  for (const name of names) {
    assert.ok(!/(^|\/)(node_modules|server|staff|redaktion|\.vercel|\.env[^/]*)(\/|$)/.test(name), `Runtime/private artifact: ${name}`);
    assert.ok(!/\.(mjs|ts|astro|map)$/.test(name), `Source/server artifact: ${name}`);
  }
  for(const route of ['interviews','spieler-interview','trainer-interview']) {
    const html=await readFile(resolve(root,route,'index.html'),'utf8');
    assert.ok(!/<(?:input|textarea|form)(?:\s|>)/i.test(html)&&!html.includes('data-interview='),'Interview input exposed on STRATO');
    assert.match(html,/content="noindex,nofollow"/,'Deferred interview route must stay noindex');
  }
  const env = loadEnv("production", fileURLToPath(new URL("../", import.meta.url)), "");
  const privateTokens = [env.SANITY_PREVIEW_READ_TOKEN, env.SANITY_READ_TOKEN].filter(Boolean);
  for (const file of files) {
    const bytes = await readFile(file);
    for (const token of privateTokens)
      assert.ok(!bytes.includes(Buffer.from(token)), "Private CMS token in STRATO output");
    if(!/\.(html|js|json|css|txt|xml)$/.test(file))continue;
    const content=bytes.toString('utf8');
    const privateTemplate=relative(root,file).replaceAll('\\','/')==='api/preview-lib/preview-shell.html';
    assert.ok(privateTemplate||!content.includes('id="pk-visual-editing"'), "Draft preview exported");
  }
  const inventory = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(file);
    return { path: relative(root, file).replaceAll("\\", "/"), size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex") };
  }));
  inventory.sort((a, b) => a.path.localeCompare(b.path, "en"));
  await writeFile(new URL('READY.json',output), JSON.stringify({
    schemaVersion: 1, target: "strato", files: files.length, inventory,
    contentHash: createHash("sha256").update(JSON.stringify(inventory)).digest("hex"),
    verifiedAt: new Date().toISOString(),
    registration: "inactive", privatePreview: names.includes('api/editor.php') ? 'php-candidate' : 'unavailable', hostingVerified: false,
  }, null, 2) + "\n");
  console.log(`Verified ${files.length} STRATO files; no Node server. This artifact check does not replace host acceptance.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyStrato();
