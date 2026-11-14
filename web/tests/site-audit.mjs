// Current-build regression audit. Visual review is performed separately in IAB.
import assert from 'node:assert/strict';
import {mkdir,readdir,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {staticReviewServer} from './lib/static-review-server.mjs';
import {runFooterNavigation} from './footer-navigation.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),directory=resolve(root,'output/strato/public'),output=resolve(root,'output/playwright/full-site-audit');
await mkdir(output,{recursive:true});
async function htmlFiles(path){const result=[];for(const entry of await readdir(path,{withFileTypes:true})){const name=resolve(path,entry.name);if(entry.isDirectory())result.push(...await htmlFiles(name));else if(entry.name.endsWith('.html'))result.push(name);}return result;}
const routes=(await htmlFiles(directory)).filter(file=>!relative(directory,file).replaceAll('\\','/').startsWith('api/')).map(file=>'/'+relative(directory,file).replaceAll('\\','/').replace(/index\.html$/,'').replace(/\/$/,'')).map(route=>route||'/');
const server=await staticReviewServer(directory);let browser;let checks=0;const findings=[],seenLinks=new Set(),screenshots=[];
function check(value,label){checks++;if(!value)findings.push(label);}
try{
 browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push('HTTP '+response.status()+' '+new URL(response.url()).pathname);});
 await context.route('**/*',route=>[server.origin,'https://cdn.sanity.io'].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
 for(const route of routes){
  const response=await page.goto(server.origin+route);check(response.status()===200,'route '+route);
  await page.evaluate(()=>document.fonts.ready);
  check(await page.locator('h1').count()===1,'exactly one h1 '+route);
  check(await page.locator('html').getAttribute('lang')==='de','German document '+route);
  check(Boolean(await page.title()),'title '+route);
  check(Boolean(await page.locator('meta[name=description]').getAttribute('content')),'description '+route);
  check((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'),'protected indexing '+route);
  const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,index)=>ids.indexOf(id)!==index);});
  check(duplicateIds.length===0,'duplicate IDs '+route+': '+duplicateIds.join(','));
  const headings=await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(elements=>elements.map(element=>Number(element.tagName.slice(1))));
  check(headings.every((level,index)=>index===0||level<=headings[index-1]+1),'heading level skip '+route);
  check(await page.locator('img:not([alt])').count()===0,'unlabelled images '+route);
  const brokenImages=await page.locator('img').evaluateAll(async images=>{const broken=[];for(const image of images){image.loading='eager';try{await image.decode();}catch{broken.push(image.getAttribute('alt')||'image');}}return broken;});
  check(brokenImages.length===0,'broken images '+route+': '+brokenImages.join(','));
  const links=await page.locator('a[href]').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
  for(const href of links)if(href.startsWith('/')&&!href.startsWith('//'))seenLinks.add(new URL(href,server.origin).pathname);
  for(const width of [1440,768,375]){
   await page.setViewportSize({width,height:1000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+route+' '+width);
  }
  if(['/','/trainingstermine','/anmeldung','/kontakt','/datenschutz','/impressum'].includes(route)){
   const name=(route==='/'?'start':route.slice(1).replaceAll('/','-'))+'-375.png';await page.screenshot({path:resolve(output,name),fullPage:true});screenshots.push(name);
  }
 }
 for(const link of seenLinks){if(link.startsWith('/api/')||link.startsWith('/intern/'))continue;const response=await fetch(server.origin+link);check(response.ok,'broken internal link '+link);await response.body?.cancel();}
 await page.goto(server.origin+'/');
 const menu=page.locator('[data-mobile-menu]');
 await menu.locator('summary').click();check(await menu.evaluate(element=>element.open),'mobile menu opens');await page.keyboard.press('Escape');check(await menu.evaluate(element=>!element.open),'mobile menu closes with Escape');
 await page.goto(server.origin+'/anmeldung');await page.waitForFunction(()=>document.documentElement.dataset.motion==='ready');
 await page.locator('[data-mobile-menu] summary').click();await page.keyboard.press('Escape');check(await page.locator('[data-mobile-menu]').evaluate(element=>!element.open),'native registration menu supports Escape');
 await runFooterNavigation(page,server.origin);
 check(errors.length===0,'runtime errors: '+errors.join('; '));
 await context.close();
 const noJs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:1000}}),staticPage=await noJs.newPage();
 for(const route of ['/','/trainingstermine','/anmeldung','/kontakt']){
  await staticPage.goto(server.origin+route);check(await staticPage.locator('h1').isVisible(),'no-JS heading '+route);
  if(route==='/anmeldung')check(await staticPage.locator('[name=childName]').isDisabled(),'no-JS disabled registration');
 }
 await noJs.close();
 const report={passed:findings.length===0,routes:routes.length,viewports:[1440,768,375],checks,findings,screenshots,source:'current local STRATO artifact; real host and visual IAB acceptance reported separately',realDataUsed:false};
 await writeFile(resolve(output,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.equal(findings.length,0,'Site audit found issues; see output/playwright/full-site-audit/result.json');
}finally{await browser?.close();await server.close();}
