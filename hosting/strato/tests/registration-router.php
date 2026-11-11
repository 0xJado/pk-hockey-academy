<?php
declare(strict_types=1);
// Local CLI development server only. Never part of a deployment artifact.
if (PHP_SAPI!=='cli-server' || !in_array($_SERVER['REMOTE_ADDR'] ?? '',['127.0.0.1','::1'],true)) { http_response_code(404); exit; }
ini_set('display_errors','0'); ini_set('log_errors','0');
foreach (['Policy','Intake','Sessions','Http'] as $name) require __DIR__.'/../registration/'.$name.'.php';
$directory=getenv('PK_INTAKE_FIXTURE_ROOT') ?: '';
if (!is_dir($directory) || !str_contains(str_replace('\\','/',$directory),'/output/intake-tests/')) { http_response_code(503); exit; }
// Emulate the production TLS server variable in this strictly loopback-only fixture.
$_SERVER['HTTPS']='on';
$service=static function() use($directory) {
    $db=new PDO('sqlite:'.$directory.'/fixture.sqlite'); $db->exec('PRAGMA busy_timeout=5000');
    $keys=array_map(fn($key)=>base64_decode($key),json_decode(file_get_contents($directory.'/keys.json'),true));
    $policy=new \PK\Registration\Policy(json_decode(file_get_contents(__DIR__.'/../registration/policy.v1.json'),true));
    return new \PK\Registration\Intake($db,$keys,$policy,fn($id)=>$id==='fictional-session'?['id'=>$id,'requestable'=>true]:null,true);
};
\PK\Registration\Http::emit(\PK\Registration\Http::handle($_SERVER,trim(file_get_contents($directory.'/enabled'))==='yes',$service,
    static fn($limit)=>file_get_contents('php://input',false,null,0,$limit)));
