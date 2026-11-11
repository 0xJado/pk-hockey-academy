import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,step='local_setup',checks=0;
let lastCheck='';
const check=(value,label)=>{lastCheck=label;assert.ok(value,label);checks++;};
try {
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
 assert.ok(paths.privateOutsidePublic);const prefix='pk_fixture_'+randomBytes(6).toString('hex')+'_';
 const token=randomBytes(32).toString('base64url');
 const sources={};for(const name of ['Policy.php','Intake.php','Http.php','Config.php','Sessions.php','policy.v1.json'])sources[name]=(await readFile(new URL('registration/'+name,import.meta.url))).toString('base64');
 const sourceHash=sha256(JSON.stringify(sources)).slice(0,24);
 const config=JSON.parse(await readFile(new URL('registration/config.example.json',import.meta.url),'utf8'));
 let cms={};for(const name of ['.env','.env.local'])try{cms={...cms,...parseEnv(await readFile(new URL('../../web/'+name,import.meta.url),'utf8'))};}catch(e){if(e.code!=='ENOENT')throw e;}
 config.sanity={enabled:cms.SANITY_TRAINING_ENABLED==='true',projectId:cms.SANITY_PROJECT_ID||'',dataset:cms.SANITY_DATASET||'',readToken:''}; // No secret in the uploaded helper; private-dataset credentials require separate provisioning.
 let helper=await readFile(new URL('registration/acceptance.php.template',import.meta.url),'utf8');
 for(const [key,value] of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({prefix,private:paths.privatePath,public:paths.publicPath,sourceHash})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64'),CONFIG:Buffer.from(JSON.stringify(config)).toString('base64'),SOURCE_CONFIG:Buffer.from(JSON.stringify(config.sanity)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 step='sftp';connection=await connect();const store=new SftpReleaseStore(connection.call);let accountAdministration;
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const name='pk-intake-acceptance-'+randomUUID()+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
  const request=async(action,body={},ticket='',extra={})=>{
   const response=await fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(30000),headers:{Authorization:authorization,'X-PK-Setup-Token':token,'X-PK-Fixture-Action':action,Origin:'https://pkhockeyacademy.de','Content-Type':'application/json','Idempotency-Key':ticket,...extra},body:typeof body==='string'?body:JSON.stringify(body)});
   return {status:response.status,body:await response.json()};
  };
  let installed=false,cleanup;
  try {
   step='helper_upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   check((await request('setup',{},'',{'X-PK-Setup-Token':'wrong'})).status===403,'private test token required');
   step='fixture_setup';installed=true;const setup=await request('setup');check(setup.status===200&&setup.body.ready,'MariaDB fixture setup');accountAdministration=setup.body.serverAccountAdministration;
   const tokenFor=async()=>{const r=await request('token');assert.equal(r.status,200,'Fixture token unavailable');return r.body.token;};
   const input={policyVersion:'registration-request-v1-2026-11-11',childName:'FIKTIVES MARIA-DB-TESTKIND 🏒',birthYear:'2017',guardianName:'FIKTIVER KONTAKT',guardianPhone:'+49 000 000000',guardianEmail:'mariadb-fixture@example.invalid',bookingType:'five',guardianAuthority:true,consents:{health:true},healthNotes:'FIKTIVER TESTHINWEIS'};
   step='concurrent_acceptance';const key=await tokenFor();const race=await Promise.all([request('submit',input,key),request('submit',input,key)]);
   check(race.filter(x=>x.status===201).length===1&&race.filter(x=>x.status===200).length===1,'MariaDB simultaneous retries persist once');
   check(race[0].body.reference===race[1].body.reference,'concurrent receipt stable');
   check((await request('submit',{...input,childName:'OTHER FIKTIV'},key)).status===409,'changed payload rejected');
   check((await request('submit',input,key)).status===200,'fresh PHP process replay');
   step='unknown_outcomes';for(const mode of ['loss-before','loss-after']) {
    const ticket=await tokenFor(),variant={...input,guardianEmail:mode+'@example.invalid'};
    const lost=await request(mode,variant,ticket);check(lost.status===503&&lost.body.code==='outcome-unknown','commit ambiguity never success');
    check((await request('submit',variant,ticket)).status===(mode==='loss-before'?201:200),'same token resolves commit ambiguity');
   }
   step='validation';check((await request('submit',{...input,consents:{}},await tokenFor())).status===422,'health consent enforced');
   step='published_source';const source=await request('source-check');check(source.status===200&&source.body.publishedSourceReachable&&source.body.inventedSessionRejected,'real published Sanity source reachable and invented ID rejected');
   check((await request('submit',{...input,bookingType:'single',sessionId:'nonexistent'},await tokenFor())).status===422,'unrequestable source rejected');
   check((await request('submit',{...input,bookingType:'single',sessionId:'fictional-published-session',guardianEmail:'single@example.invalid'},await tokenFor())).status===201,'server-verified fictional session accepted');
   check((await request('submit','{"guardianAuthority":true,"guardianAuthority":false}',await tokenFor())).status===400,'ambiguous JSON rejected');
   check((await request('submit',input,key,{Origin:'null'})).status===403,'opaque origin rejected');
   step='lock_timeout';const blocker=request('lock');await new Promise(r=>setTimeout(r,400));
   const busy=await request('timeout',input,key);check(busy.status===503,'database lock timeout fails safely');check((await blocker).body.released,'fixture lock released');
   check((await request('submit',input,key)).status===200,'same token works after lock release');
   step='fixture_summary';const summary=await request('summary');check(summary.body.records===4&&summary.body.claims===4&&summary.body.encrypted,'exactly four encrypted fictional requests');
   step='paused_production_migration';const migration=await request('migrate');
   step+='_'+migration.status+'_paused_'+(migration.body.paused===true)+'_disabled_'+(migration.body.configDisabled===true);
   if(/^[a-z_]+$/.test(migration.body.stage??''))step+='_'+migration.body.stage;
   check(migration.status===200&&migration.body.paused&&migration.body.configDisabled,'production intake schema installed paused and disabled');
  } finally {
   // Fixed generated prefix contains only this disposable fictional workflow.
   try { if(installed){cleanup=await request('cleanup');check(cleanup.status===200&&cleanup.body.fixtureTablesRemaining===0,'all fictional tables removed');} }
   finally { if(await store.exists(remote))await store.remove(remote);check(!await store.exists(remote),'helper removed'); }
  }
  check(sha256(await store.get('.htaccess'))===sha256(router),'public router preserved');
  const inactive=await fetch('https://pkhockeyacademy.de/api/registration',{method:'POST',headers:{Authorization:authorization},signal:AbortSignal.timeout(15000)});check(inactive.status===503,'public registration remains inactive');
  let removedStatus,removedGetStatus;
  // Shared-host opcode/stat caches may briefly retain a just-removed PHP file.
  for(let attempt=0;attempt<12;attempt++) {
   const removed=await fetch(url,{method:'POST',headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});
   removedStatus=removed.status;await removed.body?.cancel();
   const get=await fetch(url,{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});removedGetStatus=get.status;await get.body?.cancel();
   if(removedStatus===404&&removedGetStatus===404)break;
   await new Promise(r=>setTimeout(r,500));
  }
  step='removed_helper_status_'+removedStatus+'_'+removedGetStatus;check(removedStatus===404&&removedGetStatus===404,'removed helper is 404 for GET and POST');
 });
 const report={passed:true,checks,driver:'MariaDB',concurrentExactlyOnce:true,unknownCommitResolved:true,lockTimeoutSafe:true,publishedSanitySourceReachable:true,fictionalTablesRemoved:true,helperRemoved:true,publicIntakeEnabled:false,staffEnabled:false,serverAccountAdministration:accountAdministration,at:new Date().toISOString()};
 await writeFile(new URL('registration-acceptance.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report,null,2));
}catch(error) {const kind=['AssertionError','SyntaxError','TypeError','TimeoutError','Error'].includes(error.name)?error.name:'Error';console.error('Registration acceptance failed at '+step+' ('+kind+'; '+lastCheck+'). Inspect private state and cleanup; no public activation was requested.');process.exitCode=1;}
finally{connection?.close();}
