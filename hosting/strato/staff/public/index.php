<?php
declare(strict_types=1);
// Candidate only. Not copied by build:strato and never enables registration intake.
ini_set('display_errors', '0');
ini_set('log_errors', '0'); // Never log PDO parameters, credentials or record bodies.
try {
    $public = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $library = realpath(getenv('PK_STAFF_LIBRARY') ?: dirname(__DIR__));
    $normalize = fn ($path) => strtolower(str_replace('\\','/',$path));
    if (!$public || !$library || str_starts_with($normalize($library).'/', rtrim($normalize($public),'/').'/')) throw new \RuntimeException('Private library required');
    require_once $library . '/Staff.php';
    require_once $library . '/Config.php';
    require_once $library . '/Http.php';
    [$config, $staff] = \PK\Staff\Config::load(getenv('PK_STAFF_CONFIG') ?: '', $_SERVER['DOCUMENT_ROOT']);
    \PK\Staff\Http::serve($staff, $config);
} catch (\Throwable) {
    http_response_code(503); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow'); header('Content-Type: text/plain; charset=utf-8');
    echo 'Die Anmeldungsverwaltung ist noch nicht freigegeben.';
}
