<?php
declare(strict_types=1);

namespace PK\Interview;

use PDO;

final class Runtime
{
    public static function config(string $path, string $public, bool $operator = false): array
    {
        $config = json_decode(file_get_contents(self::outside($path, $public), false, null, 0, 16385), true, 12, JSON_THROW_ON_ERROR);
        if (($config['version'] ?? null) !== 1 || ($config['origin'] ?? '') !== 'https://pkhockeyacademy.de'
            || (!$operator && (($config['enabled'] ?? false) !== true || ($config['realDataApproved'] ?? false) !== true))) {
            throw new \RuntimeException('Interview runtime unavailable');
        }
        $key = base64_decode($config['dataKey'] ?? '', true);
        if ($key === false || strlen($key) !== 32 || !str_starts_with($config['dsn'] ?? '', 'mysql:')) {
            throw new \RuntimeException('Invalid interview storage configuration');
        }
        return $config;
    }

    public static function store(array $config): Interviews
    {
        require_once __DIR__.'/Interviews.php';
        $pdo = new PDO($config['dsn'], $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec('SET SESSION innodb_lock_wait_timeout=5');
        return new Interviews($pdo, base64_decode($config['dataKey'], true));
    }

    public static function serve(string $path, string $public, string $configFile): void
    {
        $config = self::config($configFile, $public);
        $staffLibrary = self::outside($config['staffLibrary'], $public);
        require_once self::outside($staffLibrary.'/Staff.php', $public);
        require_once self::outside($staffLibrary.'/Config.php', $public);
        [, $staff] = \PK\Staff\Config::load(self::outside($config['staffConfig'], $public), $public);
        $questions = json_decode(file_get_contents(__DIR__.'/questions.json', false, null, 0, 16385), true, 8, JSON_THROW_ON_ERROR);
        if (!is_array($questions) || count($questions) !== 13) {
            throw new \RuntimeException('Interview question contract unavailable');
        }
        $to = filter_var($config['notificationTo'], FILTER_VALIDATE_EMAIL);
        $from = filter_var($config['notificationFrom'], FILTER_VALIDATE_EMAIL);
        if (!$to || !$from) {
            throw new \RuntimeException('Interview notification configuration unavailable');
        }
        $notify = static fn (): bool => mail(
            $to,
            'Neues Trainerinterview',
            "Ein Trainerinterview ist eingegangen.\n\nhttps://pkhockeyacademy.de/intern/trainerinterviews",
            ['From' => $from, 'Content-Type' => 'text/plain; charset=UTF-8'],
        );
        require_once __DIR__.'/Http.php';
        (new Http(self::store($config), $staff, $questions, $config['origin'], $notify))->serve($path);
    }

    public static function outside(string $path, string $public): string
    {
        $real = realpath($path);
        $normalize = static fn (string $value): string => PHP_OS_FAMILY === 'Windows'
            ? strtolower(str_replace('\\', '/', $value)) : $value;
        if (!$real || is_link($path) || $normalize($real) !== $normalize($path)
            || str_starts_with($normalize($real).'/', rtrim($normalize($public), '/').'/')) {
            throw new \RuntimeException('Private path required');
        }
        return $real;
    }
}
