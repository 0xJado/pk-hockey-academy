<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
foreach(['Staff','Maintenance']as$name)require __DIR__.'/../staff/'.$name.'.php';
foreach(['Policy','Intake']as$name)require __DIR__.'/../registration/'.$name.'.php';
use PK\Staff\{Staff,Maintenance};use PK\Registration\{Policy,Intake};
$checks=0;function check(bool$v,string$label):void{global$checks;if(!$v)throw new RuntimeException($label);++$checks;}
$directory=sys_get_temp_dir().'/pk-maintenance-'.bin2hex(random_bytes(12));mkdir($directory,0700);mkdir($directory.'/backups',0700);
$keys=array_combine(['data','auth','audit','backup'],array_map(fn()=>random_bytes(32),range(1,4)));$db=new PDO('sqlite::memory:');
$staff=new Staff($db,$keys,$directory.'/journal.enc',true);$staff->migrate();
$policy=new Policy(json_decode(file_get_contents(__DIR__.'/../registration/policy.v1.json'),true));$intake=new Intake($db,$keys,$policy,fn()=>null,true);$intake->migrate();
$config=['journal'=>$directory.'/journal.enc','backupDirectory'=>$directory.'/backups','keys'=>array_map('base64_encode',$keys)];$now=time();
try{
 $staff->insertFixture(['childName'=>'FIKTIVES WARTUNGSKIND'],[],[],$now);
 $old=$directory.'/backups/pk-staff-20200101-000000-'.str_repeat('a',16).'.enc';file_put_contents($old,'expired-fictional-file');touch($old,$now-36*86400);
 $unowned=$directory.'/backups/unrelated.txt';file_put_contents($unowned,'not managed');touch($unowned,$now-36*86400);
 $first=Maintenance::run($staff,$intake,$config,$now);check($first['dailyBackupCreated']&&$first['expiredBackupsRemoved']===1,'daily encrypted backup and owned expiry');
 check(!file_exists($old)&&file_exists($unowned),'cleanup preserves unrelated files');
 $files=glob($directory.'/backups/pk-staff-*.enc');check(count($files)===1&&!str_contains(file_get_contents($files[0]),'FIKTIVES'),'backup has no plaintext participant data');
 $hash=hash_file('sha256',$files[0]);$second=Maintenance::run($staff,$intake,$config,$now);
 check(!$second['dailyBackupCreated']&&$second['existingDailyBackupVerified']&&hash_file('sha256',$files[0])===$hash,'same-day retry verifies rather than duplicates backup');
 $bytes=base64_decode(file_get_contents($files[0]));$plain=sodium_crypto_secretbox_open(substr($bytes,24),substr($bytes,0,24),$keys['backup']);$snapshot=json_decode($plain,true);
 check(count($snapshot['requests'])===1&&!isset($snapshot['users'],$snapshot['sessions']),'snapshot contains request records only');
 check(!str_contains(json_encode($first),'FIKTIVES')&&!str_contains(json_encode($first),$directory),'status exposes counts only');
 file_put_contents($files[0],'tampered');$failed=false;try{Maintenance::run($staff,$intake,$config,$now);}catch(Throwable){$failed=true;}check($failed&&file_get_contents($files[0])==='tampered','tampered backup fails visibly without overwrite');
 unlink($files[0]);unlink($directory.'/journal.enc');$failed=false;try{Maintenance::run($staff,$intake,$config,$now);}catch(Throwable){$failed=true;}check($failed,'missing independent journal blocks operation');
 echo json_encode(['passed'=>true,'checks'=>$checks,'fictionalDataOnly'=>true],JSON_THROW_ON_ERROR)."\n";
}finally{foreach(glob($directory.'/backups/*')as$file)unlink($file);rmdir($directory.'/backups');foreach(glob($directory.'/*')as$file)unlink($file);rmdir($directory);}
