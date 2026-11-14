// Protected host acceptance. No public activation: only this browser's DOM is
// enabled, and intercepted API calls target a disposable, dual-auth helper with
// uniquely scoped fictional tables. Canonical intake stays inactive throughout.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '../../web/node_modules/playwright/index.mjs';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,browser,step='setup',checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
try {
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
 assert.ok(paths.privateOutsidePublic);
 const token=randomBytes(32).toString('base64url'),prefix='pk_fixture_'+randomBytes(6).toString('hex')+'_';
 const sources={};for(const name of ['Policy.php','Intake.php','Http.php','Config.php','Sessions.php','policy.v1.json'])sources[name]=(await readFile(new URL('registration/'+name,import.meta.url))).toString('base64');
 const sourceHash=sha256(JSON.stringify(sources)).slice(0,24),config=JSON.parse(await readFile(new URL('registration/config.example.json',import.meta.url),'utf8'));
 let helper=await readFile(new URL('registration/acceptance.php.template',import.meta.url),'utf8');
 for(const [key,value] of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({prefix,private:paths.privatePath,public:paths.publicPath,sourceHash})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64'),CONFIG:Buffer.from(JSON.stringify(config)).toString('base64'),SOURCE_CONFIG:Buffer.from(JSON.stringify(config.sanity)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
 connection=await connect();const store=new SftpReleaseStore(connection.call);
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const remote='.pk-releases/'+release+'/api/pk-form-acceptance-'+randomUUID()+'.php';
  const url='https://pkhockeyacademy.de/api/'+remote.split('/').at(-1);
  const request=async(action)=>{const r=await fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(30000),headers:{Authorization:authorization,'X-PK-Setup-Token':token,'X-PK-Fixture-Action':action,Origin:'https://pkhockeyacademy.de','Content-Type':'application/json'},body:'{}'});return {status:r.status,body:await r.json()};};
  let setup=false;
  try {
   step='upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   setup=true;check((await request('setup')).body.ready,'isolated MariaDB fixture ready');
   browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
   const context=await browser.newContext({httpCredentials:{username:env.STRATO_PREVIEW_USERNAME,password:env.STRATO_PREVIEW_PASSWORD,origin:'https://pkhockeyacademy.de'},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   step='protected_form';await page.goto('https://pkhockeyacademy.de/anmeldung');
   check(await page.locator('[name=childName]').isDisabled(),'served form remains disabled');
   for(const width of [1440,768,375]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'protected form no overflow '+width);}
   // Ephemeral test-browser state only. Never alter served HTML or host flags.
   await page.locator('[data-training-request]').evaluate(root=>{root.dataset.enabled='true';document.dispatchEvent(new Event('astro:page-load'));});
   check(await page.locator('[name=childName]').isEnabled(),'fictional browser fixture enabled');
   let lost=false;const writes=[];
   await context.route('https://pkhockeyacademy.de/api/registration**',async route=>{
    const request=route.request(),isToken=new URL(request.url()).pathname.endsWith('/token');
    if(!isToken)writes.push({body:request.postData(),key:request.headers()['idempotency-key']});
    const response=await route.fetch({url,headers:{...request.headers(),Authorization:authorization,'X-PK-Setup-Token':token,'X-PK-Fixture-Action':isToken?'token':'submit'}});
    if(!isToken&&!lost){lost=true;return route.abort('failed');}
    return route.fulfill({response});
   });
   await page.locator('[name=bookingType][value=five]').check();
   for(const [name,value] of Object.entries({childName:'FIKTIVES HOST-BROWSER-KIND',birthYear:'2017',guardianName:'FIKTIVER HAUPTKONTAKT',guardianPhone:'+49 000 000000',guardianEmail:'host-browser@example.invalid'}))await page.locator(`[name=${name}]`).fill(value);
   await page.locator('[name=guardianAuthority]').check();
   step='lost_receipt';await page.getByRole('button',{name:'Trainingsanfrage senden',exact:true}).click();
   await page.getByRole('button',{name:'Dieselbe Anfrage erneut prüfen'}).waitFor();
   let summary=await request('summary');check(summary.body.records===1&&summary.body.claims===1&&summary.body.encrypted,'committed fictional encrypted request despite lost receipt');
   check((await page.locator('[data-feedback]').innerText()).includes('nicht bestätigt'),'no false success after lost receipt');
   await page.getByRole('button',{name:'Dieselbe Anfrage erneut prüfen'}).click();
   await page.waitForFunction(()=>document.querySelector('[data-feedback]')?.textContent?.includes('entgegengenommen'));
   summary=await request('summary');check(summary.body.records===1&&summary.body.claims===1,'host retry creates no duplicate');
   check(writes.length===2&&writes[0].body===writes[1].body&&writes[0].key===writes[1].key,'same host retry bytes and token');
   check(await page.evaluate(()=>localStorage.length===0&&sessionStorage.length===0),'no browser persistence');
   check(errors.length===0,'no protected-host runtime errors');
   await context.unroute('https://pkhockeyacademy.de/api/registration**');
   await page.reload();check(await page.locator('[name=childName]').isDisabled(),'reload restores disabled public form');
   await browser.close();browser=undefined;
  } finally {
   await browser?.close();browser=undefined;
   try {if(setup){const result=await request('cleanup');check(result.status===200&&result.body.fixtureTablesRemaining===0,'fictional host tables removed');}}
   finally {if(await store.exists(remote))await store.remove(remote);check(!await store.exists(remote),'temporary helper removed');}
  }
  check(sha256(await store.get('.htaccess'))===sha256(router),'router/auth unchanged');
  let status;for(let attempt=0;attempt<12;attempt++){const r=await fetch(url,{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});status=r.status;await r.body?.cancel();if(status===404)break;await new Promise(r=>setTimeout(r,500));}
  check(status===404,'removed helper returns 404');
  const inactive=await fetch('https://pkhockeyacademy.de/api/registration',{method:'POST',headers:{Authorization:authorization},signal:AbortSignal.timeout(15000)});check(inactive.status===503,'canonical intake remains inactive');await inactive.body?.cancel();
 });
 const report={passed:true,checks,actualProtectedHost:true,actualMariaDB:true,fictionalRecordsRemoved:true,temporaryHelperRemoved:true,publicIntakeEnabled:false,realDataUsed:false,staffHttpHandoffVerified:false,at:new Date().toISOString()};
 await writeFile(new URL('registration-form-host-acceptance.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report));
}catch{console.error('Protected form acceptance failed at '+step+'. Check private fixture cleanup; no public activation was requested.');process.exitCode=1;}
finally{await browser?.close();connection?.close();}
