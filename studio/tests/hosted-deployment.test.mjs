import test from 'node:test';
import assert from 'node:assert/strict';
import { getHostedDeploymentEnv } from '../lib/hosted-deployment.mjs';

test('hosted deployment overrides local preview and keeps the remaining configuration', () => {
  const env = { SANITY_STUDIO_PREVIEW_URL: 'http://localhost:4322', SANITY_STUDIO_HOSTED_PREVIEW_URL: 'https://academy.vercel.app/', SANITY_STUDIO_PREVIEW_TRANSPORT: '', SANITY_STUDIO_PROJECT_ID: 'fixture' };
  const result = getHostedDeploymentEnv(env);
  assert.equal(result.SANITY_STUDIO_PREVIEW_URL, 'https://academy.vercel.app');
  assert.equal(result.SANITY_STUDIO_PROJECT_ID, 'fixture');
  assert.equal(result.SANITY_STUDIO_PREVIEW_TRANSPORT, '');
  assert.equal(env.SANITY_STUDIO_PREVIEW_URL, 'http://localhost:4322');
});

test('hosted deployment rejects missing/local/unsafe origins and stale builds', () => {
  for (const value of [undefined, '', 'http://localhost:4322', 'https://localhost', 'http://example.org', 'https://user:password@example.org', 'https://example.org/path', 'https://example.org/?token=secret', 'https://example.org/#fragment']) {
    assert.throws(() => getHostedDeploymentEnv({ SANITY_STUDIO_HOSTED_PREVIEW_URL: value }));
  }
  for (const arg of ['--no-build', '--build=false']) {
    assert.throws(() => getHostedDeploymentEnv({ SANITY_STUDIO_HOSTED_PREVIEW_URL: 'https://academy.vercel.app' }, [arg]));
  }
});
