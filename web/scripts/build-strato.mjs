import { spawnSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { verifyStrato } from "./verify-strato.mjs";
import {packageStratoPreview} from './package-strato-preview.mjs';

const web = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../../output/strato/", import.meta.url);
// An old successful artifact must not survive a failed rebuild as deployable output.
await mkdir(output, { recursive: true });
await rm(new URL("READY.json", output), { force: true });
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url)),
  "build", "--outDir", "../output/strato/public",
], {
  cwd: web,
  env: { ...process.env, DEPLOY_TARGET: "strato" },
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
await cp(new URL("../../hosting/strato/public/", import.meta.url), new URL("public/", output), { recursive: true });
await packageStratoPreview();
await verifyStrato();
