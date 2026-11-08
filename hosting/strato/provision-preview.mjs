import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {parseEnv} from 'node:util';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';

let connection;
try {
  const hosting=await settings();let cms={};
  for(const name of ['.env','.env.local'])try{cms={...cms,...parseEnv(await readFile(new URL('../../web/'+name,import.meta.url),'utf8'))};}catch(error){if(error.code!=='ENOENT')throw error;}
  assert.ok(cms.SANITY_PROJECT_ID&&cms.SANITY_DATASET&&cms.SANITY_PREVIEW_READ_TOKEN&&cms.PUBLIC_SANITY_STUDIO_URL,'Existing private preview configuration required');
  const report=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
  assert.ok(report.privateOutsidePublic&&report.publicPath&&report.privatePath,'Verified private hosting paths required');
  let sessionKey;
  try{sessionKey=(await readFile(new URL('preview-session-key.txt',privateRoot),'utf8')).trim();}
  catch(error){if(error.code!=='ENOENT')throw error;sessionKey=randomBytes(32).toString('hex');await writeFile(new URL('preview-session-key.txt',privateRoot),sessionKey,{mode:0o600,flag:'wx'});}
  assert.match(sessionKey,/^[a-f0-9]{64}$/);
  const config=JSON.stringify({projectId:cms.SANITY_PROJECT_ID,dataset:cms.SANITY_DATASET,readToken:cms.SANITY_PREVIEW_READ_TOKEN,sessionKey,studioUrl:cms.PUBLIC_SANITY_STUDIO_URL,siteOrigin:'https://pkhockeyacademy.de'});
  const locator=Buffer.from(JSON.stringify({publicRoot:report.publicPath,configFile:report.privatePath+'/preview-config.json'}));
  connection=await connect();const store=new SftpReleaseStore(connection.call);
  await withReleaseLock(store,async()=>{
    const before=await store.get('.htaccess'),release=activeRelease(before.toString());
    assert.notEqual(release,'legacy','Versioned deployment required');
    if(await store.exists('.pk-preview-location.json'))assert.equal(sha256(await store.get('.pk-preview-location.json')),sha256(locator),'Existing locator differs');
    const name='pk-preview-setup-'+randomUUID()+'.php';
    const remote='.pk-releases/'+release+'/api/'+name;
    const setupToken=randomBytes(32).toString('base64url');
    let helper=await readFile(new URL('preview/install.php.template',import.meta.url),'utf8');
    helper=helper.replace('__SETUP_SHA256__',sha256(setupToken)).replace('__PATHS_BASE64__',Buffer.from(JSON.stringify({publicPath:report.publicPath,privatePath:report.privatePath})).toString('base64'));
    try {
      await store.put(remote,Buffer.from(helper));
      assert.equal(sha256(await store.get(remote)),sha256(helper),'Installer readback mismatch');
      const response=await fetch('https://pkhockeyacademy.de/api/'+name,{method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),headers:{Authorization:'Basic '+Buffer.from(hosting.STRATO_PREVIEW_USERNAME+':'+hosting.STRATO_PREVIEW_PASSWORD).toString('base64'),'X-PK-Setup-Token':setupToken,'Content-Type':'application/json'},body:config});
      assert.ok([200,201].includes(response.status),'Private provisioning failed');
      assert.equal((await response.json()).installed,true);
      assert.equal(sha256(await store.get('.htaccess')),sha256(before),'Active router changed during provisioning');
      const temporary='.pk-state/preview-location-'+randomUUID()+'.json';
      await store.put(temporary,locator);assert.equal(sha256(await store.get(temporary)),sha256(locator));
      await store.rename(temporary,'.pk-preview-location.json');
    }finally{if(await store.exists(remote))await store.remove(remote);assert.ok(!await store.exists(remote),'Installer cleanup required');}
  });
  console.log('Private PHP preview configuration provisioned outside the web root. Studio and active preview routing unchanged.');
}catch{
  await writeFile(new URL('preview-setup-error.json',privateRoot),JSON.stringify({code:'private_setup_failed',at:new Date().toISOString()})).catch(()=>{});
  console.error('Private preview provisioning failed. Inspect local configuration and protected server state; existing configuration is never overwritten.');process.exitCode=1;
}finally{connection?.close();}
