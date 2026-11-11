import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease,authLayer} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';

// Explicit operator setup, never called by CI/build/deploy. No public activation.
let connection;
let step='local_configuration';
try {
  const env=await settings();
  assert.match(env.STRATO_DB_HOST??'',/^[a-z0-9.-]+$/);
  for(const key of ['STRATO_DB_NAME','STRATO_DB_USERNAME'])assert.match(env[key]??'',/^[a-zA-Z0-9_]+$/);
  assert.ok(env.STRATO_DB_PASSWORD&&env.STRATO_PREVIEW_USERNAME&&env.STRATO_PREVIEW_PASSWORD,'Private credentials required');
  const paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
  assert.ok(paths.privateOutsidePublic&&paths.privatePath&&paths.publicPath,'Verified private paths required');
  const directory=paths.privatePath+'/registration';
  const base={enabled:false,maintenance:true,databaseContractAccepted:false,origin:'https://pkhockeyacademy.de',path:'/intern/anmeldungen',
    dsn:`mysql:host=${env.STRATO_DB_HOST};dbname=${env.STRATO_DB_NAME};charset=utf8mb4`,username:env.STRATO_DB_USERNAME,password:env.STRATO_DB_PASSWORD,
    journal:directory+'/erasure-journal.enc',backupDirectory:directory+'/backups'};
  const configFile=new URL('database-config.json',privateRoot);
  let config;
  try {
    config=JSON.parse(await readFile(configFile,'utf8'));
    assert.deepEqual(Object.fromEntries(Object.keys(base).map(key=>[key,config[key]])),base,'Existing private configuration differs; inspect before changing it');
  }catch(error){
    if(error.code!=='ENOENT')throw error;
    config={...base,keys:Object.fromEntries(['data','auth','audit','backup'].map(key=>[key,randomBytes(32).toString('base64')]))};
    await writeFile(configFile,JSON.stringify(config),{mode:0o600,flag:'wx'});
  }
  const token=randomBytes(32).toString('base64url');
  let helper=await readFile(new URL('database/install.php.template',import.meta.url),'utf8');
  helper=helper.replace('__TOKEN_HASH__',sha256(token))
    .replace('__PATHS__',Buffer.from(JSON.stringify({publicPath:paths.publicPath,privatePath:paths.privatePath})).toString('base64'))
    .replace('__STAFF_SOURCE__',(await readFile(new URL('staff/Staff.php',import.meta.url))).toString('base64'));
  step='sftp_connection';
  connection=await connect(); const store=new SftpReleaseStore(connection.call);
  let report;
  await withReleaseLock(store,async()=>{
    step='release_inspection';
    const router=await store.get('.htaccess');authLayer(router.toString());
    const release=activeRelease(router.toString());assert.notEqual(release,'legacy');
    const name='pk-database-setup-'+randomUUID()+'.php';
    const remote='.pk-releases/'+release+'/api/'+name;
    const url='https://pkhockeyacademy.de/api/'+name;
    const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
    const request=(headers,body)=>fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(45000),headers,body});
    try {
      step='helper_upload';
      await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
      step='anonymous_denial';
      assert.equal((await request({},'{}')).status,401,'Anonymous setup must be denied');
      step='token_denial';
      assert.equal((await request({Authorization:authorization,'Content-Type':'application/json'},'{}')).status,403,'Setup token required');
      step='remote_setup';
      const response=await request({Authorization:authorization,'X-PK-Setup-Token':token,'Content-Type':'application/json'},JSON.stringify(config));
      report=await response.json();
      if(response.status!==200||report.installed!==true)throw new Error('Remote database setup failed at '+(report.stage??'authentication'));
      assert.equal(sha256(await store.get('.htaccess')),sha256(router),'Live router changed');
    }finally {
      if(await store.exists(remote))await store.remove(remote);
      assert.ok(!await store.exists(remote),'Temporary database helper cleanup required');
    }
    assert.equal((await request({Authorization:authorization},'{}')).status,404,'Removed setup helper must be inaccessible');
    step='inactive_intake_check';
    const intake=await fetch('https://pkhockeyacademy.de/api/registration',{method:'POST',redirect:'manual',headers:{Authorization:authorization},signal:AbortSignal.timeout(20000)});
    assert.equal(intake.status,503,'Public intake must remain disabled');
  });
  const evidence={...report,helperRemoved:true,anonymousDenied:true,tokenRequired:true,intakeStillInactive:true,at:new Date().toISOString()};
  await writeFile(new URL('database-acceptance.json',privateRoot),JSON.stringify(evidence,null,2),{mode:0o600});
  console.log(JSON.stringify(evidence,null,2));
}catch(error){
  // Never print PDO diagnostics, credential values or exception objects.
  const stage=/^Remote database setup failed at [a-z_]+$/.test(error.message)?error.message:'Check private configuration, server state and helper cleanup before retrying.';
  console.error('Database setup did not complete at '+step+'. '+stage);process.exitCode=1;
}finally{connection?.close();}
