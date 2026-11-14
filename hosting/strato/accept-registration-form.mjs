// Protected host acceptance. No public activation: only this browser's DOM is
// enabled, and intercepted API calls target a disposable, dual-auth helper with
// uniquely scoped fictional tables. Canonical intake stays inactive throughout.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '../../web/node_modules/playwright/index.mjs';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,browser,step='setup',checks=0,lastCheck='';
const connected=process.argv.includes('--with-staff');
const check=(value,label)=>{lastCheck=label;assert.ok(value,label);checks++;};
try {
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
 assert.ok(paths.privateOutsidePublic);
 const token=randomBytes(32).toString('base64url'),prefix='pk_fixture_'+randomBytes(6).toString('hex')+'_';
 const sources={};
 const files=connected?{'Policy.php':'registration/Policy.php','Intake.php':'registration/Intake.php','IntakeHttp.php':'registration/Http.php','policy.v1.json':'registration/policy.v1.json','Staff.php':'staff/Staff.php','Http.php':'staff/Http.php','Maintenance.php':'staff/Maintenance.php'}
  :Object.fromEntries(['Policy.php','Intake.php','Http.php','Config.php','Sessions.php','policy.v1.json'].map(name=>[name,'registration/'+name]));
 for(const[name,path]of Object.entries(files))sources[name]=(await readFile(new URL(path,import.meta.url))).toString('base64');
 const sourceHash=sha256(JSON.stringify(sources)).slice(0,24),config=JSON.parse(await readFile(new URL('registration/config.example.json',import.meta.url),'utf8'));
 let helper=await readFile(new URL(connected?'staff/acceptance.php.template':'registration/acceptance.php.template',import.meta.url),'utf8');
 for(const [key,value] of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({prefix,private:paths.privatePath,public:paths.publicPath,sourceHash,hash:sourceHash})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64'),CONFIG:Buffer.from(JSON.stringify(config)).toString('base64'),SOURCE_CONFIG:Buffer.from(JSON.stringify(config.sanity)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 const actionHeader=connected?'X-PK-Staff-Action':'X-PK-Fixture-Action',password=randomBytes(32).toString('base64url');
 const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
 connection=await connect();const store=new SftpReleaseStore(connection.call);
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const remote='.pk-releases/'+release+'/api/pk-form-acceptance-'+randomUUID()+'.php';
  const url='https://pkhockeyacademy.de/api/'+remote.split('/').at(-1);
  const request=async(action)=>{const r=await fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(30000),headers:{Authorization:authorization,'X-PK-Setup-Token':token,[actionHeader]:connected&&action==='setup'?'setup-empty':action,...(connected?{'X-PK-Fixture-Password':password}:{}),Origin:'https://pkhockeyacademy.de','Content-Type':'application/json'},body:'{}'});return {status:r.status,body:await r.json()};};
  let setup=false,page;
  try {
   step='upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   setup=true;check((await request('setup')).body.ready,'isolated MariaDB fixture ready');
   browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
   const context=await browser.newContext({httpCredentials:{username:env.STRATO_PREVIEW_USERNAME,password:env.STRATO_PREVIEW_PASSWORD,origin:'https://pkhockeyacademy.de'},reducedMotion:'reduce'});
   page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   step='protected_form';await page.goto('https://pkhockeyacademy.de/anmeldung');
   check(await page.locator('[name=childName]').isDisabled(),'served form remains disabled');
   step='protected_viewports';for(const width of [1440,768,375]){await page.setViewportSize({width,height:1000});await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'protected form no overflow '+width);}
   // Ephemeral test-browser state only. Never alter served HTML or host flags.
   step='fictional_dom_enable';await page.locator('[data-training-request]').evaluate(root=>{root.dataset.enabled='true';document.dispatchEvent(new Event('astro:page-load'));});
   check(await page.locator('[name=childName]').isEnabled(),'fictional browser fixture enabled');
   let lost=false;const writes=[];
   await context.route('https://pkhockeyacademy.de/api/registration**',async route=>{
    const request=route.request(),isToken=new URL(request.url()).pathname.endsWith('/token');
    if(!isToken)writes.push({body:request.postData(),key:request.headers()['idempotency-key']});
    const response=await route.fetch({url,headers:{...request.headers(),Authorization:authorization,'X-PK-Setup-Token':token,[actionHeader]:isToken?'token':'submit'}});
    if(!isToken&&!lost){lost=true;return route.abort('failed');}
    return route.fulfill({response});
   });
   await page.locator('[name=bookingType][value=five]').check();
   for(const [name,value] of Object.entries({childName:'FIKTIVES HOST-BROWSER-KIND',birthYear:'2017',guardianName:'FIKTIVER HAUPTKONTAKT',guardianPhone:'+49 000 000000',guardianEmail:'host-browser@example.invalid'}))await page.locator(`[name=${name}]`).fill(value);
   await page.locator('[name=guardianAuthority]').check();
   if(connected){await page.locator('[name=consent-health]').check();await page.locator('[name=healthNotes]').fill('FIKTIVER VERBUND-TESTHINWEIS');}
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
   if(connected){
    step='connected_staff';const summary=await request('summary');check(summary.body.productionRequests===0&&summary.body.productionUsers===0,'production records/accounts remain empty');
    await page.setExtraHTTPHeaders({'X-PK-Setup-Token':token});
    step='staff_anonymous';await page.goto(url+'?record='+summary.body.id);check(!(await page.locator('body').innerText()).includes('FIKTIVES HOST-BROWSER-KIND'),'anonymous staff detail hides browser submission');
    step='staff_login_fields';
    await page.getByLabel('Kennung',{exact:true}).fill('fixture-owner');await page.getByLabel('Passwort',{exact:true}).fill(password);
    step='staff_login';await page.getByRole('button',{name:'Anmelden',exact:true}).click();
    step='staff_listing';
    await page.getByRole('link',{name:'FIKTIVES HOST-BROWSER-KIND',exact:true}).click();step='staff_detail';
    check((await page.locator('body').innerText()).includes('FIKTIVER VERBUND-TESTHINWEIS'),'browser submission decrypted in authenticated staff HTTP UI');
    for(const width of [1440,768,375]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'connected staff UI no overflow '+width);}
    step='staff_confirm';await page.locator('select[name=action]').first().selectOption('confirmed');await page.locator('[name=confirmedOutside]').check();
    await page.getByRole('button',{name:'Stand speichern',exact:true}).click();
    const confirmed=await request('summary');check(confirmed.body.status==='confirmed'&&confirmed.body.confirmations===1,'human confirmation recorded once for browser request');
    await page.getByRole('link',{name:'FIKTIVES HOST-BROWSER-KIND',exact:true}).click();
    step='staff_withdrawal';await page.getByRole('button',{name:'Widerruf speichern',exact:true}).click();
    await page.getByRole('link',{name:'FIKTIVES HOST-BROWSER-KIND',exact:true}).click();
    check(!(await page.locator('body').innerText()).includes('FIKTIVER VERBUND-TESTHINWEIS'),'health withdrawal removes browser-submitted care note');
    step='staff_logout';await page.getByRole('button',{name:'Abmelden',exact:true}).click();
    await page.goto(url+'?record='+summary.body.id);check(!(await page.locator('body').innerText()).includes('FIKTIVES HOST-BROWSER-KIND'),'signed-out browser cannot reopen submitted record');
   }
   await browser.close();browser=undefined;
  } catch(error) {
   await writeFile(new URL('registration-connected-failure.json',privateRoot),JSON.stringify({step,lastCheck,checks,viewport:page?.viewportSize()}),{mode:0o600});
   await page?.screenshot({path:fileURLToPath(new URL('registration-connected-failure.png',privateRoot)),fullPage:true}).catch(()=>{});
   throw error;
  } finally {
   await browser?.close();browser=undefined;
   try {if(setup){const result=await request('cleanup');check(result.status===200&&(connected?result.body.tablesRemaining===0&&result.body.privateFixtureRemoved:result.body.fixtureTablesRemaining===0),'fictional host tables removed');}}
   finally {if(await store.exists(remote))await store.remove(remote);check(!await store.exists(remote),'temporary helper removed');}
  }
  check(sha256(await store.get('.htaccess'))===sha256(router),'router/auth unchanged');
  let status;for(let attempt=0;attempt<12;attempt++){const r=await fetch(url,{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});status=r.status;await r.body?.cancel();if(status===404)break;await new Promise(r=>setTimeout(r,500));}
  check(status===404,'removed helper returns 404');
  const inactive=await fetch('https://pkhockeyacademy.de/api/registration',{method:'POST',headers:{Authorization:authorization},signal:AbortSignal.timeout(15000)});check(inactive.status===503,'canonical intake remains inactive');await inactive.body?.cancel();
 });
 const report={passed:true,checks,actualProtectedHost:true,actualMariaDB:true,fictionalRecordsRemoved:true,temporaryHelperRemoved:true,publicIntakeEnabled:false,realDataUsed:false,connectedStaffHttpVerified:connected,realOperatorHandoffVerified:false,at:new Date().toISOString()};
 await writeFile(new URL(connected?'registration-connected-host-acceptance.json':'registration-form-host-acceptance.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report));
}catch(error){console.error('Protected form acceptance failed at '+step+' ('+error.name+'; last assertion: '+lastCheck+'). Check private fixture cleanup; no public activation was requested.');process.exitCode=1;}
finally{await browser?.close();connection?.close();}
