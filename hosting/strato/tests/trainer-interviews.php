<?php
declare(strict_types=1);

use PK\Interview\Conflict;
use PK\Interview\Interviews;
use PK\Interview\Unavailable;

require __DIR__.'/../interview/Interviews.php';

function check(bool $condition): void
{
    if (!$condition) {
        throw new RuntimeException('Lifecycle assertion failed');
    }
}

function rejects(string $type, Closure $operation): void
{
    try {
        $operation();
    } catch (Throwable $failure) {
        if ($failure instanceof $type) {
            return;
        }
        throw $failure;
    }
    throw new RuntimeException('Expected '.$type);
}

$db = new PDO('sqlite::memory:');
$store = new Interviews($db, random_bytes(32), true);
$store->migrate();
$now = 1_800_000_000;
$invite = $store->issue($now);
$other = $store->issue($now);
check($invite['expiresAt'] === $now + 864_000);
$token = $invite['token'];
check($store->resume($token, $now) === ['submitted' => false, 'id' => $invite['id'], 'revision' => 0, 'answers' => []]);
$answers = ['name' => ['answer' => 'Fictional Coach'], 'contact' => ['answer' => 'coach@example.invalid']];
rejects(Unavailable::class, fn () => $store->readSubmission($invite['id']));
rejects(InvalidArgumentException::class, fn () => $store->submit($token, 0, [], false, $now));
rejects(InvalidArgumentException::class, fn () => $store->save($token, 0, ['birth' => []], $now));
check($store->save($token, 0, $answers, $now) === 1);
check($store->resume($other['token'], $now)['answers'] === []);
check($store->resume($token, $now)['answers']['name']['answer'] === 'Fictional Coach');
rejects(Conflict::class, fn () => $store->save($token, 0, $answers, $now));
$raw = $db->query('SELECT token_hash, encrypted_payload FROM pk_trainer_interviews')->fetch(PDO::FETCH_ASSOC);
check($raw['token_hash'] !== $token && !str_contains($raw['encrypted_payload'], 'Fictional Coach'));
check($store->submit($token, 1, $answers, false, $now) === $invite['id']);
check($store->submit($token, 1, $answers, false, $now + 1) === $invite['id']);
rejects(Conflict::class, fn () => $store->submit($token, 1, $answers, true, $now));
check($store->resume($token, $now) === ['submitted' => true, 'id' => $invite['id']]);
check($store->readSubmission($invite['id'])['publishProfile'] === false);
check(!$store->revoke($invite['id']));
$revoked = $store->issue($now);
check($store->revoke($revoked['id']));
rejects(Unavailable::class, fn () => $store->resume($revoked['token'], $now));
rejects(Unavailable::class, fn () => $store->resume($other['token'], $other['expiresAt']));
check($store->purgeExpiredDrafts($other['expiresAt']) === 1);
check($store->readSubmission($invite['id'])['submittedAt'] === $now);
echo "Trainer interview storage lifecycle passed.\n";
