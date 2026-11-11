<?php
declare(strict_types=1);
// Loopback-only test router, never part of any deployment artifact.
ini_set('display_errors','0');ini_set('log_errors','0');
if(PHP_SAPI!=='cli-server'||!in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)){http_response_code(404);exit;}
file_put_contents((getenv('PK_STAFF_FIXTURE_ROOT')?:'').'/request-metadata.jsonl',json_encode(['method'=>$_SERVER['REQUEST_METHOD']??'','origin'=>$_SERVER['HTTP_ORIGIN']??'','type'=>$_SERVER['CONTENT_TYPE']??'','length'=>$_SERVER['CONTENT_LENGTH']??''])."\n",FILE_APPEND);
require __DIR__.'/../staff/Staff.php';require __DIR__.'/../staff/Config.php';require __DIR__.'/../staff/Http.php';
try{
 [$config,$app]=\PK\Staff\Config::load((getenv('PK_STAFF_FIXTURE_ROOT')?:'').'/config.json',__DIR__.'/../staff/public',true);
 \PK\Staff\Http::serve($app,$config,true);
}catch(Throwable){http_response_code(503);header('Cache-Control: no-store');echo 'Testverwaltung nicht verfügbar.';}
