<?php
declare(strict_types=1);
// Candidate entry, intentionally excluded from the static artifact and public router.
ini_set('display_errors','0'); ini_set('log_errors','0');
try {
    $public = getenv('PK_PUBLIC_ROOT') ?: ''; $library = realpath(getenv('PK_INTAKE_LIBRARY') ?: ''); $root = realpath($public);
    $normalize = static fn($s)=>PHP_OS_FAMILY==='Windows'?strtolower(str_replace('\\','/',$s)):$s;
    if (!$library || !$root || str_starts_with($normalize($library).'/',rtrim($normalize($root),'/').'/')) throw new \RuntimeException();
    foreach (['Policy','Intake','Sessions','Config','Http'] as $name) require $library.'/'.$name.'.php';
    [$config,$intake] = \PK\Registration\Config::load(getenv('PK_INTAKE_CONFIG') ?: '',$public);
    \PK\Registration\Http::emit(\PK\Registration\Http::handle($_SERVER,true,fn()=>$intake,static fn($limit)=>file_get_contents('php://input',false,null,0,$limit)));
} catch (\Throwable) {
    http_response_code(503); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow'); header('X-Content-Type-Options: nosniff');
    echo '{"code":"inactive","message":"Die Onlineanmeldung ist noch nicht freigegeben. Es wurden keine Angaben angenommen."}';
}
