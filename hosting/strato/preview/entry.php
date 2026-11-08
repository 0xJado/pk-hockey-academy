<?php
declare(strict_types=1);
$library=__DIR__ . '/preview-lib';
ini_set('display_errors','0');
try {
    require $library . '/Preview.php';
    if(getenv('PK_PREVIEW_PUBLIC_ROOT') && getenv('PK_PREVIEW_CONFIG_FILE'))
        [$root,$configurationFile]=[realpath((string)getenv('PK_PREVIEW_PUBLIC_ROOT')),(string)getenv('PK_PREVIEW_CONFIG_FILE')];
    else [$root,$configurationFile]=PK\Preview\locateConfig(__DIR__);
    $entry=realpath(__DIR__);
    if (!$root || !$entry || !str_starts_with(str_replace('\\','/',$entry).'/',rtrim(str_replace('\\','/',$root),'/').'/')) throw new RuntimeException('Invalid public root');
    $config=PK\Preview\loadConfig($root,$configurationFile);
    try {$request=PK\Preview\httpRequest();}
    catch (InvalidArgumentException) {PK\Preview\emit(PK\Preview\response(400,['code'=>'invalid_request'],$config),$library);exit;}
    PK\Preview\emit(PK\Preview\dispatch($config,$request),$library);
} catch (Throwable) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, no-store, max-age=0');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Referrer-Policy: no-referrer');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('X-Content-Type-Options: nosniff');
    echo '{"code":"preview_unavailable"}';
}
