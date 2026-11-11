// Actual compiled STRATO pages: questionnaires remain unavailable even with launch=false.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('../../output/strato/public/',import.meta.url)));
const output=fileURLToPath(new URL('../../output/playwright/interview-scope/',import.meta.url));await mkdir(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep))return res.writeHead(403).end();if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser;const errors=[],external=[];let checked=0;
try{
 browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  window.__interviewSpeechCalls=0;
  const recognition=function(){window.__interviewSpeechCalls++;};
  Object.defineProperty(window,'SpeechRecognition',{value:recognition,configurable:true});
  Object.defineProperty(window,'webkitSpeechRecognition',{value:recognition,configurable:true});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices(){window.__interviewSpeechCalls++;return[];},speak(){window.__interviewSpeechCalls++;},cancel(){window.__interviewSpeechCalls++;},addEventListener(){window.__interviewSpeechCalls++;}},configurable:true});
 });
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 for(const width of [1440,768,375])for(const route of ['/interviews','/spieler-interview','/trainer-interview']){
  await page.setViewportSize({width,height:1000});const response=await page.goto(origin+route);assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('form,input,textarea,[data-interview]').count(),0);
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.evaluate(()=>window.__interviewSpeechCalls),0,'omitted interviews must not initialize speech services');
  await page.screenshot({path:resolve(output,route.slice(1)+'-'+width+'.png'),fullPage:true});checked++;
 }
 await page.goto(origin+'/interviews');await page.goto(origin+'/spieler-interview');await page.goBack();assert.equal(await page.locator('form,input,textarea,[data-interview]').count(),0);
 const noJS=await browser.newContext({javaScriptEnabled:false});const fallback=await noJS.newPage();
 for(const route of ['/interviews','/spieler-interview','/trainer-interview']){await fallback.goto(origin+route);assert.equal(await fallback.locator('form,input,textarea,[data-interview]').count(),0);checked++;}
 await noJS.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const result={passed:true,checks:checked,realDeviceSpeechAccepted:false,interviewsActivated:false,history:true,noJS:true,errors,external};
 await writeFile(resolve(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
