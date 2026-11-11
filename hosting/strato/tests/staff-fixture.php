<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require __DIR__.'/../staff/Staff.php';
$root=realpath(getenv('PK_STAFF_FIXTURE_ROOT')?:'');
$output=realpath(__DIR__.'/../../../output');
if (!$root||!$output||!str_starts_with(str_replace('\\','/',$root).'/',str_replace('\\','/',$output).'/staff-tests/')) exit(1);
$db=new PDO('sqlite:'.$root.'/staff.sqlite');
if (in_array($argv[1]??'', ['revoke','parallel-setup','parallel-worker','parallel-check'], true)) {
    $config=json_decode(file_get_contents($root.'/config.json'),true,32,JSON_THROW_ON_ERROR);
    $keys=array_map(fn($v)=>base64_decode($v,true),$config['keys']);
    $app=new \PK\Staff\Staff($db,$keys,$root.'/erasure.enc',true);
    if($argv[1]==='revoke')$app->revoke('fixture-owner',time());
    elseif($argv[1]==='parallel-setup'){
      $id=$app->insertFixture(['childName'=>'PARALLEL SYNTHETIC FIXTURE'],[],[],time());
      $epoch=(int)$db->query("SELECT epoch FROM pk_staff_users WHERE id='fixture-owner'")->fetchColumn();
      $token=$app->newSession(time(),'fixture-owner',$epoch);
      file_put_contents($root.'/parallel.json',json_encode(['id'=>$id,'token'=>$token],JSON_THROW_ON_ERROR));
    }else{
      $fixture=json_decode(file_get_contents($root.'/parallel.json'),true,16,JSON_THROW_ON_ERROR);
      if($argv[1]==='parallel-worker'){
        try{$app->change($fixture['token'],$app->csrf($fixture['token']),$fixture['id'],1,'confirmed',['confirmedOutside'=>'yes'],time());echo 'accepted';}catch(Throwable){echo 'rejected';}
      }else{
        $row=$app->detail($fixture['token'],$fixture['id'],time());
        $ref=hash_hmac('sha256','record:'.$fixture['id'],$keys['audit']);$q=$db->prepare("SELECT COUNT(*) FROM pk_staff_audit WHERE action='confirmed' AND record_ref=?");$q->execute([$ref]);
        if($row['version']!==2||$row['status']!=='confirmed'||(int)$q->fetchColumn()!==1)exit(1);
        echo 'exactly-one';
      }
    }exit;
}
if (is_file($root.'/config.json')) exit(1);
$keys=array_combine(['data','auth','audit','backup'],array_map(fn()=>random_bytes(32),range(1,4)));
$app=new \PK\Staff\Staff($db,$keys,$root.'/erasure.enc',true);$app->migrate();$app->setAdmin('fixture-owner','SYNTHETIC-staff-password-only');
$id=$app->insertFixture(['childName'=>'FIKTIVES TESTKIND <script>alert(1)</script>','birthYear'=>2017,'guardianName'=>'Fiktiver Testkontakt','guardianEmail'=>'fixture@example.invalid','guardianPhone'=>'000000','bookingType'=>'single'],['healthNotes'=>'FIKTIVE GESUNDHEITSANGABE – NUR TEST'],['health'=>['version'=>'fixture-v1','grantedAt'=>time()]],time());
$config=['enabled'=>true,'origin'=>getenv('PK_STAFF_FIXTURE_ORIGIN'),'path'=>'/intern/anmeldungen','dsn'=>'sqlite:'.$root.'/staff.sqlite','journal'=>$root.'/erasure.enc','backupDirectory'=>$root,'keys'=>array_map('base64_encode',$keys)];
file_put_contents($root.'/config.json',json_encode($config,JSON_THROW_ON_ERROR));chmod($root.'/config.json',0600);
file_put_contents($root.'/fixture.json',json_encode(['id'=>$id],JSON_THROW_ON_ERROR));
echo "Synthetic staff fixture ready.\n";
