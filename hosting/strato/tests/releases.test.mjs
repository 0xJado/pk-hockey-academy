import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deployRelease,rollbackRelease,withReleaseLock} from '../lib/releases.mjs';
import {sha256,validateArtifact,publicPath} from '../lib/artifact.mjs';
import {activeRelease,ROUTER_MARKER,renderRouter} from '../lib/release-router.mjs';

const auth='AuthType Basic\nAuthName "Review"\nAuthUserFile "/private/review"\nRequire valid-user\nHeader always set X-Robots-Tag "noindex, nofollow"\n';
const original=auth+ROUTER_MARKER+'RewriteEngine On\n';
test('permanent request routes include token and staff endpoints without exposing the locator',()=>{
 const router=renderRouter(auth,'test-runtime-20261114',[{path:'api/requests.php'}]);
 assert.ok(router.includes('^api/registration(?:/token)?/?$ .pk-releases/test-runtime-20261114/api/requests.php'));
 assert.ok(router.includes('^intern/anmeldungen/?$ .pk-releases/test-runtime-20261114/api/requests.php'));
 assert.ok(router.indexOf('(?:\\.[^/]+')<router.indexOf('^api/registration'));
 assert.ok(router.includes('RewriteCond %{HTTP_HOST} ^www\\.pkhockeyacademy\\.de$ [NC]'));
 assert.ok(router.includes('https://pkhockeyacademy.de%{REQUEST_URI} [R=308,END,NE]'));
});
test('staff source/configuration cannot enter a static deployment artifact',()=>{
  for(const path of ['staff/public/index.php','staff/config.example.json','staff/Staff.php','staff/console.php','database/install.php.template','database/config.json','registration/Intake.php','registration/public/index.php','registration/config.example.json'])assert.equal(publicPath(path),false);
});
class Memory {
  files=new Map([['.htaccess',Buffer.from(original)]]);dirs=new Set();fail;
  async get(path){if(!this.files.has(path))throw Error('Missing '+path);return this.files.get(path);}
  async exists(path){return this.files.has(path)||this.dirs.has(path);}
  async ensure(path){this.dirs.add(path);}
  async mkdir(path){if(this.dirs.has(path))throw Error('Exists');this.dirs.add(path);}
  async put(path,bytes){if(this.fail?.(path))throw Error('Injected upload failure');this.files.set(path,Buffer.from(bytes));}
  async rename(from,to){this.files.set(to,await this.get(from));this.files.delete(from);}
  async remove(path){this.files.delete(path);}
  async rmdir(path){this.dirs.delete(path);}
}
function artifact(version='a') {
  const contents=new Map(Object.entries({
    '.htaccess':'export routing', 'index.html':'<meta name="robots" content="noindex,nofollow">'+version,
    '404.html':'<meta name="robots" content="noindex,nofollow">404',
    'robots.txt':'User-agent: *\nDisallow: /','sitemap.xml':'<urlset/>',
    'api/registration.php':'<?php http_response_code(503);',
    'api/preview-unavailable.php':'<?php http_response_code(503);',
    '_astro/hash.js':'immutable',...(version==='a'?{'trainerpool/test/index.html':'<meta name="robots" content="noindex,nofollow">Test'}:{})
  }).map(([path,value])=>[path,Buffer.from(value)]));
  const inventory=[...contents].map(([path,bytes])=>({path,size:bytes.length,sha256:sha256(bytes)}));
  return {contents,ready:{schemaVersion:1,target:'strato',files:contents.size,inventory,contentHash:sha256(JSON.stringify(inventory))}};
}
test('complete releases, stale routes and rollback retain current authentication',async()=>{
  const store=new Memory();await deployRelease(store,artifact(),{id:'release-aaaa'});
  await deployRelease(store,artifact('b'),{id:'release-bbbb'});
  let router=(await store.get('.htaccess')).toString();
  assert.equal(activeRelease(router),'release-bbbb');
  assert.ok(!router.includes('trainerpool/test'));
  assert.ok(router.includes('.pk-releases/release-bbbb/$1 [END]'));
  assert.match(router,/manifest\|previous/);
  assert.ok(await store.exists('.pk-releases/release-aaaa/trainerpool/test/index.html'));
  assert.ok(!await store.exists('.pk-releases/release-bbbb/trainerpool/test/index.html'));
  store.files.set('.htaccess',Buffer.from(router.replace('/private/review','/private/rotated')));
  await rollbackRelease(store);
  router=(await store.get('.htaccess')).toString();
  assert.equal(activeRelease(router),'release-aaaa');assert.ok(router.includes('/private/rotated'));
  assert.ok(router.includes('trainerpool/test'));
});
test('failed and interrupted staging never activates partial content',async()=>{
  const store=new Memory();store.fail=path=>path.endsWith('/index.html');
  await assert.rejects(deployRelease(store,artifact(),{id:'release-fail'}));
  assert.equal((await store.get('.htaccess')).toString(),original);
  assert.ok(!store.dirs.has('.pk-state/deploy.lock'));
});
test('post-activation health failure restores exact last working router',async()=>{
  const store=new Memory();
  await assert.rejects(deployRelease(store,artifact(),{id:'release-health',health:async()=>{throw Error('503');}}));
  assert.equal((await store.get('.htaccess')).toString(),original);
});
test('simultaneous runs and a crash-held lock fail closed',async()=>{
  const store=new Memory();
  await withReleaseLock(store,async()=>assert.rejects(deployRelease(store,artifact(),{id:'release-race'}),/lock exists/));
  store.dirs.add('.pk-state/deploy.lock');
  await assert.rejects(deployRelease(store,artifact(),{id:'release-crash'}),/lock exists/);
  assert.equal((await store.get('.htaccess')).toString(),original);
});
test('modified artifacts and immutable-asset collisions cannot activate',async()=>{
  const bad=artifact();bad.contents.set('index.html',Buffer.from('modified'));
  assert.throws(()=>validateArtifact(bad.ready,bad.contents));
  const duplicate=artifact();duplicate.ready.inventory[1]={...duplicate.ready.inventory[0]};
  duplicate.ready.contentHash=sha256(JSON.stringify(duplicate.ready.inventory));
  assert.throws(()=>validateArtifact(duplicate.ready,duplicate.contents),/Duplicate/);
  const store=new Memory();store.files.set('_astro/hash.js',Buffer.from('collision'));
  await assert.rejects(deployRelease(store,artifact(),{id:'release-assets'}),/collision/);
  assert.equal((await store.get('.htaccess')).toString(),original);
});
test('duplicate publication is coalesced after health verification',async()=>{
  const store=new Memory();await deployRelease(store,artifact(),{id:'release-first'});
  let checked=false;
  const result=await deployRelease(store,artifact(),{id:'release-again',health:async()=>{checked=true;}});
  assert.equal(result.unchanged,true);assert.ok(checked);assert.ok(!await store.exists('.pk-releases/release-again'));
});
test('failed health does not overwrite another operator routing change',async()=>{
  const store=new Memory();
  await assert.rejects(deployRelease(store,artifact(),{id:'release-other',health:async()=>{store.files.set('.htaccess',Buffer.from(original+'# operator'));throw Error('health');}}),/manual recovery/);
  assert.equal((await store.get('.htaccess')).toString(),original+'# operator');
});
test('rollback rejects corrupted content and supports initial legacy release',async()=>{
  const store=new Memory();await deployRelease(store,artifact(),{id:'release-first'});
  await rollbackRelease(store);assert.equal(activeRelease((await store.get('.htaccess')).toString()),'legacy');
  await deployRelease(store,artifact('b'),{id:'release-next'});
  store.files.set('.pk-releases/release-first/index.html',Buffer.from('corrupt'));
  await assert.rejects(rollbackRelease(store,{target:'release-first'}),/content changed/);
  assert.equal(activeRelease((await store.get('.htaccess')).toString()),'release-next');
});
test('router rejects missing authentication and unsafe paths',()=>{
  assert.throws(()=>renderRouter('Require all granted','release-test',[]));
  assert.throws(()=>renderRouter(original,'../private',[]));
  assert.throws(()=>renderRouter(original,'release-test',[{path:'../secret'}]));
});
test('PHP preview routing is explicit, templates stay denied and incomplete packages fail closed',()=>{
  const withPreview=renderRouter(original,'release-preview',[...artifact().ready.inventory,{path:'api/editor.php'}]);
  assert.ok(withPreview.includes('redaktion/(?:verbinden|trainerpool|daten|abmelden)'));
  assert.ok(withPreview.includes('api/preview-lib(?:/|$) - [F,END]'));
  assert.ok(!renderRouter(original,'release-without',artifact().ready.inventory).includes('redaktion/(?:verbinden'));
  const incomplete=artifact();incomplete.contents.set('api/editor.php',Buffer.from('<?php'));
  incomplete.ready.inventory.push({path:'api/editor.php',size:5,sha256:sha256('<?php')});
  incomplete.ready.files++;incomplete.ready.contentHash=sha256(JSON.stringify(incomplete.ready.inventory));
  assert.throws(()=>validateArtifact(incomplete.ready,incomplete.contents),/Incomplete private preview/);
});
