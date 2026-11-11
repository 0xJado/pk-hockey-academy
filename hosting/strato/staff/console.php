<?php
declare(strict_types=1);
// Offline operator only; never place this file, the classes, keys or backups under a web root.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
ini_set('display_errors', '0'); ini_set('log_errors', '0');
require __DIR__ . '/Staff.php'; require __DIR__ . '/Config.php';
try {
    [$config, $staff] = \PK\Staff\Config::load(getenv('PK_STAFF_CONFIG') ?: '', getenv('PK_PUBLIC_ROOT') ?: '', false, true);
    $command = $argv[1] ?? ''; $now = time();
    if ($command !== 'migrate') $staff->assertContract();
    if ($command === 'migrate') { $staff->migrate(); echo "Staff schema ready. Public intake remains inactive.\n"; }
    elseif ($command === 'admin-password') {
        $passwordFile = getenv('PK_STAFF_PASSWORD_FILE') ?: '';
        $real = realpath($passwordFile); $public = realpath(getenv('PK_PUBLIC_ROOT') ?: '');
        if (!$real || !$public || str_starts_with(strtolower(str_replace('\\','/',$real)), rtrim(strtolower(str_replace('\\','/',$public)),'/').'/')) throw new \RuntimeException();
        $password = is_file($passwordFile) ? rtrim(file_get_contents($passwordFile), "\r\n") : '';
        $staff->setAdmin($argv[2] ?? '', $password); sodium_memzero($password);
        echo "Personal administrator credential reset; existing sessions revoked.\n";
    } elseif ($command === 'revoke') { $staff->revoke($argv[2] ?? '', $now); echo "Access revoked.\n"; }
    elseif ($command === 'retention') echo json_encode($staff->retention($now), JSON_THROW_ON_ERROR) . "\n";
    elseif ($command === 'backup') {
        $directory = realpath($config['backupDirectory']);
        $name = $directory . '/pk-staff-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(8)) . '.enc';
        $bytes = $staff->backup($now); $handle = fopen($name, 'x'); if (!$handle) throw new \RuntimeException();
        try { if (fwrite($handle, $bytes) !== strlen($bytes)) throw new \RuntimeException(); } finally { fclose($handle); }
        chmod($name, 0600);
        foreach (glob($directory . '/pk-staff-*.enc') as $file) if (!is_link($file) && preg_match('/^pk-staff-\d{8}-\d{6}-[a-f0-9]{16}\.enc$/D', basename($file)) && filemtime($file) < $now - 35 * 86400 && !unlink($file)) throw new \RuntimeException();
        echo "Encrypted private backup written and managed retention checked; no sessions or passwords included.\n";
    } elseif ($command === 'restore') {
        if (($config['maintenance'] ?? false) !== true) throw new \RuntimeException();
        // Explicit maintenance workflow: a new empty DB, original keys and current independent journal.
        $file = realpath($argv[2] ?? ''); $directory = realpath($config['backupDirectory']);
        if (!$file || dirname($file) !== $directory || filesize($file) > 32 * 1024 * 1024) throw new \RuntimeException();
        $staff->restore(file_get_contents($file), $now); echo "Private restore completed. Sessions revoked; booking statuses need reconciliation.\n";
    } else throw new \RuntimeException();
} catch (\Throwable) {
    fwrite(STDERR, "Staff operation failed; no success claimed. Inspect private configuration/state without logging credentials or participant content.\n"); exit(1);
}
