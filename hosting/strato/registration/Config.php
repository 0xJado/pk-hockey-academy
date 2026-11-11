<?php
declare(strict_types=1);
namespace PK\Registration;
use PDO;

final class Config
{
    public static function outside(string $file, string $public): string
    {
        $file = realpath($file); $public = realpath($public);
        $normalize = static fn($s)=>PHP_OS_FAMILY==='Windows'?strtolower(str_replace('\\','/',$s)):$s;
        if (!$file || !$public || $normalize($file)===$normalize($public) || str_starts_with($normalize($file),rtrim($normalize($public),'/').'/')) throw new \RuntimeException('Private path required');
        return $file;
    }
    public static function load(string $file, string $public, bool $operator = false): array
    {
        $file = self::outside($file,$public);
        $bytes = file_get_contents($file,false,null,0,16385);
        if ($bytes===false || strlen($bytes)>16384) throw new \RuntimeException();
        $config = json_decode($bytes,true,16,JSON_THROW_ON_ERROR);
        if (!$operator) {
            foreach (['enabled','policyAccepted','staffAccepted','realDataApproved','runtimePrivilegesAccepted','requestTimeoutsAccepted'] as $gate) if (($config[$gate] ?? false)!==true) throw new Failure(503,'inactive');
            if (($config['maintenance'] ?? true)!==false) throw new Failure(503,'inactive');
        }
        $databaseFile = self::outside($config['databaseConfig'] ?? '',$public);
        $database = json_decode(file_get_contents($databaseFile),true,16,JSON_THROW_ON_ERROR);
        $policyFile = self::outside($config['policyFile'] ?? '',$public);
        if (!hash_equals($config['policySha256'] ?? '',hash_file('sha256',$policyFile))) throw new \RuntimeException('Policy mismatch');
        $document = json_decode(file_get_contents($policyFile),true,16,JSON_THROW_ON_ERROR);
        if (!$operator && ($document['status'] ?? '')!=='approved') throw new Failure(503,'inactive');
        $policy = new Policy($document);
        if (!preg_match('/\Amysql:host=[a-z0-9.-]+;dbname=[a-zA-Z0-9_]+;charset=utf8mb4\z/',$database['dsn'] ?? '')) throw new \RuntimeException();
        $pdo = new PDO($database['dsn'],$database['username'],$database['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_TIMEOUT=>5]);
        if ((int)$pdo->query('SELECT version FROM pk_staff_schema')->fetchColumn()!==1) throw new \RuntimeException('Staff contract mismatch');
        $keys = []; foreach (['data','auth','audit','backup'] as $purpose) $keys[$purpose] = base64_decode($database['keys'][$purpose] ?? '',true) ?: '';
        $sessions = new Sessions($config['sanity'] ?? []);
        return [$config,new Intake($pdo,$keys,$policy,$sessions->lookup(...))];
    }
}
