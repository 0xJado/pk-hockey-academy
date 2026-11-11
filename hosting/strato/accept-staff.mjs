import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,step='setup',checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
try {
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));assert.ok(paths.privateOutsidePublic);
 const prefix='pk_fixture_'+randomBytes(6).toString('hex')+'_',token=randomBytes(32).toString('base64url');let password=randomBytes(32).toString('base64url');
 const sources={};for(const [name,path]of Object.entries({'Staff.php':'staff/Staff.php','Http.php':'staff/Http.php','Maintenance.php':'staff/Maintenance.php','Intake.php':'registration/Intake.php','Policy.php':'registration/Policy.php','policy.v1.json':'registration/policy.v1.json'}))sources[name]=(await readFile(new URL(path,import.meta.url))).toString('base64');
 let helper=await readFile(new URL('staff/acceptance.php.template',import.meta.url),'utf8');
 for(const [key,value]of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({prefix,private:paths.privatePath,public:paths.publicPath,hash:sha256(JSON.stringify(sources)).slice(0,24)})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 connection=await connect();const store=new SftpReleaseStore(connection.call);
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const name='pk-staff-acceptance-'+randomUUID()+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');let cookie='';
  const request=async(action='view',form,extra={})=>{
   const headers={Authorization:authorization,'X-PK-Setup-Token':token,...(cookie?{Cookie:cookie}:{}),...(action!=='view'?{'X-PK-Staff-Action':action}:{}),...extra};
   if(form){headers.Origin='https://pkhockeyacademy.de';headers['Content-Type']='application/x-www-form-urlencoded';Object.assign(headers,extra);}
   const response=await fetch(url,{method:action!=='view'||form?'POST':'GET',redirect:'manual',headers,body:form?new URLSearchParams(form):undefined,signal:AbortSignal.timeout(20000)});
   const set=response.headers.getSetCookie().find(s=>s.startsWith('__Host-pk_staff='));if(set)cookie=set.split(';')[0];return {status:response.status,text:await response.text(),headers:response.headers,set};
  };
  const control=async(action)=>{const r=await request(action,undefined,{'X-PK-Fixture-Password':password});assert.equal(r.status,200,'Fictional staff control failed: '+action);return JSON.parse(r.text);};
  const csrf=text=>{const match=text.match(/name="csrf" value="([a-f0-9]{64})"/);assert.ok(match);return match[1];};
  const login=async()=>{let r=await request();const pre=cookie;r=await request('view',{action:'login',csrf:csrf(r.text),login:'fixture-owner',password});check(r.status===303&&cookie!==pre,'login rotates secure staff session');return r;};
  let started=false;
  try {
   step='helper_upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   check((await fetch(url,{signal:AbortSignal.timeout(10000)})).status===401,'website protection remains');
   check((await request('view',undefined,{'X-PK-Setup-Token':'wrong'})).status===403,'fixture token required');
   step='fixture_setup';started=true;const {id}=await control('setup');
   step='daily_maintenance';const daily=await control('daily-maintenance'),repeated=await control('daily-maintenance');check(daily.dailyBackupCreated&&repeated.existingDailyBackupVerified&&!repeated.dailyBackupCreated,'daily maintenance verifies same-day backup on retry');
   let r=await request();check(r.status===200&&!r.text.includes('FIKTIVES HOST-TESTKIND'),'anonymous staff view contains no data');
   check(/Secure/i.test(r.set)&&/HttpOnly/i.test(r.set)&&/SameSite=Strict/i.test(r.set)&&/Path=\//i.test(r.set),'real-host staff cookie protections');
   check(/no-store/.test(r.headers.get('cache-control'))&&r.headers.get('x-frame-options')==='DENY','private response headers');
   r=await request('view',{action:'login',csrf:csrf(r.text),login:'fixture-owner',password},{Origin:'https://attacker.invalid'});check(r.status===403,'foreign origin denied');
   step='login';await login();
   // Detail selection is an opaque random fixture ID, not participant information.
   const detail=async()=>{const response=await fetch(url+'?record='+id,{headers:{Authorization:authorization,'X-PK-Setup-Token':token,Cookie:cookie},signal:AbortSignal.timeout(20000)});return {status:response.status,text:await response.text()};};
   r=await detail();check(r.status===200&&r.text.includes('FIKTIVES HOST-TESTKIND'),'authorized encrypted record read');
   check(r.text.includes('&lt;script&gt;')&&!r.text.includes('<script>alert(1)</script>'),'stored values escaped');
   let csrfToken=csrf(r.text);
   check((await request('view',{action:'confirmed',csrf:'wrong',record:id,version:'1',confirmedOutside:'yes'})).status===403,'bad CSRF rejected');
   step='concurrent_status';const form={action:'confirmed',csrf:csrfToken,record:id,version:'1',confirmedOutside:'yes'};const race=await Promise.all([request('view',form),request('view',form)]);
   check(race.filter(r=>r.status===303).length===1&&race.filter(r=>r.status===403).length===1,'concurrent MariaDB status change commits once');
   const summary=await control('summary');check(summary.version===2&&summary.status==='confirmed'&&summary.confirmations===1,'one durable confirmation audit');
   check(summary.productionRequests===0&&summary.productionUsers===0,'production tables remain empty');
   step='backup_and_withdrawal';await control('backup');r=await detail();csrfToken=csrf(r.text);
   check((await request('view',{action:'health',csrf:csrfToken,record:id,version:'2'})).status===303,'health withdrawal accepted');
   r=await detail();check(!r.text.includes('FIKTIVE HOST-GESUNDHEITSANGABE')&&r.text.includes('000000'),'health withdrawal preserves required care contact');
   step='restore';const restore=await control('restore');check(restore.restored&&restore.status==='reconciliation'&&restore.intakePaused,'restore reconciles booking and pauses intake');
   check((await detail()).status===403,'restore revokes prior session');await login();r=await detail();check(!r.text.includes('FIKTIVE HOST-GESUNDHEITSANGABE'),'restore does not resurrect withdrawn health data');
   step='revocation_recovery';await control('revoke');check((await detail()).status===403,'revocation defeats stale session');password=randomBytes(32).toString('base64url');await control('reset');await login();
   await control('coach');check((await detail()).status===403,'unsupported role cannot retain access');await control('reset');await login();
   r=await detail();check((await request('view',{action:'logout',csrf:csrf(r.text)})).status===303,'real-host logout');check((await detail()).status===403,'signed-out session cannot read');
   step='retention';await login();r=await detail();let current=await control('summary');
   check((await request('view',{action:'end-website',csrf:csrf(r.text),record:id,version:String(current.version)})).status===303,'independent media use end recorded');
   r=await detail();current=await control('summary');
   check((await request('view',{action:'withdrawn',csrf:csrf(r.text),record:id,version:String(current.version)})).status===303,'fictional request closure');
   const retention=await control('retention');check(retention.independentCategories&&retention.recordsRemaining===0&&retention.purgedRecords===1,'MariaDB category expiry and final deletion');
   step='maintenance';await control('maintenance');check((await request()).status===503,'maintenance fails closed');
  }finally{
   try {if(started){const cleaned=await control('cleanup');check(cleaned.tablesRemaining===0&&cleaned.privateFixtureRemoved,'all fictional tables/private state removed');}}
   finally {if(await store.exists(remote))await store.remove(remote);assert.ok(!await store.exists(remote));}
  }
  check(sha256(await store.get('.htaccess'))===sha256(router),'public router unchanged');
  let removed=false;for(let i=0;i<12;i++){const r=await fetch(url,{headers:{Authorization:authorization},signal:AbortSignal.timeout(10000)});const status=r.status;await r.body?.cancel();if(status===404){removed=true;break;}await new Promise(r=>setTimeout(r,500));}check(removed,'temporary staff helper removed/404');
 });
 const report={passed:true,checks,storage:'isolated MariaDB fictional tables',realStaffAccountCreated:false,publicIntakeEnabled:false,fixtureRemoved:true,helperRemoved:true,at:new Date().toISOString()};
 await writeFile(new URL('staff-host-acceptance.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report,null,2));
}catch{console.error('Staff host acceptance failed at '+step+'. Inspect private fixture cleanup; genuine access/intake unchanged.');process.exitCode=1;}
finally{connection?.close();}
