import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,step='setup';
try{
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));assert.ok(paths.privateOutsidePublic);
 const names=['runtime/Requests.php','staff/Staff.php','staff/Config.php','staff/Http.php','registration/Policy.php','registration/Intake.php','registration/Config.php','registration/Http.php','registration/Sessions.php','registration/policy.v1.json'];
 const sources={};for(const name of names)sources[name.replace(/^runtime\//,'')]=(await readFile(new URL(name,import.meta.url))).toString('base64');
 const hash=sha256(JSON.stringify(sources)).slice(0,24),token=randomBytes(32).toString('base64url');
 const config=JSON.parse(await readFile(new URL('registration/config.example.json',import.meta.url),'utf8'));
 let helper=await readFile(new URL('runtime/install.php.template',import.meta.url),'utf8');
 for(const[key,value]of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({public:paths.publicPath,private:paths.privatePath,hash})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64'),CONFIG:Buffer.from(JSON.stringify(config)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 connection=await connect();const store=new SftpReleaseStore(connection.call);
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const name='pk-runtime-install-'+randomUUID()+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
  try{
   step='upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   step='install';const r=await fetch(url,{method:'POST',redirect:'manual',headers:{Authorization:authorization,'X-PK-Setup-Token':token},signal:AbortSignal.timeout(30000)});
   const result=await r.json();assert.equal(r.status,200);assert.equal(result.installed,true);assert.equal(result.runtimeEnabled,false);
  }finally{if(await store.exists(remote))await store.remove(remote);assert.ok(!await store.exists(remote));}
  step='verify';assert.equal(sha256(await store.get('.htaccess')),sha256(router));
  let removed=false;for(let i=0;i<12;i++){const r=await fetch(url,{headers:{Authorization:authorization},signal:AbortSignal.timeout(15000)});const status=r.status;await r.body?.cancel();if(status===404){removed=true;break;}await new Promise(r=>setTimeout(r,500));}assert.ok(removed);
  for(const route of ['/api/registration','/api/registration/token','/intern/anmeldungen']){
   const r=await fetch('https://pkhockeyacademy.de'+route,{method:route.startsWith('/api/')?'POST':'GET',headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});assert.equal(r.status,503);await r.body?.cancel();
  }
  const hidden=await fetch('https://pkhockeyacademy.de/.pk-registration-location.json',{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});assert.equal(hidden.status,403);await hidden.body?.cancel();
 });
 const report={installed:true,runtimeEnabled:false,realDataApproved:false,helperRemoved:true,locatorHttpDenied:true,at:new Date().toISOString()};
 await writeFile(new URL('request-runtime-install.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report));
}catch{console.error('Private request runtime setup failed at '+step+'; inspect private installation/cleanup. No activation requested.');process.exitCode=1;}
finally{connection?.close();}
