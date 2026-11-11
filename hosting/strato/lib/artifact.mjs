import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function publicPath(path) {
  return typeof path === 'string' && /^[A-Za-z0-9_./-]+$/.test(path)
    && !path.startsWith('/') && path.split('/').every(part=>part && part!=='.' && part!=='..')
    && !/(^|\/)(?:\.env[^/]*|node_modules|private|server|src|staff|database|vendor)(\/|$)/.test(path)
    && (path==='.htaccess' || path==='api/preview-lib/.htaccess' || !path.split('/').some(part=>part.startsWith('.')));
}
export function validateArtifact(ready,contents) {
  assert.equal(ready.schemaVersion,1,'Unverified artifact');
  assert.equal(ready.target,'strato','Wrong deployment target');
  assert.equal(ready.contentHash,sha256(JSON.stringify(ready.inventory)),'Manifest was modified');
  assert.equal(ready.files,ready.inventory.length,'Wrong inventory size');
  assert.equal(new Set(ready.inventory.map(file=>file.path)).size,ready.files,'Duplicate inventory path');
  assert.equal(contents.size,ready.files,'Extra or duplicate artifact paths');
  for(const file of ready.inventory) {
    assert.ok(publicPath(file.path),'Unsafe artifact path');
    const bytes=contents.get(file.path);
    assert.ok(Buffer.isBuffer(bytes),'Missing artifact file');
    assert.equal(bytes.length,file.size,'Changed artifact size');
    assert.equal(sha256(bytes),file.sha256,'Changed artifact hash');
    if(file.path.endsWith('.html'))assert.match(bytes.toString(),/name="robots"\s+content="noindex,nofollow"/,'Indexing must remain disabled');
    assert.ok(!/\.(?:astro|mjs|ts|map|template)$/.test(file.path),'Source file in public artifact');
  }
  for(const name of ['index.html','404.html','robots.txt','sitemap.xml','api/registration.php','api/preview-unavailable.php'])assert.ok(contents.has(name),'Required artifact missing');
  assert.match(contents.get('robots.txt').toString(),/Disallow:\s*\//);
  assert.ok(!contents.get('sitemap.xml').toString().includes('<loc>'),'Protected sitemap must be empty');
  if(contents.has('api/editor.php')) {
    for(const name of ['api/preview-lib/Preview.php','api/preview-lib/preview-shell.html','api/preview-lib/preview-connect.html'])assert.ok(contents.has(name),'Incomplete private preview package');
    assert.match(contents.get('api/preview-lib/.htaccess')?.toString()||'',/^Require all denied\s*$/,'Private templates need a direct-access guard');
  }
  return {ready,contents};
}
export async function loadArtifact(root=new URL('../../../output/strato/',import.meta.url),secrets=[]) {
  const ready=JSON.parse(await readFile(new URL('READY.json',root),'utf8'));
  const folder=new URL('public/',root);
  const walk=async(dir,prefix='')=>{
    const files=[];
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      assert.ok(!entry.isSymbolicLink(),'Artifact symlink rejected');
      const path=prefix+entry.name;assert.ok(publicPath(path),'Unsafe artifact path');
      if(entry.isDirectory())files.push(...await walk(new URL(entry.name+'/',dir),path+'/'));else files.push(path);
    }
    return files;
  };
  const paths=await walk(folder);
  const contents=new Map(await Promise.all(paths.map(async path=>[path,await readFile(new URL(path,folder))])));
  validateArtifact(ready,contents);
  for(const secret of secrets.filter(Boolean))for(const bytes of contents.values())assert.ok(!bytes.includes(Buffer.from(secret)),'Credential found in artifact');
  return {ready,contents};
}
