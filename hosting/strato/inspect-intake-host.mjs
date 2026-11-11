// Read-only host facts + one stalled fictional upload. No intake activation or schema changes.
import assert from 'node:assert/strict';
import https from 'node:https';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {settings,connect,privateRoot} from './lib/sftp.mjs';
import {SftpReleaseStore} from './lib/release-store.mjs';
import {withReleaseLock} from './lib/releases.mjs';
import {activeRelease} from './lib/release-router.mjs';
import {sha256} from './lib/artifact.mjs';
let connection;
try {
 const env=await settings(),paths=JSON.parse(await readFile(new URL('runtime-inspection.json',privateRoot),'utf8'));
 assert.ok(paths.privateOutsidePublic);const token=randomBytes(32).toString('base64url');
 const helper=`<?php
declare(strict_types=1);ini_set('display_errors','0');ini_set('log_errors','0');
header('Content-Type: application/json');header('Cache-Control: no-store');header('X-Robots-Tag: noindex, nofollow');
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'||!hash_equals('${sha256(token)}',hash('sha256',$_SERVER['HTTP_X_PK_SETUP_TOKEN']??''))){http_response_code(403);exit;}
if(($_SERVER['HTTP_X_PK_PROBE']??'')==='slow'){$body=file_get_contents('php://input',false,null,0,17);http_response_code(400);echo '{"code":"fictional-incomplete-body"}';exit;}
try{
$path=base64_decode('${Buffer.from(paths.privatePath+'/registration/config.json').toString('base64')}',true);
$c=json_decode(file_get_contents($path),true,16,JSON_THROW_ON_ERROR);$db=new PDO($c['dsn'],$c['username'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$input=fopen('php://input','rb');$nonblocking=stream_set_blocking($input,false);$inputTimeout=stream_set_timeout($input,3);fclose($input);
preg_match('/;dbname=([a-zA-Z0-9_]+);/',$c['dsn'],$parts);$scoped=true;$grantOption=false;$admin=false;
foreach($db->query('SHOW GRANTS')->fetchAll(PDO::FETCH_COLUMN) as $grant){
 if(str_contains($grant,'WITH GRANT OPTION'))$grantOption=true;
 if(preg_match('/GRANT (?:ALL PRIVILEGES|.*CREATE USER.*) ON \\*\\.\\*/i',$grant))$admin=true;
 if(!preg_match('/\\AGRANT USAGE ON \\*\\.\\*/i',$grant)&&!str_contains($grant,'ON '.chr(96).$parts[1].chr(96).'.*'))$scoped=false;
}
echo json_encode(['maxInputTime'=>(int)ini_get('max_input_time'),'maxExecutionTime'=>(int)ini_get('max_execution_time'),'tls'=>(($_SERVER['HTTPS']??'')==='on'),
'sapi'=>PHP_SAPI,'inputNonblocking'=>$nonblocking,'inputTimeout'=>$inputTimeout,'pcntlAlarm'=>function_exists('pcntl_alarm'),'userIniFile'=>ini_get('user_ini.filename'),
'directPeerPublic'=>filter_var($_SERVER['REMOTE_ADDR']??'',FILTER_VALIDATE_IP,FILTER_FLAG_NO_PRIV_RANGE|FILTER_FLAG_NO_RES_RANGE)!==false,
'proxyHeaderPresent'=>isset($_SERVER['HTTP_X_FORWARDED_FOR'])||isset($_SERVER['HTTP_FORWARDED']),
'databaseScopedGrants'=>$scoped,'serverAccountAdministration'=>$admin,'grantOption'=>$grantOption,'requests'=>(int)$db->query('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn(),'claims'=>(int)$db->query('SELECT COUNT(*) FROM pk_intake_claims')->fetchColumn(),'users'=>(int)$db->query('SELECT COUNT(*) FROM pk_staff_users')->fetchColumn(),'intakePaused'=>(int)$db->query('SELECT paused FROM pk_intake_meta WHERE id=1')->fetchColumn()===1],JSON_THROW_ON_ERROR);
if(function_exists('opcache_invalidate'))opcache_invalidate(__FILE__,true);
}catch(Throwable){http_response_code(503);echo '{"code":"inspection-unavailable"}';}
`;
 connection=await connect();const store=new SftpReleaseStore(connection.call);let report;
 await withReleaseLock(store,async()=>{
  const before=await store.get('.htaccess'),release=activeRelease(before.toString());assert.notEqual(release,'legacy');
  const name='pk-intake-host-'+randomUUID()+'.php',remote='.pk-releases/'+release+'/api/'+name,url='https://pkhockeyacademy.de/api/'+name;
  const headers={Authorization:'Basic '+Buffer.from(env.STRATO_PREVIEW_USERNAME+':'+env.STRATO_PREVIEW_PASSWORD).toString('base64'),'X-PK-Setup-Token':token,'Content-Type':'application/json'};
  try {
   await store.put(remote,Buffer.from(helper));assert.equal(sha256(await store.get(remote)),sha256(helper));
   const response=await fetch(url,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);report=await response.json();
   const measure=drip=>new Promise(resolve=>{
    const started=Date.now();let done=false,timer,interval;
    const finish=value=>{if(done)return;done=true;clearTimeout(timer);clearInterval(interval);resolve({...value,elapsedMs:Date.now()-started});};
    const request=https.request(url,{method:'POST',headers:{...headers,'X-PK-Probe':'slow','Content-Length':drip?'16384':'16'}},response=>{
     response.resume();response.on('end',()=>finish({serverResponded:true,status:response.statusCode}));
    });
    const budget=drip&&process.env.PK_INTAKE_HOST_EXTENDED==='true'?75000:35000;
    timer=setTimeout(()=>{finish({serverResponded:false,clientAborted:true});request.destroy();},budget);
    request.on('error',()=>finish({serverResponded:false,connectionClosed:true}));
    request.write('{'); // Deliberately incomplete fictional JSON; no end(), no registration fields.
    if(drip)interval=setInterval(()=>{if(!done)request.write(' ');},2000);
   });
   if(process.env.PK_INTAKE_HOST_METADATA_ONLY!=='true')[report.slowUpload,report.slowDrip]=await Promise.all([measure(false),measure(true)]);
  } finally {
   if(await store.exists(remote))await store.remove(remote);assert.ok(!await store.exists(remote));
  }
  let removed=false;
  for(let i=0;i<12;i++){const response=await fetch(url,{method:'POST',headers:{Authorization:headers.Authorization},signal:AbortSignal.timeout(15000)});const status=response.status;await response.body?.cancel();if(status===404){removed=true;break;}await new Promise(r=>setTimeout(r,500));}
  assert.ok(removed,'Removed helper remains reachable');assert.equal(sha256(await store.get('.htaccess')),sha256(before));
  report.helperRemoved=true;report.routerUnchanged=true;
 });
 report.at=new Date().toISOString();const variant=process.env.PK_INTAKE_HOST_METADATA_ONLY==='true'?'metadata':process.env.PK_INTAKE_HOST_EXTENDED==='true'?'extended':'standard';
 await writeFile(new URL('intake-host-'+variant+'.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});
 await writeFile(new URL('intake-host-inspection.json',privateRoot),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report,null,2));
}catch {console.error('Intake host inspection failed. Inspect private state and helper cleanup; no activation requested.');process.exitCode=1;}
finally{connection?.close();}
