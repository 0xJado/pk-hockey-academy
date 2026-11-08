// Explicit protected-host acceptance; never called by publication automation.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {connect,settings,privateRoot} from './lib/sftp.mjs';
import {loadArtifact,sha256} from './lib/artifact.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {activeRelease} from './lib/release-router.mjs';
import {deployRelease,rollbackRelease} from './lib/releases.mjs';
import {deliveryHealth} from './lib/delivery.mjs';

const env=await settings(),health=deliveryHealth(env);
const artifact=await loadArtifact(undefined,[env.STRATO_SFTP_PASSWORD,env.STRATO_PREVIEW_PASSWORD]);
const connection=await connect(),store=new SftpReleaseStore(connection.call);
const starting=activeRelease((await store.get('.htaccess')).toString());
assert.notEqual(starting,'legacy','Deploy a baseline version first');
const checks=[];
let restored=false;
try {
  const contents=new Map(artifact.contents);
  const path='migrationstest-release/index.html';
  contents.set(path,Buffer.from('<!doctype html><html lang="de"><head><meta name="robots" content="noindex,nofollow"><title>Technischer Migrationstest</title></head><body><h1>Technischer Migrationstest</h1><p>Vorübergehende technische Prüfseite. Kein Trainingsangebot, keine Anmeldung.</p></body></html>'));
  const inventory=[...contents].map(([path,bytes])=>({path,size:bytes.length,sha256:sha256(bytes)})).sort((a,b)=>a.path.localeCompare(b.path));
  const fixture={contents,ready:{...artifact.ready,inventory,files:inventory.length,contentHash:sha256(JSON.stringify(inventory))}};
  const added=await deployRelease(store,fixture,{health});checks.push('technical-route-created');console.log('Technical route delivered.');
  // An injected transport interruption after remote writes must not switch routing.
  const snapshot=await store.get('.htaccess');let writes=0;
  const failed=new SftpReleaseStore(connection.call);
  const put=failed.put.bind(failed);failed.put=async(...args)=>{if(++writes===5)throw Error('Injected transport interruption');return put(...args);};
  await assert.rejects(deployRelease(failed,artifact,{health}),/Injected transport interruption/);
  assert.equal(sha256(await store.get('.htaccess')),sha256(snapshot));checks.push('interrupted-upload-retains-router');console.log('Interrupted upload retained the working release.');
  const withdrawn=await deployRelease(store,artifact,{health});checks.push('technical-route-withdrawn-404');console.log('Technical route withdrawal verified.');
  await rollbackRelease(store,{target:added.release,health});checks.push('rollback-restores-route');console.log('Rollback restored the complete technical release.');
  await rollbackRelease(store,{target:withdrawn.release,health});checks.push('rollback-removes-route');
  restored=true;
  await writeFile(new URL('atomic-release-acceptance.json',privateRoot),JSON.stringify({passed:true,at:new Date().toISOString(),checks,release:withdrawn.release},null,2));
  console.log(JSON.stringify({passed:true,checks,restored:true}));
} finally {
  if(!restored)try{await rollbackRelease(store,{target:starting,health});}catch{console.error('Baseline recovery needs private inspection.');}
  connection.close();
}
