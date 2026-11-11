// Isolated staff HTTP/browser security acceptance with fictional records only.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,readFile,writeFile,open} from 'node:fs/promises';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=new URL('../../output/staff-tests/',import.meta.url);await mkdir(base,{recursive:true});
const fixture=await mkdtemp(new URL('run-',base));
const executable=process.env.PK_PHP_EXECUTABLE||'php';
const flags=process.env.PK_PHP_EXTENSION_DIR?['-n','-d','extension_dir='+process.env.PK_PHP_EXTENSION_DIR,'-d','extension=php_pdo_sqlite.dll','-d','extension=php_sodium.dll']:['-d','display_errors=0','-d','log_errors=0'];
const portServer=createServer();await new Promise(r=>portServer.listen(0,'127.0.0.1',r));const port=portServer.address().port;await new Promise(r=>portServer.close(r));
const origin='http://127.0.0.1:'+port,path='/intern/anmeldungen';
const env={...process.env,PK_STAFF_FIXTURE_ROOT:fixture,PK_STAFF_FIXTURE_ORIGIN:origin};
const run=(mode)=>{const r=spawnSync(executable,[...flags,'hosting/strato/tests/staff-fixture.php',...(mode?[mode]:[])],{cwd:root,env,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,'Synthetic staff setup failed');};run();
const {id}=JSON.parse(await readFile(fixture+'/fixture.json','utf8'));
const log=await open(fixture+'/server.log','w');
const server=spawn(executable,[...flags,'-S','127.0.0.1:'+port,'-t','hosting/strato/staff/public','hosting/strato/tests/staff-router.php'],{cwd:root,env,stdio:['ignore',log.fd,log.fd],windowsHide:true});
let browser,page,cookie='';let checks=0;
const check=(condition,label)=>{assert.ok(condition,label);checks++;};
async function request(query='',form,otherOrigin){
 const headers={};if(cookie)headers.Cookie=cookie;
 if(form){headers.Origin=otherOrigin||origin;headers['Content-Type']='application/x-www-form-urlencoded';}
 const response=await fetch(origin+path+query,{method:form?'POST':'GET',headers,body:form?new URLSearchParams(form):undefined,redirect:'manual'});
 const set=response.headers.getSetCookie().find(value=>value.startsWith('pk_staff_fixture='));if(set)cookie=set.split(';')[0];
 return {response,html:await response.text(),set};
}
const csrf=html=>{const match=html.match(/name="csrf" value="([a-f0-9]{64})"/);assert.ok(match,'CSRF form token missing');return match[1];};
try{
 for(let i=0;i<80;i++){try{await fetch(origin+path);break;}catch{if(server.exitCode!==null)throw Error('Local PHP server failed');await new Promise(r=>setTimeout(r,100));}}
 let r=await request('?record='+id);check(r.response.status===403&&!r.html.includes('FIKTIVES TESTKIND'),'anonymous direct record blocked');
 check(/HttpOnly/i.test(r.set)&&/SameSite=Strict/i.test(r.set),'fixture cookie is HttpOnly and SameSite Strict');
 check(/no-store/.test(r.response.headers.get('cache-control')),'private pages are not cacheable');
 check(r.response.headers.get('referrer-policy')==='same-origin','native forms preserve same-origin verification without cross-site referrers');
 let token=csrf(r.html);const pre=cookie;
 r=await request('',{action:'login',csrf:token,login:'fixture-owner',password:'SYNTHETIC-staff-password-only'},'https://attacker.invalid');check(r.response.status===403,'cross-origin login blocked');
 r=await request('',{action:'login',csrf:token,login:'fixture-owner',password:'SYNTHETIC-staff-password-only'},'null');check(r.response.status===403,'opaque origin rejected');
 r=await request('',{action:'login',csrf:token,login:'fixture-owner',password:'SYNTHETIC-staff-password-only'});check(r.response.status===303&&cookie!==pre,'successful login rotates cookie');
 r=await request('?record='+id);check(r.response.status===200&&r.html.includes('FIKTIVES TESTKIND'),'authorized detail works');
 check(r.html.includes('&lt;script&gt;')&&!r.html.includes('<script>alert(1)</script>'),'record content escaped');token=csrf(r.html);
 r=await request('',{action:'confirmed',csrf:'forged',record:id,version:'1',confirmedOutside:'yes'});check(r.response.status===403,'forged state-change token blocked');
 r=await request('',{action:'confirmed',csrf:token,record:id,version:'1',confirmedOutside:'yes'});check(r.response.status===303,'personal confirmation can be documented');
 r=await request('',{action:'withdrawn',csrf:token,record:id,version:'1'});check(r.response.status===403,'stale status write blocked');
 r=await request('?export=csv');check(r.response.status===403,'no export endpoint');
 r=await request('?record='+id);token=csrf(r.html);
 r=await request('',{action:'logout',csrf:token});check(r.response.status===303,'logout works');
 r=await request('?record='+id);check(r.response.status===403&&!r.html.includes('FIKTIVES TESTKIND'),'old signed-out session cannot read');
 browser=await chromium.launch({headless:true,...(process.env.PK_BROWSER_CHANNEL?{channel:process.env.PK_BROWSER_CHANNEL}:{})});
 const context=await browser.newContext({reducedMotion:'reduce'}),errors=[],external=[];page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
 await page.goto(origin+path);await page.getByLabel('Kennung',{exact:true}).fill('fixture-owner');await page.getByLabel('Passwort',{exact:true}).fill('SYNTHETIC-staff-password-only');
 const submitted=page.waitForResponse(response=>response.request().method()==='POST');
 await page.getByRole('button',{name:'Anmelden',exact:true}).click();
 const loginResponse=await submitted;assert.equal(loginResponse.status(),303,'Browser login rejected; inspect synthetic request metadata');
 await page.getByRole('link',{name:/FIKTIVES TESTKIND/}).click();
 check(await page.getByText('Einzeltermin',{exact:true}).isVisible(),'booking type is human-readable German');
 check(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/.test(await page.locator('body').innerText()),'proof timestamps are readable local dates');
 for(const width of [1440,768,375]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.locator('h1').count(),1);
  assert.ok(await page.getByRole('heading',{name:'Betreuungsrelevante Angaben'}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:fixture+'/staff-'+width+'.png',fullPage:true});checks++;
 }
 await page.keyboard.press('Tab');check(await page.evaluate(()=>document.activeElement!==document.body),'keyboard focus works');
 check(errors.length===0&&external.length===0,'no runtime errors or external requests');
 await page.getByRole('button',{name:'Abmelden',exact:true}).click();await page.getByRole('button',{name:'Anmelden',exact:true}).waitFor();
 await context.close();
 run('parallel-setup');
 const race=()=>new Promise((resolve,reject)=>{const child=spawn(executable,[...flags,'hosting/strato/tests/staff-fixture.php','parallel-worker'],{cwd:root,env,windowsHide:true});let text='';child.stdout.on('data',data=>text+=data);child.once('error',reject);child.once('exit',code=>code===0?resolve(text):reject(Error('Synthetic concurrent worker failed')));});
 const outcomes=await Promise.all([race(),race()]);check(outcomes.filter(x=>x==='accepted').length===1&&outcomes.filter(x=>x==='rejected').length===1,'concurrent staff writes commit exactly once');run('parallel-check');
 // Revocation is performed offline, not through a hidden HTTP test endpoint.
 r=await request();token=csrf(r.html);r=await request('',{action:'login',csrf:token,login:'fixture-owner',password:'SYNTHETIC-staff-password-only'});
 run('revoke');r=await request('?record='+id);check(r.response.status===403&&!r.html.includes('FIKTIVES TESTKIND'),'revocation defeats stale authenticated HTTP session');
 const configuration=JSON.parse(await readFile(fixture+'/config.json','utf8'));configuration.maintenance=true;await writeFile(fixture+'/config.json',JSON.stringify(configuration));
 r=await request();check(r.response.status===503,'maintenance mode blocks web access during recovery');
 configuration.maintenance=false;configuration.enabled=false;await writeFile(fixture+'/config.json',JSON.stringify(configuration));
 r=await request();check(r.response.status===503&&!r.html.includes('fixture@example.invalid'),'unavailable configuration fails closed without sensitive error');
 const result={passed:true,checks,viewports:[1440,768,375],publicIntakeEnabled:false,realDataUsed:false,database:'SQLite fixtures; STRATO acceptance pending'};
 await writeFile(fixture+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){if(page){await page.screenshot({path:fixture+'/failure.png',fullPage:true}).catch(()=>{});await writeFile(fixture+'/failure.html',await page.content().catch(()=>''));}throw error;}
finally{await browser?.close();server.kill();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);});await log.close();}
