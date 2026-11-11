<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
foreach (['Policy','Intake','Sessions','Http'] as $name) require __DIR__.'/../registration/'.$name.'.php';
require __DIR__.'/../staff/Staff.php';
$directory=getenv('PK_INTAKE_FIXTURE_ROOT') ?: '';
if (!is_dir($directory) || !str_contains(str_replace('\\','/',$directory),'/output/intake-tests/')) throw new RuntimeException('Fixture scope required');
$keys=array_combine(['data','auth','audit','backup'],array_map(fn()=>base64_encode(random_bytes(32)),range(1,4)));
file_put_contents($directory.'/keys.json',json_encode($keys,JSON_THROW_ON_ERROR));
$keys=array_map(fn($value)=>base64_decode($value),$keys);
$db=new PDO('sqlite:'.$directory.'/fixture.sqlite'); $db->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
$staff=new \PK\Staff\Staff($db,$keys,$directory.'/journal.enc',true); $staff->migrate();
$policy=new \PK\Registration\Policy(json_decode(file_get_contents(__DIR__.'/../registration/policy.v1.json'),true));
$intake=new \PK\Registration\Intake($db,$keys,$policy,fn()=>null,true); $intake->migrate(); $intake->pause(false);
file_put_contents($directory.'/enabled','yes');
echo "Fictional HTTP fixture ready.\n";
