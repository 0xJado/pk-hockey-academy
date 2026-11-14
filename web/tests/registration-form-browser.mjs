// Complete local form → actual PHP intake → encrypted fixture → staff read.
// The extra route exists only with tests/fixtures/registration.config.mjs.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, open, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=new URL('../../output/intake-tests/',import.meta.url);await mkdir(base,{recursive:true});
const directory=await mkdtemp(new URL('form-',base));
const executable=process.env.PK_PHP_EXECUTABLE||'php';
const flags=process.env.PK_PHP_EXTENSION_DIR?['-n','-d','extension_dir='+process.env.PK_PHP_EXTENSION_DIR,'-d','extension=php_pdo_sqlite.dll','-d','extension=php_sodium.dll']:['-d','display_errors=0','-d','log_errors=0'];
const env={...process.env,PK_INTAKE_FIXTURE_ROOT:directory,SANITY_PROJECT_ID:'',PUBLIC_SANITY_PROJECT_ID:'',SANITY_DATASET:'',PUBLIC_SANITY_DATASET:'',SANITY_TRAINING_ENABLED:'false',SANITY_TRAINERS_ENABLED:'false',SANITY_GALLERY_ENABLED:'false'};
const php=(file,args=[])=>{const r=spawnSync(executable,[...flags,'hosting/strato/tests/'+file,...args],{cwd:root,env,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr||r.stdout);};
php('registration-fixture.php');
async function port(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const n=s.address().port;await new Promise(r=>s.close(r));return n;}
const phpPort=await port(),webPort=await port(),origin='http://127.0.0.1:'+webPort;
const children=[],logs=[];let browser,page,checks=0;
async function start(command,args,cwd){const log=await open(directory+'/server-'+logs.length+'.log','w');logs.push(log);const child=spawn(command,args,{cwd,env,stdio:['ignore',log.fd,log.fd],windowsHide:true});children.push(child);return child;}
const check=(value,label)=>{assert.ok(value,label);checks++;};
try {
 await start(executable,[...flags,'-S','127.0.0.1:'+phpPort,'-t','hosting/strato/registration/public','hosting/strato/tests/registration-router.php'],root);
 await start(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port',String(webPort),'--config','tests/fixtures/registration.config.mjs'],root+'/web');
 for(let i=0;i<120;i++){try{const r=await fetch(origin+'/__registration-fixture');if(r.status===200)break;if(i===119)throw Error('Fixture did not become ready');}catch(error){if(children.some(child=>child.exitCode!==null)||i===119)throw error;}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({reducedMotion:'reduce'});page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let mode='normal',writes=[],lost=false;
 await context.route('**/api/registration**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   if(path==='/api/registration')writes.push({body:request.postData(),key:request.headers()['idempotency-key']});
   const response=await route.fetch({url:'http://127.0.0.1:'+phpPort+path,headers:{...request.headers(),origin:'https://pkhockeyacademy.de'}});
   if(mode==='lost'&&path==='/api/registration'&&!lost){lost=true;return route.abort('failed');}
   return route.fulfill({response});
 });
 const openForm=async()=>{await page.goto(origin+'/__registration-fixture');await page.locator('[data-controls]').evaluate(e=>{if(e.disabled)throw Error('Form did not initialize');});};
 async function fill(kind='five') {
   await page.locator(`[name=bookingType][value=${kind}]`).check();
   if(kind==='single')await page.getByLabel('Trainingstermin *',{exact:true}).selectOption('fictional-session');
   for(const [name,value] of Object.entries({childName:'FIKTIVES KIND',birthYear:'2017',guardianName:'FIKTIVER KONTAKT',guardianPhone:'+49 000 000000',guardianEmail:'fixture@example.invalid'}))await page.locator(`[name=${name}]`).fill(value);
   await page.locator('[name=guardianAuthority]').check();
 }
 await openForm();
 for(const width of [1440,768,375]) {
   await page.setViewportSize({width,height:1000});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);
   check(await page.locator('h1').count()===1,'single h1 '+width);
   await page.screenshot({path:directory+'/form-'+width+'.png',fullPage:true});
 }
 check(await page.locator('input[type=checkbox]:checked').count()===0,'no preselected consents');
 await page.getByRole('button',{name:'Trainingsanfrage senden',exact:true}).click();
 check(await page.locator('[data-errors]').evaluate(e=>e===document.activeElement),'error summary receives focus');
 check(writes.length===0,'invalid draft never sent');
 await page.locator('[data-errors] a').first().click();
 check(await page.evaluate(()=>document.activeElement?.getAttribute('name'))==='bookingType','error link focuses control');
 await fill();
 await page.locator('[name=guardianPhone]').fill('123');
 await page.getByRole('button',{name:'Trainingsanfrage senden',exact:true}).click();
 await page.locator('[data-errors]:not([hidden])').waitFor();
 check(await page.locator('[name=guardianPhone]').getAttribute('aria-invalid')==='true','PHP field error marked inline');
 check(await page.locator('[data-errors]').evaluate(e=>e===document.activeElement),'PHP validation focuses summary');
 php('registration-form-inspect.php',['0']);
 await page.locator('[name=guardianPhone]').fill('+49 000 000000');writes=[];
 check(await page.locator('[name=healthNotes]').isDisabled(),'health requires separate opt-in');
 await page.locator('[name=consent-health]').check();await page.locator('[name=healthNotes]').fill('FIKTIVER BETREUUNGSHINWEIS');
 await page.locator('[name=consent-health]').uncheck();
 check(await page.locator('[name=healthNotes]').inputValue()==='','withdrawn unsent health content cleared');
 mode='lost';await page.getByRole('button',{name:'Trainingsanfrage senden',exact:true}).click();
 await page.getByRole('button',{name:'Dieselbe Anfrage erneut prüfen'}).waitFor();
 check(await page.locator('[data-feedback]').innerText().then(t=>t.includes('nicht bestätigt')),'lost receipt never shows success');
 check(await page.locator('[name=childName]').isDisabled(),'uncertain draft frozen');
 php('registration-form-inspect.php',['1']);
 await page.getByRole('button',{name:'Dieselbe Anfrage erneut prüfen'}).click();
 await page.waitForFunction(()=>document.querySelector('[data-feedback]')?.textContent?.includes('entgegengenommen'));
 check(writes.length===2&&writes[0].body===writes[1].body&&writes[0].key===writes[1].key,'retry uses identical bytes/key');
 check(!('healthNotes' in JSON.parse(writes[0].body)),'unconsented health excluded');
 check(await page.locator('[name=childName]').inputValue()==='','successful draft cleared');
 php('registration-form-inspect.php',['1']);
 mode='normal';await openForm();await fill('single');
 await page.locator('[name=consent-health]').check();await page.locator('[name=healthNotes]').fill('FIKTIVER BETREUUNGSHINWEIS');
 await page.getByRole('button',{name:'Trainingsanfrage senden',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-feedback]')?.textContent?.includes('entgegengenommen'));
 php('registration-form-inspect.php',['2']);
 check(JSON.parse(writes.at(-1).body).sessionId==='fictional-session','single session delivered');
 check(await page.evaluate(()=>localStorage.length===0&&sessionStorage.length===0),'no browser persistence');
 check(!page.url().includes('FIKTIV'),'no personal data in URL');
 // Public route remains disabled, including if JS is available.
 await page.goto(origin+'/anmeldung');check(await page.locator('[name=childName]').isDisabled(),'public form remains disabled');
 const noJs=await browser.newContext({javaScriptEnabled:false});const staticPage=await noJs.newPage();
 await staticPage.goto(origin+'/__registration-fixture');check(await staticPage.locator('[name=childName]').isDisabled(),'no-JS cannot submit');await noJs.close();
 check(errors.length===0,'no browser runtime errors');
 await writeFile(directory+'/result.json',JSON.stringify({passed:true,checks,viewports:[1440,768,375],actualPhp:true,storage:'isolated SQLite',staffReadsVerified:true,realDataUsed:false,publicIntakeEnabled:false},null,2));
 console.log(JSON.stringify({passed:true,checks,publicIntakeEnabled:false,realDataUsed:false}));
} catch(error){if(page)await page.screenshot({path:directory+'/failure.png',fullPage:true}).catch(()=>{});throw error;}
finally {await browser?.close();for(const child of children){child.kill();await new Promise(r=>{if(child.exitCode!==null)return r();child.once('exit',r);});}for(const log of logs)await log.close();}
