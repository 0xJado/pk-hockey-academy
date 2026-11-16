import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';

let connection;
try{
 const mode=process.argv[2]||'prepare';assert.ok(['prepare','cleanup'].includes(mode));
 const env=await settings();connection=await connect();const store=new SftpReleaseStore(connection.call);
 const reportFile=new URL('staff-enrollment.json',privateRoot);
 const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
 await withReleaseLock(store,async()=>{
  if(mode==='cleanup'){
   const record=JSON.parse(await readFile(reportFile,'utf8'));
   assert.match(record.remote,/^\.pk-releases\/[a-z0-9-]+\/api\/pk-staff-enroll-[a-f0-9-]{36}\.php$/);
   if(await store.exists(record.remote)){assert.equal(sha256(await store.get(record.remote)),record.sourceHash);await store.remove(record.remote);}
   let removed=false;
   for(let i=0;i<12;i++){
    const response=await fetch(record.url.split('#')[0],{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});await response.body?.cancel();
    if(response.status===404){removed=true;break;}await new Promise(r=>setTimeout(r,500));
   }
   assert.ok(removed);delete record.url;record.helperRemoved=true;
   await writeFile(reportFile,JSON.stringify(record,null,2),{mode:0o600});console.log('Enrollment helper removed and 404 verified.');return;
  }
  // Refuse to orphan an earlier setup page; clean it up explicitly first.
  try{const previous=JSON.parse(await readFile(reportFile,'utf8'));assert.ok(previous.helperRemoved,'Existing enrollment needs cleanup');}catch(error){if(error.code!=='ENOENT')throw error;}
  const paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));assert.ok(paths.privateOutsidePublic);
  const router=await store.get('.htaccess');authLayer(router.toString());const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
  const id=randomUUID(),token=randomBytes(32).toString('base64url'),expires=Math.floor(Date.now()/1000)+1800;
  const scope={id,public:paths.publicPath,private:paths.privatePath,routerHash:sha256(router),expires};
  let source=await readFile(new URL('staff/enroll.php.template',import.meta.url),'utf8');
  source=source.replace('__SCOPE__',Buffer.from(JSON.stringify(scope)).toString('base64')).replace('__TOKEN_HASH__',sha256(token));
  const name='pk-staff-enroll-'+id+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  try{
   await store.put(remote,Buffer.from(source));assert.equal(sha256(await store.get(remote)),sha256(source));
   const anonymous=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});await anonymous.body?.cancel();assert.equal(anonymous.status,401);
   const page=await fetch(url,{headers:{Authorization:authorization},redirect:'manual',signal:AbortSignal.timeout(15000)});assert.equal(page.status,200);
   assert.match(page.headers.get('cache-control')||'',/no-store/);assert.match(await page.text(),/Privaten Verwaltungszugang einrichten/);
   const denied=await fetch(url,{method:'POST',headers:{Authorization:authorization,Origin:'https://pkhockeyacademy.de','Content-Type':'application/x-www-form-urlencoded'},body:'setup=wrong&password=invalid&confirm=invalid',signal:AbortSignal.timeout(15000)});await denied.body?.cancel();assert.equal(denied.status,403);
   await writeFile(reportFile,JSON.stringify({url:url+'#'+new URLSearchParams({setup:token}),remote,sourceHash:sha256(source),expiresAt:new Date(expires*1000).toISOString(),helperRemoved:false},null,2),{mode:0o600});
   console.log(JSON.stringify({prepared:true,login:'pierre',expiresAt:new Date(expires*1000).toISOString(),privateLinkFile:'output/strato-private/staff-enrollment.json'}));
  }catch(error){if(await store.exists(remote))await store.remove(remote);throw error;}
 });
}catch{console.error('Staff enrollment preparation failed. No account success claimed; inspect owned helper cleanup privately.');process.exitCode=1;}
finally{connection?.close();}
