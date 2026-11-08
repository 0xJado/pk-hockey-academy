import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const web=new URL('../../',import.meta.url),output=new URL('../../../output/',import.meta.url);
await mkdir(output,{recursive:true});
const root=await mkdtemp(fileURLToPath(new URL('strato-download-test-',output)));
const env={...process.env,DEPLOY_TARGET:'strato',VERCEL:'',PUBLIC_LAUNCH_READY:'false',SITE_URL:'',SANITY_PROJECT_ID:'cmsqa123',SANITY_DATASET:'qa',SANITY_READ_TOKEN:'',SANITY_PREVIEW_READ_TOKEN:'',SANITY_TRAINERS_ENABLED:'true',SANITY_TRAINING_ENABLED:'false',SANITY_SOCIAL_ENABLED:'false',PUBLIC_SANITY_STUDIO_URL:'',PK_CMS_QA_MODE:'empty',PK_CMS_QA_TRACE:root+'/trace.jsonl',NODE_OPTIONS:`--import="${new URL('strato-download-fixture.mjs',import.meta.url).href}"`};
for(const mode of ['published','withdrawn','invalid']) {
  const folder=root+'/'+mode;
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('node_modules/astro/bin/astro.mjs',web)),'build','--outDir',folder],{cwd:fileURLToPath(web),env:{...env,PK_STRATO_QA_EMPTY:String(mode==='withdrawn'),PK_STRATO_QA_BAD_SIZE:String(mode==='invalid')},encoding:'utf8',timeout:120000});
  if(mode==='invalid'){assert.notEqual(result.status,0,'Invalid download must stop publication');assert.match(result.stdout+result.stderr,/Incomplete release download/);continue;}
  assert.equal(result.status,0,(result.stdout+result.stderr).slice(-2000));
  const page=await readFile(folder+'/medienkit/index.html','utf8');
  const path=folder+'/downloads/medienkit/entry-strato-fixture.png';
  if(mode==='published'){
    assert.ok(page.includes('href="/downloads/medienkit/entry-strato-fixture.png"'));
    const bytes=await readFile(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');
  }else{assert.ok(!page.includes('entry-strato-fixture'));await assert.rejects(access(path));}
}
console.log('STRATO download builds passed: published bytes/link, withdrawn path absent, invalid bytes reject publication.');
