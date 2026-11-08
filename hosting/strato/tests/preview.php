<?php
declare(strict_types=1);
require __DIR__ . '/../preview/Preview.php';
use function PK\Preview\{handle,signSession,verifySession,safeRedirect,validateConfig,loadConfig,locateConfig};
use const PK\Preview\COOKIE;

$count = 0;
function check(bool $value, string $label): void {
    global $count;
    if (!$value) throw new RuntimeException('Failed: ' . $label);
    $count++;
}
$now = 1805000000;
$config = validateConfig(['projectId'=>'cmsqa123','dataset'=>'qa','readToken'=>'server-only-test-token','sessionKey'=>str_repeat('x',48),'studioUrl'=>'https://example.sanity.studio/','siteOrigin'=>'https://pkhockeyacademy.de']);
$session = signSession($config['sessionKey'],$now);
check(verifySession($session,$config['sessionKey'],$now),'valid session');
foreach ([$now+3600,$now-1,$now+4000] as $time) check(!verifySession($session,$config['sessionKey'],$time),'bounded expiry');
check(!verifySession($session.'0',$config['sessionKey'],$now),'tampered cookie');
check(!verifySession($session,str_repeat('y',48),$now),'rotated key');
foreach (['https://evil.example','//evil.example/redaktion/trainerpool','/redaktion/trainerpool/extra','/redaktion/trainerpool%0d%0aX-Test:yes','/redaktion\\trainerpool'] as $url) check(safeRedirect($url)==='/redaktion/trainerpool','safe redirect');
check(safeRedirect('/redaktion/trainerpool?id=drafts.test&perspective=published&secret=hidden')==='/redaktion/trainerpool?id=test&perspective=published','selected profile redirect');
$request = ['method'=>'GET','path'=>'/redaktion/daten','headers'=>[],'query'=>[],'cookies'=>[]];
$calls = 0;
$transport = static function($query,$params,$perspective) use (&$calls,$now) {
    $calls++;
    if ($perspective==='raw') return ['private'=>['_id'=>'drafts.secret','_updatedAt'=>gmdate('c',$now),'secret'=>'valid-secret','studioUrl'=>'https://example.sanity.studio/']];
    if ($perspective==='drafts') return [['_id'=>'private-test','_type'=>'trainer','name'=>'ISOLATED_DRAFT_MARKER']];
    return [];
};
$run = static fn($req,$source=null,$time=null) => handle($config,$req,$source??$transport,$time??$now);
$result = $run($request);
check($result['status']===401 && $calls===0,'unauthenticated request never queries drafts');
check(!str_contains(json_encode($result),'server-only-test-token'),'token isolation');
$request['cookies'][COOKIE] = $session;
$result = $run($request);
check($result['status']===200 && $result['body']['documents'][0]['name']==='ISOLATED_DRAFT_MARKER','authenticated drafts');
check($result['headers']['Cache-Control']==='private, no-store, max-age=0','no cache');
check($result['headers']['Cross-Origin-Resource-Policy']==='same-origin','same-origin response');
check(!isset($result['headers']['Access-Control-Allow-Origin']),'no public CORS');
check(str_contains($result['headers']['Content-Security-Policy'],'https://example.sanity.studio'),'approved frame');
$request['query']=['perspective'=>'published','id'=>'drafts.selected'];
$result = $run($request,static function($groq,$params,$perspective) {check($params['id']==='selected'&&$perspective==='published','selected published query');return [];});
check($result['status']===200,'published perspective');
$request['query']=['id'=>['bad']];check($run($request)['status']===400,'invalid id');
$request['query']=[];$request['headers']=['Origin'=>'https://evil.example'];check($run($request)['status']===403,'foreign origin');
$request['headers']=['Origin'=>'https://example.sanity.studio'];check($run($request)['status']===403,'Studio cannot directly fetch private JSON');
$request['headers']=['Sec-Fetch-Site'=>'cross-site'];check($run($request)['status']===403,'cross-site metadata');
$request['headers']=[];check($run($request,null,$now+3600)['status']===401,'expired HTTP session');
check($run($request,static function(){throw new RuntimeException('DO_NOT_LOG');})['status']===503,'source fails closed');
$enable = ['method'=>'POST','path'=>'/api/preview/enable','headers'=>['Origin'=>$config['siteOrigin']],'body'=>['sanity-preview-secret'=>'valid-secret','sanity-preview-pathname'=>'/redaktion/trainerpool?id=selected'],'query'=>[]];
$result = $run($enable);
check($result['status']===200&&$result['body']['redirectTo']==='/redaktion/trainerpool?id=selected','secret activation');
foreach (['HttpOnly','Secure','SameSite=None','Partitioned','Path=/redaktion','Max-Age=3600'] as $attribute) check(str_contains($result['headers']['Set-Cookie'],$attribute),'cookie '.$attribute);
check(!str_contains(json_encode($result),'valid-secret'),'link secret absent from response');
$enable['body']['sanity-preview-secret']='wrong';check($run($enable)['status']===401,'invalid secret');
$enable['body']['sanity-preview-secret']='valid-secret';
check($run($enable,static fn()=>['private'=>['_id'=>'expired','_updatedAt'=>gmdate('c',$now-3601),'secret'=>'valid-secret','studioUrl'=>$config['studioUrl']]])['status']===401,'expired native link');
check($run($enable,static fn()=>['public'=>['secret'=>'valid-secret','studioUrl'=>'https://evil.example']])['status']===401,'secret from foreign Studio');
$enable['query']['sanity-preview-secret']='valid-secret';check($run($enable)['status']===400,'URL secrets rejected');
$enable['query']=[];$enable['method']='GET';check($run($enable)['status']===405,'GET cannot activate');
$signout = $run(['method'=>'GET','path'=>'/redaktion/abmelden']);
check($signout['status']===303&&str_contains($signout['headers']['Set-Cookie'],'Max-Age=0'),'signout clears matching cookie');
check($run(['method'=>'GET','path'=>'/redaktion/unknown'])['status']===404,'unknown routes');
$temporary=sys_get_temp_dir().'/pk-preview-test-'.bin2hex(random_bytes(8));
mkdir($temporary);mkdir($temporary.'/public');mkdir($temporary.'/private');
try {
    $file=$temporary.'/private/config.json';file_put_contents($file,json_encode($config));
    check(loadConfig($temporary.'/public',$file)['projectId']==='cmsqa123','outside-root private config');
    file_put_contents($temporary.'/public/config.json',json_encode($config));
    try {loadConfig($temporary.'/public',$temporary.'/public/config.json');check(false,'public config rejected');}
    catch(RuntimeException){check(true,'public config rejected');}
    file_put_contents($temporary.'/public/.pk-preview-location.json',json_encode(['publicRoot'=>realpath($temporary.'/public'),'configFile'=>$file]));
    check(locateConfig($temporary.'/public')[1]===$file,'trusted server-side locator');
    file_put_contents($temporary.'/public/.pk-preview-location.json',json_encode(['publicRoot'=>$temporary.'/private','configFile'=>$file]));
    try {locateConfig($temporary.'/public');check(false,'wrong locator root');}catch(RuntimeException){check(true,'wrong locator root rejected');}
}finally{
    foreach(['/private/config.json','/public/config.json','/public/.pk-preview-location.json'] as $file)if(is_file($temporary.$file))unlink($temporary.$file);
    rmdir($temporary.'/private');rmdir($temporary.'/public');rmdir($temporary);
}
echo "PHP preview security: $count assertions passed.\n";
