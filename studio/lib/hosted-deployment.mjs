// Hosted builds must not inherit the local development iframe destination.
export function getHostedDeploymentEnv(env, args = []) {
  const value = env.SANITY_STUDIO_HOSTED_PREVIEW_URL?.trim();
  if (!value) throw new Error('Set SANITY_STUDIO_HOSTED_PREVIEW_URL to the accepted hosted preview origin before deploying.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname === 'localhost' ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Hosted preview must use an HTTPS origin without credentials, paths or query parameters.');
  }
  if (url.origin !== 'https://pkhockeyacademy.de') {
    throw new Error('Hosted Studio uses the accepted STRATO preview at https://pkhockeyacademy.de.');
  }
  if (args.some(arg => arg === '--no-build' || arg.startsWith('--build='))) {
    throw new Error('Hosted deployment must rebuild Studio with the hosted preview configuration.');
  }
  return { ...env, SANITY_STUDIO_PREVIEW_URL: url.origin, SANITY_STUDIO_PREVIEW_TRANSPORT: 'php-fragment' };
}
