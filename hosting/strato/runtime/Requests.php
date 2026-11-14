<?php
declare(strict_types=1);
namespace PK\Runtime;

/** Private, versioned runtime. Configuration and all domain classes stay private. */
final class Requests
{
    public static function serve(string $public, string $directory): void
    {
        $route = parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH);
        if (!in_array($route,['/api/registration','/api/registration/token','/intern/anmeldungen'],true)) {
            http_response_code(404); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow'); return;
        }
        $outside = static function(string $path) use($public): string {
            $real=realpath($path); $normalize=static fn($s)=>PHP_OS_FAMILY==='Windows'?strtolower(str_replace('\\','/',$s)):$s;
            if (!$real || $normalize($real)!==$normalize($path) || is_link($path) || $normalize($real)===$normalize($public)
                || str_starts_with($normalize($real),rtrim($normalize($public),'/').'/')) throw new \RuntimeException();
            return $real;
        };
        $file=$outside($directory.'/runtime.json');
        $bytes=file_get_contents($file,false,null,0,8193);
        if ($bytes===false || strlen($bytes)>8192) throw new \RuntimeException();
        $config=json_decode($bytes,true,8,JSON_THROW_ON_ERROR);
        // Installation is independent of activation. The private descriptor and
        // domain-specific policy/real-data/staff gates must all permit access.
        if (($config['version'] ?? null)!==1 || ($config['enabled'] ?? false)!==true) throw new \RuntimeException();
        if ($route==='/intern/anmeldungen') {
            $library=$outside($config['staffLibrary'] ?? '');
            foreach (['Staff','Config','Http'] as $name) require_once $outside($library.'/'.$name.'.php');
            [$configuration,$staff]=\PK\Staff\Config::load($outside($config['staffConfig'] ?? ''),$public);
            \PK\Staff\Http::serve($staff,$configuration);
        } else {
            $library=$outside($config['intakeLibrary'] ?? '');
            foreach (['Policy','Intake','Sessions','Config','Http'] as $name) require_once $outside($library.'/'.$name.'.php');
            [$configuration,$intake]=\PK\Registration\Config::load($outside($config['intakeConfig'] ?? ''),$public);
            \PK\Registration\Http::emit(\PK\Registration\Http::handle($_SERVER,true,fn()=>$intake,
                static fn($limit)=>file_get_contents('php://input',false,null,0,$limit)));
        }
    }
}
