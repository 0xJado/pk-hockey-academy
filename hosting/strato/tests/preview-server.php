<?php
declare(strict_types=1);
// Local synthetic integration server ONLY. Never copied by the candidate builder.
require __DIR__ . '/../preview/Preview.php';
ini_set('display_errors','0');
$root = realpath((string) getenv('PK_PREVIEW_FIXTURE_ROOT'));
$path = parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH);
if (!$root || PHP_SAPI !== 'cli-server') {http_response_code(503);exit;}
if ($path==='/__fixture/install' && getenv('PK_PREVIEW_FIXTURE_INSTALLER')) {require (string)getenv('PK_PREVIEW_FIXTURE_INSTALLER');exit;}
if (str_starts_with((string) $path,'/_astro/')) {
    $file = realpath($root . $path);
    if (!$file || !str_starts_with(str_replace('\\','/',$file),str_replace('\\','/',$root).'/_astro/')) {http_response_code(404);exit;}
    $extension = pathinfo($file,PATHINFO_EXTENSION);
    $types=['js'=>'text/javascript','css'=>'text/css','woff2'=>'font/woff2','svg'=>'image/svg+xml','png'=>'image/png','webp'=>'image/webp'];
    if (!isset($types[$extension])) {http_response_code(403);exit;}
    header('Content-Type: '.$types[$extension]);readfile($file);exit;
}
if ($path === '/trainerpool') {header('Content-Type: text/html');echo '<h1>Öffentliche Testseite</h1>';exit;}
$config=PK\Preview\validateConfig(['projectId'=>'cmsqa123','dataset'=>'qa','readToken'=>'ISOLATED_SERVER_TOKEN','sessionKey'=>str_repeat('fixture-key-',5),'studioUrl'=>'https://example.sanity.studio/','siteOrigin'=>'https://pkhockeyacademy.de']);
$state=json_decode(file_get_contents((string)getenv('PK_PREVIEW_FIXTURE_STATE')),true,8,JSON_THROW_ON_ERROR);
$now=time()+($state['clockOffset']??0);
$transport=static function($groq,$params,$perspective) use ($config,$state,$now) {
    if ($perspective==='raw')return ['private'=>['_id'=>'drafts.fixture-secret','_updatedAt'=>gmdate('c',$now),'secret'=>'ISOLATED_PREVIEW_SECRET','studioUrl'=>$config['studioUrl']]];
    if ($state['failed']??false)throw new RuntimeException('Synthetic unavailable source');
    $image=['alt'=>'Technische Testgrafik ohne reale Person','credit'=>'Testgrafik','asset'=>['url'=>'https://cdn.sanity.io/images/cmsqa123/qa/abc-800x1000.webp','mimeType'=>'image/webp','size'=>1024,'metadata'=>['dimensions'=>['width'=>800,'height'=>1000]]]];
    $profile=['_id'=>'fixture-preview','_type'=>'trainer','name'=>'Technisches Testprofil','role'=>$perspective==='published'?'Veröffentlichte Testrolle':($state['role']??'Entwurfsrolle'),'biography'=>"Technischer Entwurf; keine reale Person.\n\n<img src=x onerror=window.__draftXss=true>",'verifiedBackground'=>['Isolierter Testdatensatz'],'qualifications'=>[],'specialties'=>['Testschwerpunkt'],'displayOrder'=>0,'active'=>false,'visibility'=>'hidden','contentApproved'=>false,'playingYears'=>12,'coachingYears'=>0,'highestDivision'=>'Technische Testliga','notableTeams'=>['Technische Teststation'],'playerGallery'=>[$image+['caption'=>'Technische Laufbahngrafik']]];
    if (!($state['noPortrait']??false))$profile['portrait']=$image;
    if (($params['id']??null)==='missing')return [];
    return ($params['id']??null)?[$profile]:[$profile,['_id'=>'drafts.incomplete-preview','_type'=>'trainer']];
};
try {
    $request=PK\Preview\httpRequest();
    // Only this non-deployable loopback fixture maps its HTTP browser origin to
    // the fixed HTTPS production origin used by the real request boundary.
    foreach ($request['headers'] as $name=>$value)if(strtolower($name)==='origin' && $value==='http://'.($_SERVER['HTTP_HOST']??''))$request['headers'][$name]=$config['siteOrigin'];
    PK\Preview\emit(PK\Preview\dispatch($config,$request,$transport,$now),$root.'/preview/preview-lib');
}catch (InvalidArgumentException){PK\Preview\emit(PK\Preview\response(400,['code'=>'invalid_request'],$config),$root.'/preview/preview-lib');}
catch (Throwable){PK\Preview\emit(PK\Preview\response(503,['code'=>'preview_unavailable'],$config),$root.'/preview/preview-lib');}
