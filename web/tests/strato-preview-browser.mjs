import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,mkdtemp,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {chromium} from 'playwright';

const root=new URL('../../output/strato-preview-candidate/public/',import.meta.url);
const output=new URL('../../output/playwright/strato-preview/',import.meta.url);await mkdir(output,{recursive:true});
const state=new URL('state.json',output);await writeFile(state,'{}');
const installation=await mkdtemp(fileURLToPath(new URL('installer-test-',output)));
const privatePath=join(installation,'private');await mkdir(privatePath);
const installer=join(installation,'installer.php');
const setupToken='ISOLATED_INSTALL_KEY';
const installerSource=(await readFile(new URL('../../hosting/strato/preview/install.php.template',import.meta.url),'utf8'))
  .replace('__SETUP_SHA256__',createHash('sha256').update(setupToken).digest('hex'))
  .replace('__PATHS_BASE64__',Buffer.from(JSON.stringify({publicPath:await realpath(fileURLToPath(root)),privatePath:await realpath(privatePath)})).toString('base64'));
await writeFile(installer,installerSource);
const socket=createServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const origin='http://localhost:'+port;
const executable=process.env.PK_PHP_EXECUTABLE||(process.platform==='win32'?fileURLToPath(new URL('../../.tools/php-8.4.27/php.exe',import.meta.url)):'php');
const server=spawn(executable,['-n','-S','localhost:'+port,fileURLToPath(new URL('../../hosting/strato/tests/preview-server.php',import.meta.url))],{env:{...process.env,PK_PREVIEW_FIXTURE_ROOT:fileURLToPath(root),PK_PREVIEW_FIXTURE_STATE:fileURLToPath(state),PK_PREVIEW_FIXTURE_INSTALLER:installer},stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';server.stdout.on('data',bytes=>{log+=bytes;});server.stderr.on('data',bytes=>{log+=bytes;});
let browser;
try {
  for(let attempt=0;attempt<60;attempt++){try{if((await fetch(origin+'/redaktion/trainerpool')).status===401)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
  const anonymous=await fetch(origin+'/redaktion/daten');assert.equal(anonymous.status,401);assert.ok(!(await anonymous.text()).includes('Entwurfsrolle'));
  assert.equal((await fetch(origin+'/preview/preview-shell.html')).status,404);
  assert.equal((await fetch(origin+'/__private-preview-template')).status,404);
  assert.equal((await fetch(origin+'/api/preview/enable?sanity-preview-secret=URL_SECRET_TEST')).status,405);
  assert.equal((await fetch(origin+'/api/preview/enable',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await fetch(origin+'/api/preview/enable',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify({'sanity-preview-secret':'ISOLATED_PREVIEW_SECRET'})})).status,403);
  const setupConfig=JSON.stringify({projectId:'cmsqa123',dataset:'qa',readToken:'ISOLATED_SERVER_TOKEN',sessionKey:'fixture-key-'.repeat(5),studioUrl:'https://example.sanity.studio/',siteOrigin:'https://pkhockeyacademy.de'});
  const install=body=>fetch(origin+'/__fixture/install',{method:'POST',headers:{'Content-Type':'application/json','X-PK-Setup-Token':setupToken},body});
  assert.equal((await fetch(origin+'/__fixture/install')).status,403);
  assert.equal((await fetch(origin+'/__fixture/install',{method:'POST',headers:{'Content-Type':'application/json'},body:setupConfig})).status,403);
  assert.equal((await install(setupConfig)).status,201);
  assert.equal(await readFile(join(privatePath,'preview-config.json'),'utf8'),setupConfig);
  assert.equal((await install(setupConfig)).status,200);
  assert.equal((await install(setupConfig.replace('ISOLATED_SERVER_TOKEN','DIFFERENT_SERVER_TOKEN'))).status,409);
  assert.equal((await install('x'.repeat(8193))).status,413);
  assert.equal(await readFile(join(privatePath,'preview-config.json'),'utf8'),setupConfig);
  const channel=process.env.PK_BROWSER_CHANNEL??(process.platform==='win32'?'msedge':undefined);
  browser=await chromium.launch({headless:true,...(channel?{channel}:{})});
  const context=await browser.newContext({reducedMotion:'reduce'});
  const errors=[];const requests=[];
  context.on('request',request=>requests.push(request.url()));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4S8AAAAASUVORK5CYII=','base64');
  await context.route('https://cdn.sanity.io/**',route=>route.fulfill({body:png,contentType:'image/png'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  const fragment=new URLSearchParams({'sanity-preview-secret':'ISOLATED_PREVIEW_SECRET','sanity-preview-pathname':'/redaktion/trainerpool','sanity-preview-perspective':'drafts'});
  await page.goto(origin+'/redaktion/verbinden#'+fragment);
  await page.waitForURL(origin+'/redaktion/trainerpool');
  await page.locator('#preview-profiles article').waitFor();
  assert.ok(await page.locator('#preview-profiles').innerText().then(text=>text.includes('Entwurfsrolle')));
  assert.ok(await page.locator('#preview-incomplete').innerText().then(text=>text.includes('noch unvollständig')));
  assert.equal(await page.evaluate(()=>window.__draftXss),undefined);
  assert.ok(await page.locator('[data-sanity]').count()>8);
  assert.ok(!(await page.content()).includes('ISOLATED_SERVER_TOKEN'));
  assert.ok(requests.every(url=>!url.includes('ISOLATED_PREVIEW_SECRET')));
  for(const width of [1440,768,375]){
    await page.setViewportSize({width,height:900});await page.screenshot({path:fileURLToPath(new URL('preview-'+width+'.png',output)),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+width);
  }
  const field=page.locator('.trainer-copy [data-sanity]').first();assert.ok((await field.getAttribute('data-sanity')).includes('id=fixture-preview;'));
  await page.locator('.trainer-copy a[href*="id=fixture-preview"]').click();await page.waitForURL('**/redaktion/trainerpool?id=fixture-preview');await page.locator('#preview-profiles article').waitFor();
  await writeFile(state,JSON.stringify({role:'Geänderte technische Entwurfsrolle'}));await page.reload();await page.getByText('Geänderte technische Entwurfsrolle · PK Hockey Academy').waitFor();
  await page.goto(origin+'/redaktion/trainerpool?id=fixture-preview&perspective=published');await page.getByText('Veröffentlichte Testrolle · PK Hockey Academy').waitFor();
  await writeFile(state,JSON.stringify({noPortrait:true}));await page.goto(origin+'/redaktion/trainerpool');await page.locator('#preview-profiles article').waitFor();assert.equal(await page.locator('.trainer-portrait--photo').count(),0);
  await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement?.tagName==='A'),'Keyboard navigation reaches a link');
  const noJs=await browser.newContext({javaScriptEnabled:false,storageState:await context.storageState()});
  const noJsPage=await noJs.newPage();assert.equal((await noJsPage.goto(origin+'/redaktion/trainerpool')).status(),200);
  assert.ok((await noJsPage.locator('body').innerText()).includes('JavaScript erforderlich'));
  assert.ok(!(await noJsPage.locator('body').innerText()).includes('Entwurfsrolle'));
  await noJs.close();
  await page.locator('a[href="/redaktion/abmelden"]').click();await page.waitForURL(origin+'/trainerpool');assert.equal((await page.goto(origin+'/redaktion/trainerpool')).status(),401);
  assert.equal(errors.length,0,errors.join('\n'));
  assert.ok(!log.includes('ISOLATED_PREVIEW_SECRET'),'Fragment secret absent from server URL logs');
  console.log('PHP preview browser passed: fragment handoff, private data, shared layout at 1440/768/375, escaping, field metadata, selected navigation, refreshed draft, published perspective, missing portrait and signout. Live Studio connection remains separate acceptance.');
}finally{await browser?.close();server.kill();await writeFile(new URL('server.log',output),log);}
