<?php
declare(strict_types=1);
// Offline fictional-fixture acceptance only; never copied to a deployment.
if (PHP_SAPI !== 'cli') exit(1);
$directory = getenv('PK_INTAKE_FIXTURE_ROOT') ?: '';
if (!is_dir($directory) || !str_contains(str_replace('\\','/',$directory),'/output/intake-tests/')) throw new RuntimeException('Fixture scope required');
require __DIR__.'/../staff/Staff.php';
$keys = array_map(fn($key)=>base64_decode($key),json_decode(file_get_contents($directory.'/keys.json'),true));
$db = new PDO('sqlite:'.$directory.'/fixture.sqlite');
$staff = new \PK\Staff\Staff($db,$keys,$directory.'/journal.enc',true);
$expected = (int)($argv[1] ?? 0);
if ((int)$db->query('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn() !== $expected
    || (int)$db->query('SELECT COUNT(*) FROM pk_intake_claims')->fetchColumn() !== $expected) throw new RuntimeException('Unexpected number of writes');
foreach ($db->query('SELECT org,care,proofs,status FROM pk_staff_requests') as $row) {
    if ($row['status'] !== 'pending' || str_contains(json_encode($row),'FIKTIV')) throw new RuntimeException('Storage/status invariant failed');
}
if ($expected > 0) {
    // Exercise the exact staff read contract against browser-created requests.
    $db->exec("DELETE FROM pk_staff_users WHERE id='fixture-owner'");
    $db->prepare('INSERT INTO pk_staff_users VALUES (?,?,1,1,?)')->execute(['fixture-owner',password_hash('SYNTHETIC-fixture-only',PASSWORD_DEFAULT),'admin']);
    $now = time(); $session = $staff->newSession($now);
    $session = $staff->login($session,$staff->csrf($session),'fixture-owner','SYNTHETIC-fixture-only','127.0.0.1',$now);
    $rows = $staff->listing($session,$now);
    if (count($rows) !== $expected) throw new RuntimeException('Staff listing mismatch');
    foreach ($rows as $row) {
        $record = $staff->detail($session,$row['id'],$now);
        if (!str_starts_with($record['org']['childName'] ?? '', 'FIKTIV')) throw new RuntimeException('Staff cannot decrypt browser request');
    }
    $staff->logout($session);
}
echo "Fictional intake/staff storage verified: $expected requests.\n";
