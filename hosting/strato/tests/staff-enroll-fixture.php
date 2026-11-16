<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
require __DIR__.'/../staff/Staff.php';require __DIR__.'/../registration/Policy.php';require __DIR__.'/../registration/Intake.php';
$root=getenv('PK_ENROLL_FIXTURE');if(!$root||!is_dir($root))exit(1);
if(($argv[1]??'')==='report'){
 $db=new PDO('sqlite:'.$root.'/private/database.sqlite');$staff=json_decode(file_get_contents($root.'/private/staff.json'),true);$runtime=json_decode(file_get_contents($root.'/private/runtime.json'),true);
 $hash=$db->query('SELECT password_hash FROM pk_staff_users LIMIT 1')->fetchColumn();
 echo json_encode(['users'=>(int)$db->query('SELECT COUNT(*) FROM pk_staff_users')->fetchColumn(),'audit'=>(int)$db->query('SELECT COUNT(*) FROM pk_staff_audit')->fetchColumn(),'hash'=>$hash,'passwordMatches'=>is_string($hash)&&password_verify('Fictional-owner-password-2026',$hash),'staffEnabled'=>$staff['enabled'],'maintenance'=>$staff['maintenance'],'runtimeEnabled'=>$runtime['enabled'],'paused'=>(int)$db->query('SELECT paused FROM pk_intake_meta')->fetchColumn()],JSON_THROW_ON_ERROR);exit;
}
mkdir($root.'/public');mkdir($root.'/public/.pk-state');mkdir($root.'/private');mkdir($root.'/private/backups');
$public=str_replace('\\','/',realpath($root.'/public'));$private=str_replace('\\','/',realpath($root.'/private'));file_put_contents($public.'/.htaccess','isolated-router');
$keys=array_combine(['data','auth','audit','backup'],array_map(fn()=>random_bytes(32),range(1,4)));
$db=new PDO('sqlite:'.$private.'/database.sqlite');$staff=new PK\Staff\Staff($db,$keys,$private.'/journal.enc',true);$staff->migrate();
$policy=new PK\Registration\Policy(json_decode(file_get_contents(__DIR__.'/../registration/policy.v1.json'),true));$intake=new PK\Registration\Intake($db,$keys,$policy,fn()=>null,true);$intake->migrate();
$config=['enabled'=>false,'maintenance'=>true,'databaseContractAccepted'=>false,'origin'=>'https://pkhockeyacademy.de','path'=>'/intern/anmeldungen','dsn'=>'sqlite:'.$private.'/database.sqlite','username'=>null,'password'=>null,'journal'=>$private.'/journal.enc','backupDirectory'=>$private.'/backups','keys'=>array_map(fn($key)=>base64_encode($key),$keys)];
file_put_contents($private.'/staff.json',json_encode($config));
$intakeConfig=array_fill_keys(['enabled','policyAccepted','staffAccepted','realDataApproved','runtimePrivilegesAccepted','requestTimeoutsAccepted'],false);$intakeConfig['maintenance']=true;file_put_contents($private.'/intake.json',json_encode($intakeConfig));
$runtime=['version'=>1,'enabled'=>false,'staffLibrary'=>$private,'staffConfig'=>$private.'/staff.json','intakeConfig'=>$private.'/intake.json'];file_put_contents($private.'/runtime.json',json_encode($runtime));file_put_contents($private.'/Requests.php','<?php');
copy(__DIR__.'/../staff/Staff.php',$private.'/Staff.php');copy(__DIR__.'/../staff/Config.php',$private.'/Config.php');
file_put_contents($public.'/.pk-registration-location.json',json_encode(['publicRoot'=>$public,'runtimeFile'=>$private.'/Requests.php']));
