<?php
declare(strict_types=1);
// Stable public entry only. No credentials, library source or activation flag.
ini_set('display_errors','0'); ini_set('log_errors','0');
try {
    $directory = realpath(__DIR__); $location = null;
    for ($level=0; $directory && $level<6; $level++) {
        $file = $directory.'/.pk-registration-location.json';
        if (is_file($file)) {
            if (is_link($file)) throw new RuntimeException();
            $bytes = file_get_contents($file,false,null,0,4097);
            if ($bytes === false || strlen($bytes)>4096) throw new RuntimeException();
            $location = json_decode($bytes,true,8,JSON_THROW_ON_ERROR);
            if (($location['publicRoot'] ?? '') !== $directory) throw new RuntimeException();
            break;
        }
        $parent=dirname($directory); if ($parent===$directory) break; $directory=$parent;
    }
    if (!$location || !is_string($location['runtimeFile'] ?? null)) throw new RuntimeException();
    $runtime = realpath($location['runtimeFile']);
    $normalize = static fn($s)=>PHP_OS_FAMILY==='Windows'?strtolower(str_replace('\\','/',$s)):$s;
    if (!$runtime || $runtime!==$location['runtimeFile'] || is_link($runtime)
        || str_starts_with($normalize($runtime),rtrim($normalize($directory),'/').'/')) throw new RuntimeException();
    require $runtime;
    \PK\Runtime\Requests::serve($directory,dirname($runtime));
} catch (Throwable) {
    http_response_code(503); header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, no-store'); header('X-Robots-Tag: noindex, nofollow');
    header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer');
    echo '{"code":"inactive","message":"Die Onlineanmeldung und Anmeldungsverwaltung sind noch nicht freigegeben. Es wurden keine Angaben angenommen."}';
}
