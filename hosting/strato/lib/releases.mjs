import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validateArtifact,sha256} from './artifact.mjs';
import {authLayer,activeRelease,renderRouter,releaseId} from './release-router.mjs';

const STATE='.pk-state';
const ROOT='.htaccess';
async function checkedPut(store,path,bytes) {
  bytes=Buffer.from(bytes);await store.put(path,bytes);
  assert.equal(sha256(await store.get(path)),sha256(bytes),'Remote checksum mismatch');
}
export async function withReleaseLock(store,work) {
  await store.ensure(STATE);
  try{await store.mkdir(STATE+'/deploy.lock');}catch{throw new Error('Deployment lock exists; inspect the previous run before recovery.');}
  try {
    await store.put(STATE+'/deploy.lock/owner.json',Buffer.from(JSON.stringify({id:randomUUID(),createdAt:new Date().toISOString()})));
    return await work();
  } finally {
    await store.remove(STATE+'/deploy.lock/owner.json');
    await store.rmdir(STATE+'/deploy.lock');
  }
}
async function activate(store,before,next,health) {
  const temporary=STATE+'/router-'+randomUUID()+'.conf';
  await checkedPut(store,temporary,next);
  assert.equal(sha256(await store.get(ROOT)),sha256(before),'Live routing changed during deployment');
  await store.rename(temporary,ROOT);
  try{await health();}catch(error){
    assert.equal(sha256(await store.get(ROOT)),sha256(next),'Health check failed and live routing changed; manual recovery required');
    const recovery=STATE+'/recovery-'+randomUUID()+'.conf';
    await checkedPut(store,recovery,before);await store.rename(recovery,ROOT);
    throw error;
  }
}
export async function deployRelease(store,artifact,{health=async()=>{},id=new Date().toISOString().replace(/[^0-9a-z]/gi,'-').toLowerCase()+'-'+randomUUID().slice(0,8)}={}) {
  validateArtifact(artifact.ready,artifact.contents);
  assert.ok(releaseId(id),'Invalid release identifier');
  return withReleaseLock(store,async()=>{
    const before=await store.get(ROOT);authLayer(before.toString());
    const previous=activeRelease(before.toString());
    let previousReady;
    if(previous!=='legacy') {
      const current=JSON.parse(await store.get(`.pk-releases/${previous}/manifest.json`));
      previousReady=current;
      if(current.contentHash===artifact.ready.contentHash){await health({ready:current});return {release:previous,unchanged:true};}
    }
    const folder='.pk-releases/'+id;
    assert.ok(!await store.exists(folder),'Release already exists');
    await store.ensure(folder);
    for(const [path,bytes] of artifact.contents) {
      if(path==='.htaccess')continue;
      if(path.startsWith('_astro/')) {
        if(await store.exists(path))assert.equal(sha256(await store.get(path)),sha256(bytes),'Immutable asset collision');
        else await checkedPut(store,path,bytes);
      } else await checkedPut(store,folder+'/'+path,bytes);
    }
    await checkedPut(store,folder+'/manifest.json',JSON.stringify(artifact.ready));
    await checkedPut(store,STATE+'/before-'+id+'.conf',before);
    await checkedPut(store,folder+'/previous.json',JSON.stringify({release:previous}));
    const next=Buffer.from(renderRouter(before.toString(),id,artifact.ready.inventory));
    await activate(store,before,next,()=>health({ready:artifact.ready,previousReady}));
    return {release:id,previous,unchanged:false};
  });
}
export async function rollbackRelease(store,{target,health=async()=>{}}={}) {
  return withReleaseLock(store,async()=>{
    const before=await store.get(ROOT),current=activeRelease(before.toString());
    assert.notEqual(current,'legacy','No versioned release to roll back');
    target??=JSON.parse(await store.get(`.pk-releases/${current}/previous.json`)).release;
    // The initial upload predates atomic releases. Use its saved routing while
    // retaining today's authentication and response headers.
    let next,ready;
    if(target==='legacy') {
      const {ROUTER_MARKER}=await import('./release-router.mjs');
      const old=(await store.get(STATE+'/before-'+current+'.conf')).toString();
      assert.equal(activeRelease(old),'legacy','Legacy rollback unavailable for this release');
      assert.ok(old.includes(ROUTER_MARKER),'Missing original routing');
      next=Buffer.from(authLayer(before.toString())+ROUTER_MARKER+old.split(ROUTER_MARKER)[1]);
    } else {
      assert.ok(releaseId(target),'Invalid rollback target');
      const folder='.pk-releases/'+target;
      ready=JSON.parse(await store.get(folder+'/manifest.json'));
      const contents=new Map();
      for(const file of ready.inventory)contents.set(file.path,file.path==='.htaccess'?Buffer.from(''):await store.get(file.path.startsWith('_astro/')?file.path:folder+'/'+file.path));
      // Exported .htaccess is not served; validate all served bytes against their inventory.
      for(const file of ready.inventory.filter(x=>x.path!=='.htaccess'))assert.equal(sha256(contents.get(file.path)),file.sha256,'Rollback content changed');
      assert.equal(sha256(JSON.stringify(ready.inventory)),ready.contentHash,'Rollback manifest changed');
      next=Buffer.from(renderRouter(before.toString(),target,ready.inventory));
    }
    const previousReady=JSON.parse(await store.get(`.pk-releases/${current}/manifest.json`));
    await activate(store,before,next,()=>health({ready,previousReady}));return {release:target,previous:current};
  });
}
