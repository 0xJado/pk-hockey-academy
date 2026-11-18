// Public cutover smoke check. Never sends a participant record or staff credentials.
import assert from 'node:assert/strict';

const origin = 'https://pkhockeyacademy.de';
async function read(path, status, options = {}) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'manual', signal: AbortSignal.timeout(15000), ...options,
  });
  assert.equal(response.status, status, `${path} returned ${response.status}, expected ${status}`);
  return response;
}

export async function verifyPublicRelease() {
  const home = await read('/', 200);
  assert.doesNotMatch(home.headers.get('x-robots-tag') || '', /noindex/i);
  assert.doesNotMatch(await home.text(), /name="robots"[^>]*content="[^"]*noindex/i);
  const robots = await (await read('/robots.txt', 200)).text();
  assert.match(robots, /^Allow:\s*\/\s*$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m);
  const sitemap = await (await read('/sitemap.xml', 200)).text();
  assert.ok(sitemap.includes('<loc>' + origin + '/trainingstermine</loc>'));
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/(?:intern|redaktion|spieler-interview|trainer-interview|interviews)\b/);
  await read('/trainingstermine', 200);
  const form = await (await read('/anmeldung', 200)).text();
  assert.match(form, /data-training-request[^>]*data-enabled="true"/);
  const staff = await read('/intern/anmeldungen', 200);
  assert.match(staff.headers.get('cache-control') || '', /no-store/);
  assert.match(await staff.text(), /autocomplete="current-password"/);
  for (const path of ['/.pk-registration-location.json', '/.pk-state/', '/api/preview-lib/Preview.php']) {
    await read(path, 403);
  }
  await verifyIntakeToken();
  console.log('Public pages, indexing, registration form and token service, staff login and private paths verified.');
}

export async function verifyIntakeToken(headers = {}) {
  const ticket = await read('/api/registration/token', 200, {
    method: 'POST', headers: { ...headers, Origin: origin, 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.match(ticket.headers.get('cache-control') || '', /no-store/);
  const payload = await ticket.json();
  assert.equal(payload.code, 'request-token');
  assert.ok(typeof payload.token === 'string' && payload.token.length > 0);
}
if (import.meta.main) await verifyPublicRelease();
