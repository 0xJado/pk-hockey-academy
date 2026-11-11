<?php
declare(strict_types=1);
foreach (['Policy','Intake','Sessions','Http','Config'] as $name) require __DIR__.'/../registration/'.$name.'.php';
require __DIR__.'/../staff/Staff.php';
use PK\Registration\{Policy,Intake,Http,Failure,Sessions,Config};
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
$checks=0;
function check(bool $valid, string $label): void { global $checks; if (!$valid) throw new RuntimeException($label); ++$checks; }
function denied(callable $work, string $label, ?string $code=null): void { try { $work(); } catch (Throwable $e) { check($code===null || ($e instanceof Failure && $e->reason===$code),$label); return; } throw new RuntimeException($label); }
function fixture(): array { return ['policyVersion'=>Policy::VERSION,'childName'=>'FIKTIVES TESTKIND 🏒','birthYear'=>'2017','guardianName'=>'FIKTIVER ELTERNTEIL','guardianPhone'=>'+49 000 000000','guardianEmail'=>'fixture@example.invalid','bookingType'=>'five','guardianAuthority'=>true,'consents'=>(object)['health'=>true,'website'=>true],'healthNotes'=>'FIKTIVER HINWEIS – KEINE ECHTEN DATEN']; }
final class FaultPDO extends PDO {
    public bool $afterCommit=false;
    public bool $beforeCommit=false;
    public function commit(): bool { if ($this->beforeCommit) { $this->beforeCommit=false; throw new RuntimeException('Injected pre-commit disconnect'); } $ok=parent::commit(); if ($this->afterCommit) { $this->afterCommit=false; throw new RuntimeException('Injected response loss after durable commit'); } return $ok; }
}
$directory=sys_get_temp_dir().'/pk-intake-'.bin2hex(random_bytes(12)); mkdir($directory,0700); mkdir($directory.'/public',0700);
$keys=array_combine(['data','auth','audit','backup'],array_map(fn()=>random_bytes(32),range(1,4)));
$policy=new Policy(json_decode(file_get_contents(__DIR__.'/../registration/policy.v1.json'),true,16,JSON_THROW_ON_ERROR));
$db=new FaultPDO('sqlite:'.$directory.'/fixture.sqlite'); $db->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
$staff=new \PK\Staff\Staff($db,$keys,$directory.'/journal.enc',true); $staff->migrate();
$sessionCalls=0; $source=function($id,$now) use (&$sessionCalls) { ++$sessionCalls; return $id==='published-fixture'?['id'=>$id,'requestable'=>true]:null; };
$intake=new Intake($db,$keys,$policy,$source,true); $intake->migrate(); $now=strtotime('2026-11-11T12:00:00Z');
$peer='192.0.2.1';
$server=['REQUEST_METHOD'=>'POST','HTTPS'=>'on','HTTP_ORIGIN'=>'https://pkhockeyacademy.de','REQUEST_URI'=>'/api/registration','CONTENT_TYPE'=>'application/json','REMOTE_ADDR'=>$peer];
$send=function(array $input,string $ticket,array $extra=[]) use($server,$intake,$now) { $body=json_encode($input,JSON_THROW_ON_ERROR); return Http::handle(array_replace($server,['CONTENT_LENGTH'=>(string)strlen($body),'HTTP_IDEMPOTENCY_KEY'=>$ticket],$extra),true,fn()=>$intake,fn()=>$body,$now); };
try {
    denied(fn()=>new Intake($db,$keys,$policy,$source),'production refuses SQLite');
    denied(fn()=>new Intake($db,$keys,$policy,$source,true,'arbitrary_'),'arbitrary table scopes refused');
    denied(fn()=>Policy::json('{"consents":{"health":true,"health":false}}'),'duplicate nested keys refused','body');
    denied(fn()=>Policy::json('{"childName":"one","child\\u004eame":"two"}'),'escaped duplicate keys refused','body');
    foreach (['[]','null','"text"','{"bad":"\xFF"}','{'] as $raw) denied(fn()=>Policy::json($raw),'malformed/object-only JSON','body');
    denied(fn()=>$intake->ticket($now),'migration defaults paused','inactive'); $intake->pause(false);
    $reads=0; $read=function() use(&$reads) { ++$reads; return '{}'; }; $noService=function() { throw new RuntimeException('DB must not be opened'); };
    check(Http::handle([],false,$noService,$read,$now)['body']['code']==='inactive' && $reads===0,'disabled path never reads body/opens DB');
    $base=$server+['CONTENT_LENGTH'=>'2'];
    foreach ([['REQUEST_METHOD'=>'GET'],['HTTP_ORIGIN'=>'null'],['HTTP_ORIGIN'=>'https://attacker.invalid'],['HTTPS'=>'off'],['REQUEST_URI'=>'/api/registration?childName=secret'],['CONTENT_TYPE'=>'text/plain'],['CONTENT_LENGTH'=>'16385'],['CONTENT_LENGTH'=>'-1'],['HTTP_CONTENT_ENCODING'=>'gzip']] as $invalid) {
        $r=Http::handle(array_replace($base,$invalid),true,$noService,$read,$now); check($r['status']>=400 && $r['status']!==503 && $reads===0,'invalid envelope rejected before body/DB');
    }
    $r=Http::handle($base,true,fn()=>$intake,fn()=>'{}extra',$now); check($r['status']===400,'body length mismatch');
    $r=Http::handle($base,true,fn()=>$intake,static function() { usleep(3_010_000); return '{}'; },$now); check($r['status']===408,'late body read never reaches storage');
    $r=Http::handle($base,true,fn()=>$intake,fn()=>'{}',$now); check($r['body']['code']==='ticket-expired','unsigned ticket refused');
    $tokenResponse=Http::handle(array_replace($base,['REQUEST_URI'=>'/api/registration/token']),true,fn()=>$intake,fn()=>'{}',$now);
    check($tokenResponse['status']===200 && !isset($tokenResponse['headers']['Access-Control-Allow-Origin']),'token issued without cross-origin permission');
    $ticket=$tokenResponse['body']['token'];
    $r=$send(fixture(),$ticket); check($r['status']===201 && $r['body']['code']==='received','valid request durably received');
    check(!str_contains(json_encode($r),'FIKTIV') && !str_contains(json_encode($r),'example.invalid'),'response has no participant fields');
    check($db->query('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn()===1,'one private record');
    $replay=$send(fixture(),$ticket); check($replay['status']===200 && $replay['body']['reference']===$r['body']['reference'],'retry uses stable receipt');
    $changed=fixture(); $changed['childName']='OTHER FIKTIVES KIND'; check($send($changed,$ticket)['status']===409,'changed payload conflicts');
    $intake2=new Intake(new PDO('sqlite:'.$directory.'/fixture.sqlite'),$keys,$policy,$source,true);
    check($intake2->submit($ticket,fixture(),$peer,$now)['replayed']===true,'idempotency survives fresh process connection');
    $stored=$db->query('SELECT * FROM pk_staff_requests')->fetch();
    foreach (['org','care','proofs'] as $category) check(!str_contains($stored[$category],'FIKTIV') && !str_contains($stored[$category],'example.invalid'),'payload encrypted '.$category);
    $staff->setAdmin('fixture-admin','SYNTHETIC-ADMIN-SECRET'); $pre=$staff->newSession($now); $login=$staff->login($pre,$staff->csrf($pre),'fixture-admin','SYNTHETIC-ADMIN-SECRET',$peer,$now);
    $detail=$staff->detail($login,$stored['id'],$now);
    check($detail['org']['childName']===fixture()['childName'] && $detail['care']['healthNotes']===fixture()['healthNotes'],'staff reads intake encryption contract');
    check(isset($detail['proofs']['health'],$detail['proofs']['website']) && !isset($detail['proofs']['print'],$detail['proofs']['analysis']),'only affirmative grants create proof');
    check($detail['proofs']['health']['version']===Policy::VERSION && strlen($detail['proofs']['health']['textSha256'])===64,'consent exact version/hash');
    $invalids=[['guardianAuthority'=>false],['birthYear'=>'2030'],['birthYear'=>'2017-01-01'],['bookingType'=>'free'],['guardianEmail'=>'not-email'],['guardianPhone'=>'abc'],['childName'=>str_repeat('x',121)],['childName'=>['nested']],['childName'=>"bad\0name"],['childName'=>"line\nbreak"],['emergencyName'=>'FIKTIV'],['sessionId'=>'ignored-id'],['consents'=>(object)['health'=>false]],['consents'=>(object)['health'=>null]],['consents'=>(object)['social'=>true]],['consents'=>[]],['price'=>1]];
    foreach ($invalids as $bad) { $r=$send(array_replace(fixture(),$bad),$intake->ticket($now)); check($r['status']===422,'invalid selected policy rejected'); }
    check($send(array_replace(fixture(),['policyVersion'=>'old']),$intake->ticket($now))['status']===409,'old policy rejected');
    $single=array_replace(fixture(),['bookingType'=>'single','sessionId'=>'published-fixture','guardianEmail'=>'single@example.invalid']);
    $singleTicket=$intake->ticket($now); check($send($single,$singleTicket)['status']===201 && $sessionCalls===1,'new single checks server source');
    check($send($single,$singleTicket)['status']===200 && $sessionCalls===1,'committed retry does not depend on later source availability');
    foreach (['','drafts.published-fixture','missing','versions.fixture'] as $id) check($send(array_replace($single,['sessionId'=>$id]),$intake->ticket($now))['status']===422,'invalid single source refused');
    $badSource=new Intake($db,$keys,$policy,static function() { throw new Failure(503,'sessions-unavailable'); },true);
    denied(fn()=>$badSource->submit($intake->ticket($now),$single,$peer,$now),'source outage is safe','sessions-unavailable');
    $baseSession=['_id'=>'fixture-session','visibility'=>'public','contentApproved'=>true,'isDemo'=>false,'title'=>'FIKTIV','group'=>'FIKTIV','startAt'=>'2026-11-20T10:00:00+01:00','endAt'=>'2026-11-20T12:00:00+01:00','status'=>'open','availableSpots'=>null,
        'venue'=>['_id'=>'fixture-venue','visibility'=>'public','contentApproved'=>true,'status'=>'active_city','city'=>'FIKTIV','details'=>'FIKTIV']];
    check(Sessions::requestable($baseSession,'fixture-session',$now),'published future source allowed');
    denied(fn()=>(new Sessions(['enabled'=>false]))->lookup('fixture-session',$now),'disabled training source cannot be bypassed','sessions-unavailable');
    foreach ([['status'=>'full'],['status'=>'cancelled'],['isDemo'=>true],['contentApproved'=>false],['_id'=>'drafts.fixture-session'],['availableSpots'=>0],['availableSpots'=>-1],['startAt'=>'2026-02-30T10:00:00Z'],['startAt'=>'2025-11-20T10:00:00Z'],['venue'=>array_replace($baseSession['venue'],['status'=>'planned_city'])]] as $bad) check(!Sessions::requestable(array_replace($baseSession,$bad),'fixture-session',$now),'unrequestable source denied');
    $faultTicket=$intake->ticket($now); $faultInput=array_replace(fixture(),['guardianEmail'=>'fault@example.invalid']);
    $db->exec("CREATE TRIGGER fixture_fail BEFORE INSERT ON pk_staff_requests BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
    $before=$db->query('SELECT COUNT(*) FROM pk_intake_claims')->fetchColumn();
    $r=$send($faultInput,$faultTicket); check($r['status']===503 && $r['body']['code']==='outcome-unknown','write failure never reports success');
    check($db->query('SELECT COUNT(*) FROM pk_intake_claims')->fetchColumn()===$before,'failed record write rolls back claim'); $db->exec('DROP TRIGGER fixture_fail');
    check($send($faultInput,$faultTicket)['status']===201,'same token can retry rolled-back write');
    $lostTicket=$intake->ticket($now); $lostInput=array_replace(fixture(),['guardianEmail'=>'lost@example.invalid']);
    // Call submit directly so the fault targets the record transaction, not attempt accounting.
    $db->afterCommit=true; denied(fn()=>$intake->submit($lostTicket,$lostInput,$peer,$now),'lost response after committed write');
    check($intake2->submit($lostTicket,$lostInput,$peer,$now)['replayed']===true,'fresh connection resolves lost commit without new write');
    $db->beforeCommit=true; $notCommitted=$intake->ticket($now); denied(fn()=>$intake->submit($notCommitted,array_replace(fixture(),['guardianEmail'=>'precommit@example.invalid']),$peer,$now),'disconnect before commit');
    check($intake2->submit($notCommitted,array_replace(fixture(),['guardianEmail'=>'precommit@example.invalid']),$peer,$now)['replayed']===false,'rolled-back unknown outcome accepted exactly once on same token');
    $backup=$staff->backup($now); $staff->change($login,$staff->csrf($login),$stored['id'],1,'health',[],$now+1);
    check(!isset($staff->detail($login,$stored['id'],$now+1)['care']['healthNotes']),'health withdrawal applies to intake record');
    check($intake->reconcile($replay['body']['reference'])==='received','operator reconciliation confirms stored receipt');
    $db->exec('DELETE FROM pk_staff_requests');
    check($intake->reconcile($replay['body']['reference'])==='reconciliation-required','missing record never becomes automatic retry');
    denied(fn()=>$intake->submit($ticket,fixture(),$peer,$now+2),'missing record receipt refuses recreation','reconciliation-required');
    $epoch=$db->query('SELECT epoch FROM pk_intake_meta')->fetchColumn(); $staff->restore($backup,$now+2);
    check((int)$db->query('SELECT paused FROM pk_intake_meta')->fetchColumn()===1 && $db->query('SELECT epoch FROM pk_intake_meta')->fetchColumn()!==$epoch,'restore pauses intake and invalidates admission epoch');
    check($db->query("SELECT COUNT(*) FROM pk_staff_requests WHERE status='reconciliation'")->fetchColumn()>0,'restored intake requests require human reconciliation');
    $restored=$db->query('SELECT care FROM pk_staff_requests WHERE id='.$db->quote($stored['id']))->fetchColumn();
    $n=$restored===null?null:base64_decode($restored); $key=hash_hmac('sha256','pk-staff:data:'.$stored['id'].':care',$keys['data'],true);
    check($n===null || !str_contains(sodium_crypto_secretbox_open(substr($n,24),substr($n,0,24),$key),'healthNotes'),'restore does not resurrect withdrawn health notes');
    $intake->pause(true); denied(fn()=>$intake->submit($ticket,fixture(),$peer,$now+2),'paused intake denies retries','inactive'); $intake->pause(false);
    denied(fn()=>$intake->submit($ticket,fixture(),$peer,$now+2),'epoch reset prevents old token resurrection','ticket-expired');
    denied(fn()=>$intake->submit($intake->ticket($now),fixture(),$peer,$now+86400),'expired token denied','ticket-expired');
    $ratePeer='192.0.2.250'; for($i=0;$i<30;$i++) $intake->attempt($ratePeer,$now,true);
    denied(fn()=>$intake2->attempt($ratePeer,$now,true),'rate accounting survives new connection','rate-limit');
    denied(fn()=>$intake->attempt('forged forwarded header',$now),'missing direct peer fails closed','source-unavailable');
    for($i=0;$i<5;$i++) $intake->submit($intake->ticket($now),array_replace(fixture(),['guardianEmail'=>'bounded-contact@example.invalid']),'192.0.2.'.(10+$i),$now);
    denied(fn()=>$intake2->submit($intake2->ticket($now),array_replace(fixture(),['guardianEmail'=>'BOUNDED-CONTACT@example.invalid']),'192.0.2.99',$now),'contact limits survive peer/case changes','rate-limit');
    $limits=$db->query('SELECT id FROM pk_intake_limits')->fetchAll(PDO::FETCH_COLUMN); check(!str_contains(json_encode($limits),'192.0.2.'),'no raw IP in limiter');
    $purged=$intake->retention($now+90001); check($purged['claims']>0 && $purged['limits']>0,'short-lived receipts/rate data purged');
    file_put_contents($directory.'/public/config.json','{}'); denied(fn()=>Config::load($directory.'/public/config.json',$directory.'/public'),'public config refused');
    file_put_contents($directory.'/config.json','{}'); denied(fn()=>Config::load($directory.'/config.json',$directory.'/public'),'missing activation gates refused','inactive');
    $configuration=json_decode(file_get_contents(__DIR__.'/../registration/config.example.json'),true);
    foreach (['enabled','policyAccepted','staffAccepted','realDataApproved','runtimePrivilegesAccepted','requestTimeoutsAccepted'] as $gate) $configuration[$gate]=true;
    $configuration['maintenance']=false;
    foreach (['enabled','policyAccepted','staffAccepted','realDataApproved','runtimePrivilegesAccepted','requestTimeoutsAccepted'] as $gate) {
        $blocked=$configuration; $blocked[$gate]=false; file_put_contents($directory.'/config.json',json_encode($blocked));
        denied(fn()=>Config::load($directory.'/config.json',$directory.'/public'),'each acceptance gate independently blocks intake','inactive');
    }
    file_put_contents($directory.'/database.json','{}');file_put_contents($directory.'/policy.json',json_encode($policy->document));
    $configuration['databaseConfig']=$directory.'/database.json';$configuration['policyFile']=$directory.'/policy.json';$configuration['policySha256']=hash_file('sha256',$configuration['policyFile']);
    file_put_contents($directory.'/config.json',json_encode($configuration));denied(fn()=>Config::load($directory.'/config.json',$directory.'/public'),'draft policy cannot activate even with all flags true','inactive');
    echo json_encode(['passed'=>true,'checks'=>$checks,'storage'=>'SQLite fictional fixtures','publicIntakeEnabled'=>false],JSON_THROW_ON_ERROR)."\n";
} finally {
    $db=null; $intake=null; $intake2=null; $staff=null;
    foreach (glob($directory.'/*') as $file) if (is_file($file)) @unlink($file);
    @unlink($directory.'/public/config.json'); @rmdir($directory.'/public'); @rmdir($directory);
}
