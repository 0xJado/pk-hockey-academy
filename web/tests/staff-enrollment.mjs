import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const output=fileURLToPath(new URL('../../output/staff-enrollment-tests/',import.meta.url));await mkdir(output,{recursive:true});
const php=process.env.PK_PHP_EXECUTABLE||'php';
const flags=process.env.PK_PHP_EXTENSION_DIR?['-n','-d','extension_dir='+process.env.PK_PHP_EXTENSION_DIR,'-d','extension=php_pdo_sqlite.dll','-d','extension=php_sodium.dll']:['-d','display_errors=0','-d','log_errors=0'];
const template=await readFile(new URL('../../hosting/strato/staff/enroll.php.template',import.meta.url),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
for(const failAfterStaff of [false,true]){
 const directory=await mkdtemp(output+'run-'),env={...process.env,PK_ENROLL_FIXTURE:directory};
 const run=action=>spawnSync(php,[...flags,'hosting/strato/tests/staff-enroll-fixture.php',action],{cwd:root,env,encoding:'utf8',windowsHide:true});
 const setup=run('setup');assert.equal(setup.status,0,setup.stderr);
 const token='Fictional-enrollment-capability';const scope={id:randomUUID(),public:(directory+'/public').replaceAll('\\','/'),private:(directory+'/private').replaceAll('\\','/'),routerHash:hash('isolated-router'),expires:Math.floor(Date.now()/1000)+600,fixture:true,failAfterStaff};
 await writeFile(directory+'/public/enroll.php',template.replace('__SCOPE__',Buffer.from(JSON.stringify(scope)).toString('base64')).replace('__TOKEN_HASH__',hash(token)));
 // Only this loopback-only router models the real host's HTTPS flag.
 await writeFile(directory+'/router.php',`<?php if(PHP_SAPI!=='cli-server')exit;$_SERVER['HTTPS']='on';require ${JSON.stringify(directory+'/public/enroll.php')};`);
 const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 const child=spawn(php,[...flags,'-S','127.0.0.1:'+port,directory+'/router.php'],{cwd:root,env,stdio:['ignore','ignore','ignore'],windowsHide:true});
 const origin='http://127.0.0.1:'+port;const password='Fictional-owner-password-2026';
 const post=(values={},originHeader='https://pkhockeyacademy.de')=>fetch(origin,{method:'POST',headers:{Origin:originHeader,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({setup:token,password,confirm:password,...values})});
 try{
  for(let i=0;i<60;i++){try{await fetch(origin);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  const get=await fetch(origin);check(get.status===200&&(await get.text()).includes('autocomplete="new-password"'),'owner enters a private password');
  check((await post({},'https://evil.example')).status===403,'foreign origin denied');
  check((await post({},'null')).status===403,'opaque origin denied');
  check((await post({setup:'wrong'})).status===403,'wrong capability denied');
  check((await post({password:'short',confirm:'short'})).status===422,'short password denied');
  check((await post({password:'😀'.repeat(20),confirm:'😀'.repeat(20)})).status===422,'bcrypt byte limit enforced for unicode');
  check((await post({confirm:'different'})).status===422,'confirmation mismatch denied');
  let state=JSON.parse(run('report').stdout);check(state.users===0&&!state.runtimeEnabled&&!state.staffEnabled,'invalid inputs never create users or change gates');
  const beforeIntake=await readFile(directory+'/private/intake.json');
  const response=await post();const text=await response.text();check(response.status===(failAfterStaff?503:200),'setup or injected interruption reports correct outcome');
  check(!text.includes(password)&&!text.includes(token)&&!text.includes(directory),'result exposes no password/capability/private path');
  state=JSON.parse(run('report').stdout);check(state.users===1&&state.audit===1&&state.passwordMatches,'one working personal credential and one audit event');
  check(state.runtimeEnabled===!failAfterStaff&&state.staffEnabled===!failAfterStaff&&state.maintenance===failAfterStaff,'only staff gates change; interrupted setup restores gates');
  check(state.paused===1&&Buffer.compare(beforeIntake,await readFile(directory+'/private/intake.json'))===0,'intake stays paused with byte-identical configuration');
  const originalHash=state.hash;check((await post()).status===503,'replayed enrollment cannot reset credential');
  state=JSON.parse(run('report').stdout);check(state.hash===originalHash&&state.users===1,'existing personal password is never overwritten');
 }finally{child.kill();}
}
console.log(JSON.stringify({passed:true,checks,storage:'isolated fictional SQLite',productionChanged:false}));
