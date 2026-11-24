<?php
declare(strict_types=1);

use PK\Interview\Http;
use PK\Interview\Interviews;
use PK\Staff\Staff;

require __DIR__.'/../staff/Staff.php';
require __DIR__.'/../staff/Http.php';
require __DIR__.'/../interview/Interviews.php';
require __DIR__.'/../interview/Http.php';

$root = getenv('PK_INTERVIEW_FIXTURE');
$origin = getenv('PK_INTERVIEW_ORIGIN');
if (!$root || !$origin || !preg_match('#\Ahttp://127\.0\.0\.1:\d+\z#', $origin)) {
    exit(1);
}
$db = new PDO('sqlite:'.$root.'/records.sqlite');
$db->exec('PRAGMA busy_timeout=5000');
if (PHP_SAPI === 'cli') {
    if (is_file($root.'/keys.json')) {
        exit(1);
    }
    file_put_contents($root.'/keys.json', json_encode(array_map(
        fn () => bin2hex(random_bytes(32)),
        array_fill_keys(['data', 'auth', 'audit', 'backup', 'interview'], null),
    ), JSON_THROW_ON_ERROR));
}
$keys = array_map('hex2bin', json_decode(file_get_contents($root.'/keys.json'), true, 6, JSON_THROW_ON_ERROR));
$interviewKey = $keys['interview'];
unset($keys['interview']);
$staff = new Staff($db, $keys, $root.'/erasure.enc', true);
$store = new Interviews($db, $interviewKey, true);
if (PHP_SAPI === 'cli') {
    $staff->migrate();
    $staff->setAdmin('fixture-owner', 'SYNTHETIC-staff-password-only');
    $store->migrate();
    exit;
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/intern/anmeldungen') {
    \PK\Staff\Http::serve($staff, ['origin' => $origin, 'path' => $path], true);
    return;
}
if (!in_array($path, [Http::COACH, Http::INBOX], true)) {
    http_response_code(404);
    return;
}
if (isset($_COOKIE['pk_staff_fixture'])) {
    $_COOKIE['__Host-pk_staff'] = $_COOKIE['pk_staff_fixture'];
}
$notify = static function () use ($root): bool {
    if (!is_file($root.'/mail-ready')) {
        return false;
    }
    return file_put_contents($root.'/mail.log', "generic alert\n", FILE_APPEND | LOCK_EX) !== false;
};
$questions = json_decode(file_get_contents($root.'/questions.json'), true, 8, JSON_THROW_ON_ERROR);
(new Http($store, $staff, $questions, $origin, $notify, true))->serve($path);
