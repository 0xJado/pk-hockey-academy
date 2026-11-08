import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { settings, privateRoot } from './lib/sftp.mjs';

const env=await settings();
const auth='Basic '+Buffer.from(`${env.STRATO_PREVIEW_USERNAME}:${env.STRATO_PREVIEW_PASSWORD}`).toString('base64');
const ready=JSON.parse(await readFile(new URL('../../output/strato/READY.json',import.meta.url),'utf8'));
const origin='https://pkhockeyacademy.de';
const checks=[];
const request=async(path,{method='GET',anonymous=false,body}={})=>{
  const response=await fetch(origin+path,{method,body,redirect:'manual',signal:AbortSignal.timeout(15000),headers:anonymous?{}:{Authorization:auth}});
  const text=await response.text();
  checks.push({path,method,authenticated:!anonymous,status:response.status,type:response.headers.get('content-type')});
  return {response,text};
};
try {
  for(const file of ready.inventory.filter(x=>x.path.endsWith('.html')&&x.path!=='404.html'&&!x.path.startsWith('api/preview-lib/'))) {
    const route=file.path==='index.html'?'/':'/'+file.path.replace(/\/index\.html$/,'');
    const {response,text}=await request(route);
    assert.equal(response.status,200,route);
    assert.ok(response.headers.get('content-type')?.includes('text/html'),route);
    assert.match(text,/<html lang="de"/);
    assert.match(text,/name="robots"\s+content="noindex,nofollow"/);
    assert.equal((text.match(/<h1(?:\s|>)/g)||[]).length,1,route);
    assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
  }
  const types={'.css':'text/css','.js':'javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
  for(const file of ready.inventory) {
    const extension=Object.keys(types).find(suffix=>file.path.endsWith(suffix));
    if(!extension)continue;
    const {response}=await request('/'+file.path,{method:'HEAD'});
    assert.equal(response.status,200,file.path);
    assert.ok(response.headers.get('content-type')?.includes(types[extension]),'Wrong MIME type: '+file.path);
  }
  for(const path of ['/not-a-real-page','/assets/missing-file.css','/trainerpool/nonexistent-coach']) {
    const {response,text}=await request(path);assert.equal(response.status,404,path);
    assert.ok(!text.includes('SKILLS.<'), 'Missing resource should not serve homepage');
  }
  for(const method of ['GET','POST','OPTIONS']) {
    const {response,text}=await request('/api/registration',{method,...(method==='POST'?{body:'fictional transport check; no personal data'}:{})});
    assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(JSON.parse(text).code,'inactive');assert.ok(!text.includes('<?php'));
  }
  const phpPreview=ready.privatePreview==='php-candidate';
  for(const path of ['/api/registration.php',...(!phpPreview?['/api/preview/enable','/redaktion/trainerpool']:[]),'/api/preview-unavailable.php']) {
    const {response,text}=await request(path);assert.equal(response.status,503,path);assert.ok(!text.includes('<?php'));
  }
  if(phpPreview) {
    for(const [path,status] of [['/api/preview/enable',405],['/redaktion/trainerpool',401],['/redaktion/daten',401],['/redaktion/verbinden',200],['/api/preview-lib/preview-shell.html',403],['/api/preview-lib/Preview.php',403]])assert.equal((await request(path)).response.status,status,path);
    assert.equal((await request('/.pk-preview-location.json')).response.status,403);
    // STRATO can reject encoded paths before Apache's explicit 403 guard.
    for(const path of ['/%2epk-preview-location.json','/%2epk-releases/test','/%2epk-state/test','/api/%70review-lib/preview-shell.html'])assert.ok([400,403].includes((await request(path)).response.status),'Private encoded path was not denied');
  }
  const robots=await request('/robots.txt');assert.equal(robots.response.status,200);assert.match(robots.text,/Disallow:\s*\//);
  const sitemap=await request('/sitemap.xml');assert.equal(sitemap.response.status,200);assert.ok(!sitemap.text.includes('<loc>'));
  for(const path of ['/','/training','/api/registration','/_astro/missing.js'])assert.equal((await request(path,{anonymous:true})).response.status,401,path);
  for(const path of ['/.htaccess','/.env.local','/node_modules/test','/src/test'])assert.equal((await request(path)).response.status,403,path);
  await writeFile(new URL('host-acceptance.json',privateRoot),JSON.stringify({complete:true,verifiedAt:new Date().toISOString(),checks},null,2)+'\n');
  console.log(JSON.stringify({passed:true,httpChecks:checks.length,registration:'inactive',preview:phpPreview?'php-candidate':'unavailable',indexing:'disabled',protection:'enabled'}));
} catch(error) {
  await writeFile(new URL('host-acceptance.json',privateRoot),JSON.stringify({complete:false,message:error.message,checks},null,2)+'\n');
  console.error(JSON.stringify({passed:false,completedChecks:checks.length,lastCheck:checks.at(-1),reason:error.message}));process.exitCode=1;
}
