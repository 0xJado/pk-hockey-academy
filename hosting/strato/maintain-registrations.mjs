import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection,step='local_setup';
try{
 const env=await settings();let paths;
 if(env.STRATO_PRIVATE_PATH&&env.STRATO_PUBLIC_PATH)paths={privatePath:env.STRATO_PRIVATE_PATH,publicPath:env.STRATO_PUBLIC_PATH,privateOutsidePublic:true};
 else paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
 assert.ok(paths.privateOutsidePublic&&paths.privatePath&&paths.publicPath);
 const sources={};for(const[name,path]of Object.entries({'Staff.php':'staff/Staff.php','Maintenance.php':'staff/Maintenance.php','Intake.php':'registration/Intake.php','Policy.php':'registration/Policy.php','policy.v1.json':'registration/policy.v1.json'}))sources[name]=(await readFile(new URL(path,import.meta.url))).toString('base64');
 const token=randomBytes(32).toString('base64url');let helper=await readFile(new URL('staff/maintain.php.template',import.meta.url),'utf8');
 for(const[key,value]of Object.entries({TOKEN_HASH:sha256(token),SCOPE:Buffer.from(JSON.stringify({public:paths.publicPath,private:paths.privatePath,hash:sha256(JSON.stringify(sources)).slice(0,24)})).toString('base64'),SOURCES:Buffer.from(JSON.stringify(sources)).toString('base64')}))helper=helper.replace('__'+key+'__',value);
 step='sftp';connection=await connect();const store=new SftpReleaseStore(connection.call);let result;
 await withReleaseLock(store,async()=>{
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const name='pk-maintenance-'+randomUUID()+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
  try{
   step='helper_upload';await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   step='maintenance';const response=await fetch(url,{method:'POST',redirect:'manual',headers:{Authorization:authorization,'X-PK-Setup-Token':token},signal:AbortSignal.timeout(60000)});
   assert.equal(response.status,200);result=await response.json();assert.equal(result.completed,true);
  }finally{if(await store.exists(remote))await store.remove(remote);assert.ok(!await store.exists(remote));}
  step='cleanup';let removed=false;for(let i=0;i<12;i++){const response=await fetch(url,{headers:{Authorization:authorization},signal:AbortSignal.timeout(10000)});const status=response.status;await response.body?.cancel();if(status===404){removed=true;break;}await new Promise(r=>setTimeout(r,500));}assert.ok(removed);
  assert.equal(sha256(await store.get('.htaccess')),sha256(router));
 });
 const report={...result,helperRemoved:true,at:new Date().toISOString()};await writeFile(new URL('maintenance-result.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report));
}catch{console.error('Registration maintenance failed at '+step+'. No success claimed; review private state and helper cleanup without logging records or credentials.');process.exitCode=1;}
finally{connection?.close();}
