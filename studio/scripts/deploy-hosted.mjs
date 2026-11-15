import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getHostedDeploymentEnv } from '../lib/hosted-deployment.mjs';

const args = process.argv.slice(2);
const env = getHostedDeploymentEnv(process.env, args);
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/@sanity/cli/bin/run.js', import.meta.url)),
  'deploy', '--schema-required', ...args,
], { cwd: fileURLToPath(new URL('../', import.meta.url)), env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
