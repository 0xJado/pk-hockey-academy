<?php
declare(strict_types=1);
namespace PK\Staff;
use PDO;

final class Config
{
    public static function load(string $path, string $publicRoot, bool $testing = false, bool $operator = false): array
    {
        $file = realpath($path); $root = realpath($publicRoot);
        $normalize = fn ($s) => strtolower(str_replace('\\', '/', $s));
        if (!$file || !$root || str_starts_with($normalize($file), rtrim($normalize($root), '/') . '/')) throw new Rejected('Configuration must be outside the public root');
        $config = json_decode(file_get_contents($file), true, 32, JSON_THROW_ON_ERROR);
        if (!$operator && (($config['enabled'] ?? false) !== true || ($config['maintenance'] ?? false) === true || (!$testing && ($config['databaseContractAccepted'] ?? false) !== true))) throw new Rejected('Staff candidate unavailable');
        if (!$testing && ($config['origin'] ?? '') !== 'https://pkhockeyacademy.de') throw new Rejected('Unexpected production origin');
        if (!preg_match('#^/[a-z0-9/-]+$#D', $config['path'] ?? '')) throw new Rejected('Invalid staff route');
        foreach (['journal','backupDirectory'] as $name) {
            $directory = realpath($name === 'journal' ? dirname($config[$name] ?? '') : ($config[$name] ?? ''));
            if (!$directory || str_starts_with($normalize($directory) . '/', rtrim($normalize($root), '/') . '/')) throw new Rejected('Private state directory must be outside the public root');
        }
        $keys = [];
        foreach (['data','auth','audit','backup'] as $name) $keys[$name] = base64_decode($config['keys'][$name] ?? '', true) ?: '';
        $pdo = new PDO($config['dsn'], $config['username'] ?? null, $config['password'] ?? null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        return [$config, new Staff($pdo, $keys, $config['journal'], $testing)];
    }
}
