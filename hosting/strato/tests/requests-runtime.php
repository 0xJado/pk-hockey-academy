<?php
declare(strict_types=1);
// Real PHP entry execution; no DB credentials, network or personal data.
require __DIR__.'/../runtime/Requests.php';
$root=dirname(__DIR__,3).'/output/requests-runtime-'.bin2hex(random_bytes(6));
mkdir($root,0700,true);mkdir($root.'/public/api',0700,true);mkdir($root.'/private',0700,true);
copy(__DIR__.'/../public/api/requests.php',$root.'/public/api/requests.php');
copy(__DIR__.'/../runtime/Requests.php',$root.'/private/Requests.php');
$public=realpath($root.'/public');$runtime=realpath($root.'/private/Requests.php');
$locator=$public.'/.pk-registration-location.json';$descriptor=$root.'/private/runtime.json';
$checks=0;
function check(bool $value,string $message):void{global $checks;if(!$value)throw new RuntimeException($message);$checks++;}
function executeEntry(string $route='/api/registration'):array{
 global $root,$public;
 $child=$root.'/child.php';
 file_put_contents($child,'<?php $_SERVER["REQUEST_METHOD"]="POST";$_SERVER["REQUEST_URI"]='.var_export($route,true).';ob_start();include '.var_export($public.'/api/requests.php',true).';$body=ob_get_clean();echo json_encode([http_response_code(),$body]);');
 $process=proc_open([PHP_BINARY,'-n',$child],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
 $result=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
 if(proc_close($process)!==0||$error!=='')throw new RuntimeException('Entry failed unsafely');return json_decode($result,true,8,JSON_THROW_ON_ERROR);
}
$location=['publicRoot'=>$public,'runtimeFile'=>$runtime];
foreach(['/api/registration','/api/registration/token','/intern/anmeldungen']as$route){[$status,$body]=executeEntry($route);check($status===503&&str_contains($body,'inactive'),'Missing locator fails closed');}
file_put_contents($locator,json_encode($location));
[$status,$body]=executeEntry();check($status===503&&!str_contains($body,$root),'Missing descriptor hides private paths');
foreach([[],['version'=>1,'enabled'=>false],['version'=>1,'enabled'=>'true'],['version'=>2,'enabled'=>true],['version'=>1,'enabled'=>true,'intakeLibrary'=>$public]]as$config){
 file_put_contents($descriptor,json_encode($config));[$status,$body]=executeEntry();check($status===503&&str_contains($body,'inactive'),'Unaccepted descriptor cannot reach intake');
}
file_put_contents($descriptor,json_encode(['version'=>1,'enabled'=>true]));
[$status]=executeEntry('/api/requests.php');check($status===404,'Direct entry alias is not an intake route');
file_put_contents($locator,json_encode(['publicRoot'=>$public,'runtimeFile'=>$public.'/api/requests.php']));
[$status]=executeEntry();check($status===503,'Public source cannot become a private runtime');
file_put_contents($locator,str_repeat('x',4097));[$status]=executeEntry();check($status===503,'Oversized locator rejected');
file_put_contents($locator,'{"publicRoot":"wrong"}');[$status]=executeEntry();check($status===503,'Locator root must match its directory');
echo "$checks private request-runtime checks passed.\n";
// The actual installer is repeatable only while identical/disabled; it cannot
// overwrite an activated descriptor or insert an arbitrary source filename.
unlink($locator);
$scope=['public'=>$public,'private'=>realpath($root.'/private'),'hash'=>str_repeat('a',24)];
mkdir($root.'/private/registration',0700);
$sources=[];
foreach(['runtime/Requests.php','staff/Staff.php','staff/Config.php','staff/Http.php','registration/Policy.php','registration/Intake.php','registration/Config.php','registration/Http.php','registration/Sessions.php','registration/policy.v1.json']as$file)$sources[preg_replace('#^runtime/#','',$file)]=base64_encode(file_get_contents(__DIR__.'/../'.$file));
$scope['hash']=substr(hash('sha256',json_encode($sources)),0,24);
$config=json_decode(file_get_contents(__DIR__.'/../registration/config.example.json'),true);
function installer(array $sources):array{
 global $root,$scope,$config;
 $template=file_get_contents(__DIR__.'/../runtime/install.php.template');
 foreach(['TOKEN_HASH'=>hash('sha256','fictional-installer-token'),'SCOPE'=>base64_encode(json_encode($scope)),'SOURCES'=>base64_encode(json_encode($sources)),'CONFIG'=>base64_encode(json_encode($config))]as$key=>$value)$template=str_replace('__'.$key.'__',$value,$template);
 $file=$root.'/installer.php';file_put_contents($file,$template);
 $child=$root.'/install-child.php';file_put_contents($child,'<?php $_SERVER["REQUEST_METHOD"]="POST";$_SERVER["HTTP_X_PK_SETUP_TOKEN"]="fictional-installer-token";include '.var_export($file,true).';');
 $process=proc_open([PHP_BINARY,'-n',$child],[1=>['pipe','w'],2=>['pipe','w']],$pipes);$body=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
 if(proc_close($process)!==0||$error!=='')throw new RuntimeException('Installer failed unsafely');return json_decode($body,true,8,JSON_THROW_ON_ERROR);
}
check((installer($sources)['installed']??false)===true,'Disabled private runtime installs');
check((installer($sources)['runtimeEnabled']??null)===false,'Identical repeat remains disabled');
$installed=$root.'/private/registration/runtime-'.$scope['hash'];
$descriptor=json_decode(file_get_contents($installed.'/runtime.json'),true);$descriptor['enabled']=true;
file_put_contents($installed.'/runtime.json',json_encode($descriptor));
check((installer($sources)['code']??'')==='runtime-install-refused','Installer refuses to overwrite an activated descriptor');
check(json_decode(file_get_contents($installed.'/runtime.json'),true)['enabled']===true,'Existing activation state preserved');
check((installer(['../outside.php'=>base64_encode('<?php')])['code']??'')==='runtime-install-refused'&&!file_exists($root.'/private/registration/outside.php'),'Unknown source paths rejected');
echo "$checks total request-runtime and installer checks passed.\n";
// Fixture contains no secrets; retain only reproducible local evidence.
