// Read-only acceptance of the existing protected host. Never activates intake.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {resolveMx} from 'node:dns/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';

const origin='https://pkhockeyacademy.de';
const checks=[];
let connection;
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
try {
  const env=await settings();
  const headers={Authorization:'Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64')};
  connection=await connect();
  const before=await connection.call('readFile','.htaccess');
  authLayer(before.toString());
  const release=activeRelease(before.toString());
  check(release!=='legacy','versioned release selected');
  async function request(path,{anonymous=false,method='GET',www=false}={}) {
    const response=await fetch((www?'https://www.pkhockeyacademy.de':origin)+path,{
      method,headers:anonymous?{}:headers,redirect:'manual',signal:AbortSignal.timeout(20000),
    });
    const body=await response.text();
    return {response,body};
  }
  check((await request('/',{anonymous:true})).response.status===401,'anonymous website protected');
  const home=await request('/');
  check(home.response.status===200,'authenticated HTTPS website available');
  check(/noindex/i.test(home.response.headers.get('x-robots-tag')||'')||/name="robots"[^>]*content="[^"]*noindex/i.test(home.body),'homepage indexing disabled');
  check(!/vercel\.app|localhost:\d+/i.test(home.body),'homepage has no obsolete hosting destination');
  const www=await request('/trainingstermine',{www:true});
  check(www.response.status===308&&www.response.headers.get('location')===origin+'/trainingstermine','www preserves route to canonical HTTPS root');
  for(const [path,method] of [['/api/registration','POST'],['/api/registration/token','POST']]) {
    check((await request(path,{method})).response.status===503,'disabled route '+path);
  }
  const staff=await request('/intern/anmeldungen');
  check(staff.response.status===200&&staff.body.includes('autocomplete="current-password"')
    &&/no-store/i.test(staff.response.headers.get('cache-control')||''),'staff login required and never cached');
  const registration=await request('/anmeldung');
  check(registration.response.status===200&&/data-enabled="false"/.test(registration.body),'public form rendered disabled');
  check(/<fieldset[^>]*data-controls[^>]*disabled/.test(registration.body),'form disabled before JavaScript');
  check(!/Google Sheet|Google-Tabelle|spielerplus\.de/i.test(registration.body),'registration has no retired submission dependency');
  const robots=await request('/robots.txt');
  check(robots.response.status===200&&/^Disallow:\s*\/\s*$/m.test(robots.body),'robots disallows crawling');
  for(const path of ['/sitemap.xml','/sitemap-index.xml']) {
    const sitemap=await request(path);
    check([403,404].includes(sitemap.response.status)||
      (sitemap.response.status===200&&!/<loc>/i.test(sitemap.body)),'no indexed URLs exposed through '+path);
  }
  for(const path of ['/.env','/.env.local','/.git/config','/.pk-registration-location.json','/.pk-state/',
    '/.pk-releases/'+release+'/manifest.json','/api/preview-lib/Preview.php','/node_modules/',
    '/src/','/manifest.json','/previous.json','/private/']) {
    check([403,404].includes((await request(path)).response.status),'private/source URL denied '+path.replace(release,'[active-release]'));
  }
  for(const path of ['/impressum','/datenschutz']) {
    const page=await request(path);
    check(page.response.status===200,'legal page available '+path);
    check(/info@pkhockeyacademy\.de/.test(page.body),'confirmed legal contact '+path);
    check(!/vercel|Google Sheet/i.test(page.body),'production provider scope '+path);
  }
  const mx=await resolveMx('pkhockeyacademy.de');
  check(mx.length===1&&mx[0].exchange.replace(/\.$/,'').toLowerCase()==='smtpin.rzone.de','mail matches the accepted STRATO MX baseline');
  const after=await connection.call('readFile','.htaccess');
  check(sha256(before)===sha256(after),'routing unchanged during read-only checks');
  const report={passed:true,at:new Date().toISOString(),release,checks:checks.length,labels:checks,
    productionMutated:false,intakeActivated:false};
  await writeFile(new URL('protected-release-verification.json',privateRoot),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:true,release,checks:checks.length,productionMutated:false}));
} catch(error) {
  // Never print response content, request headers, SFTP paths or credentials.
  console.error('Protected release verification failed after '+checks.length+' passed checks. '+(error instanceof assert.AssertionError?error.message:'Inspect connectivity privately.'));
  process.exitCode=1;
} finally {connection?.close();}
