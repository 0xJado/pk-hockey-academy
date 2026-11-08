import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {randomUUID,randomBytes} from 'node:crypto';
import {settings,privateRoot} from './lib/sftp.mjs';

// Uses one owned, temporary native preview-secret document, never trainer edits.
const origin='https://pkhockeyacademy.de';
const checks=[];
let client,created,accepted=false,phase='configuration';
try {
  const env=await settings();let cms={};
  for(const name of ['.env','.env.local'])try{cms={...cms,...parseEnv(await readFile(new URL('../../web/'+name,import.meta.url),'utf8'))};}catch(error){if(error.code!=='ENOENT')throw error;}
  const authorization='Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64');
  const request=async(path,{status=200,body,cookie,foreign=false}={})=>{
    const response=await fetch(origin+path,{method:body?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(30000),headers:{Authorization:authorization,...(body?{'Content-Type':'application/json',Origin:foreign?'https://invalid.example':origin}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const text=await response.text();assert.equal(response.status,status,'Unexpected preview response');
    assert.match(response.headers.get('cache-control')||'',/no-store/);
    assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
    if(cms.SANITY_PREVIEW_READ_TOKEN)assert.ok(!text.includes(cms.SANITY_PREVIEW_READ_TOKEN),'Read token exposed');
    return {response,text};
  };
  phase='access-gates';
  await request('/redaktion/trainerpool',{status:401});await request('/redaktion/daten',{status:401});
  await request('/api/preview/enable',{status:405});
  const invalidBody={'sanity-preview-secret':'invalid-private-preview-secret'};
  await request('/api/preview/enable',{status:403,body:invalidBody,foreign:true});
  await request('/api/preview/enable',{status:401,body:invalidBody});checks.push('unauthenticated-invalid-link-and-origin-rejected');
  phase='native-preview-capability';
  const require=createRequire(new URL('../../studio/package.json',import.meta.url));
  const {getProjectCliClient}=await import(pathToFileURL(require.resolve('@sanity/cli-core')).href);
  client=(await getProjectCliClient({apiVersion:'2025-02-19',projectId:cms.SANITY_PROJECT_ID,requireUser:true})).withConfig({dataset:cms.SANITY_DATASET,useCdn:false});
  const secret=randomBytes(24).toString('base64url');
  created=await client.create({_id:'drafts.pk-strato-acceptance-'+randomUUID(),_type:'sanity.previewUrlSecret',source:'pk-strato-owned-acceptance',studioUrl:cms.PUBLIC_SANITY_STUDIO_URL,secret});
  phase='native-session-handoff';
  const enabled=await request('/api/preview/enable',{body:{'sanity-preview-secret':secret,'sanity-preview-pathname':'/redaktion/trainerpool?id=trainer-pierre-klein','sanity-preview-perspective':'drafts'}});
  assert.equal(JSON.parse(enabled.text).redirectTo,'/redaktion/trainerpool?id=trainer-pierre-klein');
  const header=enabled.response.headers.get('set-cookie');
  for(const attribute of ['HttpOnly','Secure','SameSite=None','Partitioned','Path=/redaktion','Max-Age=3600'])assert.ok(header?.includes(attribute),'Missing cookie guard');
  const cookie=header.split(';')[0];
  const html=await request('/redaktion/trainerpool?id=trainer-pierre-klein',{cookie});
  assert.ok(html.text.includes('id="pk-visual-editing"'));
  assert.match(html.response.headers.get('content-security-policy')||'',/frame-ancestors/);
  phase='private-perspectives';
  for(const perspective of ['drafts','published']){
    const {text}=await request('/redaktion/daten?id=trainer-pierre-klein&perspective='+perspective,{cookie});
    const data=JSON.parse(text);assert.equal(data.perspective,perspective);assert.ok(Array.isArray(data.documents));
    assert.ok(data.documents.length<=1);for(const doc of data.documents)assert.equal(doc._id.replace(/^drafts\./,''),'trainer-pierre-klein');
  }
  await request('/redaktion/daten',{status:401,cookie:cookie+'0'});checks.push('native-secret-session-selected-draft-and-published-data');
  const signout=await request('/redaktion/abmelden',{status:303,cookie});assert.equal(signout.response.headers.get('location'),'/trainerpool');assert.match(signout.response.headers.get('set-cookie')||'',/Max-Age=0/);
  await request('/redaktion/daten',{status:401});checks.push('signout-clears-matching-cookie');
  if(process.argv.includes('--browser')) {
    phase='standalone-browser';
    const webRequire=createRequire(new URL('../../web/package.json',import.meta.url));
    const {chromium}=webRequire('playwright');
    const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
    try {
      const context=await browser.newContext({reducedMotion:'reduce',httpCredentials:{origin,username:env.STRATO_PREVIEW_USERNAME,password:env.STRATO_PREVIEW_PASSWORD}});
      const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const fragment=new URLSearchParams({'sanity-preview-secret':secret,'sanity-preview-pathname':'/redaktion/trainerpool?id=trainer-pierre-klein','sanity-preview-perspective':'published'});
      await page.goto(origin+'/redaktion/verbinden#'+fragment);
      await page.waitForURL('**/redaktion/trainerpool?id=trainer-pierre-klein&perspective=published');
      await page.locator('#preview-profiles article').waitFor();
      assert.equal(await page.locator('#preview-status[role="alert"]').count(),0);
      assert.ok(await page.locator('[data-sanity]').count()>3);
      for(const width of [1440,768,375]) {
        await page.setViewportSize({width,height:900});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Private preview overflow');
        await page.screenshot({path:fileURLToPath(new URL('preview-live-'+width+'.png',privateRoot)),fullPage:true});
      }
      await page.locator('a[href="/redaktion/abmelden"]').click();await page.waitForURL(origin+'/trainerpool');
      assert.equal((await page.goto(origin+'/redaktion/trainerpool')).status(),401);
      assert.equal(errors.length,0,'Private preview browser runtime error');
      checks.push('standalone-browser-handoff-layouts-and-signout');
    }finally{await browser.close();}
  }
  accepted=true;
}catch{
  // Browser/SDK exceptions can contain bearer fragments or request payloads.
  // Persist stages only, never raw errors, bodies, headers or session URLs.
  await writeFile(new URL('php-preview-error.json',privateRoot),JSON.stringify({phase,code:'verification_failed',checks,at:new Date().toISOString()}));
  console.error('Live private-preview acceptance failed; inspect the ignored private diagnostic. Studio remains on its existing destination.');process.exitCode=1;
}finally{
  if(client&&created)try{
    const current=await client.getDocument(created._id);
    assert.equal(current?.source,'pk-strato-owned-acceptance');assert.equal(current?.secret,created.secret);
    await client.transaction().patch(current._id,patch=>patch.ifRevisionId(current._rev).set({_pkAcceptanceCleanup:true})).delete(current._id).commit();
  }catch{
    await writeFile(new URL('php-preview-cleanup.json',privateRoot),JSON.stringify({documentId:created._id,at:new Date().toISOString(),requiresInspection:true}));
    console.error('Temporary preview-secret cleanup needs private inspection. No trainer content was changed.');process.exitCode=1;
  }
}
if(accepted&&!process.exitCode){
  await writeFile(new URL('php-preview-acceptance.json',privateRoot),JSON.stringify({passed:true,checks,at:new Date().toISOString(),studioSwitched:false,temporarySecretRemoved:true},null,2));
  await rm(new URL('php-preview-error.json',privateRoot),{force:true});
  console.log(JSON.stringify({passed:true,checks,studioSwitched:false,temporarySecretRemoved:true}));
}
