// Isolated API acceptance. Two real PHP workers share fictional SQLite storage.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,open,writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const base=new URL('../../output/intake-tests/',import.meta.url);await mkdir(base,{recursive:true});
const directory=await mkdtemp(new URL('run-',base));
const executable=process.env.PK_PHP_EXECUTABLE||'php';
const flags=process.env.PK_PHP_EXTENSION_DIR?['-n','-d','extension_dir='+process.env.PK_PHP_EXTENSION_DIR,'-d','extension=php_pdo_sqlite.dll','-d','extension=php_sodium.dll']:['-d','display_errors=0','-d','log_errors=0'];
const env={...process.env,PK_INTAKE_FIXTURE_ROOT:directory};
const setup=spawnSync(executable,[...flags,'hosting/strato/tests/registration-fixture.php'],{cwd:root,env,encoding:'utf8',windowsHide:true});assert.equal(setup.status,0,'Isolated intake fixture failed');
const servers=[],logs=[],origins=[];let checks=0;
const check=(condition,label)=>{assert.ok(condition,label);checks++;};
const input={policyVersion:'registration-request-v1-2026-11-11',childName:'FIKTIVES KIND',birthYear:'2017',guardianName:'FIKTIVER KONTAKT',guardianPhone:'+49 000 000000',guardianEmail:'fixture@example.invalid',bookingType:'five',guardianAuthority:true,consents:{}};
try {
 for(let worker=0;worker<2;worker++) {
  const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
  const origin='http://127.0.0.1:'+port;origins.push(origin);const log=await open(directory+'/worker-'+worker+'.log','w');logs.push(log);
  const server=spawn(executable,[...flags,'-S','127.0.0.1:'+port,'-t','hosting/strato/registration/public','hosting/strato/tests/registration-router.php'],{cwd:root,env,stdio:['ignore',log.fd,log.fd],windowsHide:true});servers.push(server);
  for(let i=0;i<80;i++){try{await fetch(origin+'/api/registration');break;}catch{if(server.exitCode!==null)throw Error('PHP worker failed');await new Promise(r=>setTimeout(r,100));}}
 }
 async function request(path='/api/registration',body=input,token='',worker=0,headers={}) {
  const response=await fetch(origins[worker]+path,{method:'POST',headers:{Origin:'https://pkhockeyacademy.de','Content-Type':'application/json','Idempotency-Key':token,...headers},body:typeof body==='string'?body:JSON.stringify(body),redirect:'manual'});
  return {status:response.status,headers:response.headers,body:await response.json()};
 }
 const token=async()=>{const r=await request('/api/registration/token',{});assert.equal(r.status,200);return r.body.token;};
 let r=await request('/api/registration',input,'',0,{Origin:'null'});check(r.status===403,'opaque origin denied');
 r=await request('/api/registration',input,'',0,{Origin:'https://attacker.invalid'});check(r.status===403,'foreign origin denied');
 const key=await token();
 const outcomes=await Promise.all([request('/api/registration',input,key,0),request('/api/registration',input,key,1)]);
 check(outcomes.filter(r=>r.status===201).length===1,'two actual workers create exactly one record');
 const resolved=await request('/api/registration',input,key,1);check(resolved.status===200,'concurrent retry resolves to existing receipt');
 check(outcomes.filter(r=>[200,201].includes(r.status)).every(r=>r.body.reference===resolved.body.reference),'successful concurrent responses agree on receipt');
 r=await request('/api/registration',{...input,childName:'OTHER FIKTIVES KIND'},key);check(r.status===409&&r.body.code==='idempotency-conflict','conflicting concurrent key cannot change record');
 r=await request('/api/registration','{"consents":{"health":true,"health":false}}',await token());check(r.status===400,'ambiguous JSON refused over HTTP');
 r=await request('/api/registration',{...input,healthNotes:'FIKTIVER HINWEIS'},await token());check(r.status===422,'health without consent refused over HTTP');
 r=await request('/api/registration',{...input,bookingType:'single',sessionId:'missing'},await token());check(r.status===422,'invalid single session refused');
 r=await request('/api/registration',{...input,bookingType:'single',sessionId:'fictional-session'},await token());check(r.status===201,'verified fictional single accepted as request');
 check(/no-store/.test(r.headers.get('cache-control'))&&r.headers.get('x-robots-tag').includes('noindex')&&!r.headers.has('access-control-allow-origin'),'private no-cache/noindex/same-origin response');
 check(!JSON.stringify(r.body).includes('FIKTIV')&&!JSON.stringify(r.body).includes('example.invalid'),'HTTP response excludes participant values');
 r=await request('/api/registration','x'.repeat(16385),key);check(r.status===413,'oversized body refused');
 r=await request('/api/registration?childName=DO-NOT-LOG',input,key);check(r.status===400,'query body substitution refused');
 // Invalid forwarded values must not replace the direct loopback peer.
 r=await request('/api/registration',input,key,0,{'X-Forwarded-For':'attacker-controlled'});check(r.status===200,'forwarded identity ignored');
 await writeFile(directory+'/enabled','no');r=await request('/api/registration',input,key);check(r.status===503&&r.body.code==='inactive','maintenance blocks active API');
 const evidence={passed:true,checks,workers:2,storage:'isolated SQLite fictional fixtures',publicIntakeEnabled:false};
 await writeFile(directory+'/result.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
} finally {
 for(const server of servers){server.kill();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);});}
 for(const log of logs)await log.close();
}
