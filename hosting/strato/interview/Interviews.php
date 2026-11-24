<?php
declare(strict_types=1);

namespace PK\Interview;

use PDO;

final class Conflict extends \RuntimeException {}
final class Unavailable extends \RuntimeException {}

/** Private storage. Staff authorization and coach session checks belong at the HTTP boundary. */
final class Interviews
{
    public const INVITATION_SECONDS = 10 * 24 * 60 * 60;
    private const QUESTIONS = [
        'name', 'role', 'contact', 'start', 'teams', 'highlights', 'experience',
        'focus', 'ages', 'philosophy', 'kids', 'intro', 'stats',
    ];
    private const FOLLOW_UPS = [
        'role', 'start', 'teams', 'highlights', 'experience', 'focus',
        'philosophy', 'kids', 'intro',
    ];

    public function __construct(private PDO $db, private string $key, bool $testing = false)
    {
        if (strlen($key) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new \InvalidArgumentException('Invalid interview data key');
        }
        if (!$testing && $db->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') {
            throw new \InvalidArgumentException('Private MariaDB connection required');
        }
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function migrate(): void
    {
        $suffix = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' ENGINE=InnoDB' : '';
        $this->db->exec('CREATE TABLE IF NOT EXISTS pk_trainer_interviews (
            id VARCHAR(32) PRIMARY KEY,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at BIGINT NOT NULL,
            submitted_at BIGINT NULL,
            alerted_at BIGINT NULL,
            revision INTEGER NOT NULL,
            encrypted_payload MEDIUMTEXT NOT NULL
        )'.$suffix);
    }

    public function issue(int $now): array
    {
        $id = bin2hex(random_bytes(16));
        $token = bin2hex(random_bytes(32));
        $expiresAt = $now + self::INVITATION_SECONDS;
        $this->query(
            'INSERT INTO pk_trainer_interviews (id, token_hash, expires_at, revision, encrypted_payload)
             VALUES (?, ?, ?, 0, ?)',
            [$id, $this->tokenHash($token), $expiresAt, $this->seal($id, ['answers' => []])],
        );
        return ['id' => $id, 'token' => $token, 'expiresAt' => $expiresAt];
    }

    public function resume(string $token, int $now): array
    {
        $row = $this->coachRow($token, $now);
        if ($row['submitted_at'] !== null) {
            return ['submitted' => true, 'id' => $row['id']];
        }
        return [
            'submitted' => false,
            'id' => $row['id'],
            'revision' => (int)$row['revision'],
            'answers' => $this->open($row)['answers'],
        ];
    }

    public function save(string $token, int $revision, array $answers, int $now): int
    {
        $row = $this->coachRow($token, $now);
        $this->write($row, $revision, ['answers' => $this->validateAnswers($answers)], $now, null);
        return $revision + 1;
    }

    public function submit(string $token, int $revision, array $answers, bool $publishProfile, int $now, ?array $photo = null, bool $publishPhoto = false): string
    {
        $row = $this->coachRow($token, $now);
        $answers = $this->validateAnswers($answers);
        if (trim($answers['name']['answer'] ?? '') === '') {
            throw new \InvalidArgumentException('Trainer name required');
        }
        if ($publishPhoto && (!$publishProfile || $photo === null)) {
            throw new \InvalidArgumentException('Photo permission requires a photo and profile permission');
        }
        $payload = [
            'answers' => $answers,
            'publishProfile' => $publishProfile,
            'publishPhoto' => $publishPhoto,
            'photo' => $photo,
            'permissionVersion' => 1,
        ];
        try {
            $this->write($row, $revision, $payload, $now, $now);
        } catch (Conflict $conflict) {
            // Check the durable result after a concurrent completion or lost receipt.
            $row = $this->coachRow($token, $now);
            if ($row['submitted_at'] === null || $this->open($row) !== $payload) {
                throw $conflict;
            }
        }
        return $row['id'];
    }

    public function readSubmission(string $id): array
    {
        $row = $this->query(
            'SELECT * FROM pk_trainer_interviews WHERE id = ? AND submitted_at IS NOT NULL',
            [$id],
        )->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Unavailable('Interview unavailable');
        }
        return ['submittedAt' => (int)$row['submitted_at'], ...$this->open($row)];
    }

    public function listing(int $now, int $offset = 0): array
    {
        $offset = max(0, $offset);
        return $this->query(
            'SELECT id, expires_at, submitted_at, alerted_at FROM pk_trainer_interviews
             WHERE submitted_at IS NOT NULL OR expires_at > ?
             ORDER BY COALESCE(submitted_at, expires_at) DESC, id LIMIT 50 OFFSET '.$offset,
            [$now],
        )->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deliverAlert(string $id, int $now, \Closure $notify): bool
    {
        $this->db->beginTransaction();
        try {
            $lock = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
            $row = $this->query(
                'SELECT alerted_at FROM pk_trainer_interviews WHERE id = ? AND submitted_at IS NOT NULL'.$lock,
                [$id],
            )->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                throw new Unavailable();
            }
            $delivered = $row['alerted_at'] !== null;
            if (!$delivered && $notify() === true) {
                $this->query('UPDATE pk_trainer_interviews SET alerted_at = ? WHERE id = ?', [$now, $id]);
                $delivered = true;
            }
            $this->db->commit();
            return $delivered;
        } catch (\Throwable $failure) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $failure;
        }
    }

    public function closeSubmission(string $id): bool
    {
        // Keep permission evidence separately from source answers and private uploads.
        $record = $this->readSubmission($id);
        if ($record['closed'] ?? false) {
            return false;
        }
        $name = $record['answers']['name']['answer'];
        $payload = [
            'closed' => true,
            'name' => $name,
            'publishProfile' => $record['publishProfile'],
            'publishPhoto' => $record['publishPhoto'],
            'permissionVersion' => $record['permissionVersion'],
        ];
        return $this->query(
            'UPDATE pk_trainer_interviews SET encrypted_payload = ?, expires_at = 0 WHERE id = ? AND submitted_at IS NOT NULL AND expires_at > 0',
            [$this->seal($id, $payload), $id],
        )->rowCount() === 1;
    }

    public function revoke(string $id): bool
    {
        return $this->query(
            'DELETE FROM pk_trainer_interviews WHERE id = ? AND submitted_at IS NULL',
            [$id],
        )->rowCount() === 1;
    }

    public function purgeExpiredDrafts(int $now): int
    {
        return $this->query(
            'DELETE FROM pk_trainer_interviews WHERE expires_at <= ? AND submitted_at IS NULL',
            [$now],
        )->rowCount();
    }

    private function coachRow(string $token, int $now): array
    {
        if (!preg_match('/\A[a-f0-9]{64}\z/', $token)) {
            throw new Unavailable('Interview unavailable');
        }
        $row = $this->query(
            'SELECT * FROM pk_trainer_interviews WHERE token_hash = ? AND expires_at > ?',
            [$this->tokenHash($token), $now],
        )->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Unavailable('Interview unavailable');
        }
        return $row;
    }

    private function write(array $row, int $revision, array $payload, int $now, ?int $submittedAt): void
    {
        $updated = $this->query(
            'UPDATE pk_trainer_interviews SET encrypted_payload = ?, revision = revision + 1, submitted_at = ?
             WHERE id = ? AND revision = ? AND expires_at > ? AND submitted_at IS NULL',
            [$this->seal($row['id'], $payload), $submittedAt, $row['id'], $revision, $now],
        );
        if ($updated->rowCount() !== 1) {
            throw new Conflict('Interview changed. Reload before editing.');
        }
    }

    private function validateAnswers(array $answers): array
    {
        if (array_diff(array_keys($answers), self::QUESTIONS)) {
            throw new \InvalidArgumentException('Unknown interview question');
        }
        $validated = [];
        foreach (self::QUESTIONS as $id) {
            if (!array_key_exists($id, $answers)) {
                continue;
            }
            $entry = $answers[$id];
            if (!is_array($entry) || array_diff(array_keys($entry), ['answer', 'followUpAnswer'])) {
                throw new \InvalidArgumentException('Invalid interview answer');
            }
            $answer = $entry['answer'] ?? '';
            $followUp = $entry['followUpAnswer'] ?? '';
            foreach ([$answer, $followUp] as $text) {
                if (!is_string($text) || !preg_match('/\A.{0,3000}\z/us', $text)) {
                    throw new \InvalidArgumentException('Invalid interview answer text');
                }
            }
            if ($followUp !== '' && (!in_array($id, self::FOLLOW_UPS, true) || trim($answer) === '')) {
                throw new \InvalidArgumentException('Unexpected follow-up answer');
            }
            $validated[$id] = ['answer' => $answer, 'followUpAnswer' => $followUp];
        }
        return $validated;
    }

    private function tokenHash(string $token): string
    {
        return hash('sha256', $token);
    }

    private function recordKey(string $id): string
    {
        return hash_hmac('sha256', 'pk-trainer-interview:'.$id, $this->key, true);
    }

    private function seal(string $id, array $payload): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return base64_encode($nonce.sodium_crypto_secretbox(
            json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            $nonce,
            $this->recordKey($id),
        ));
    }

    private function open(array $row): array
    {
        $bytes = base64_decode($row['encrypted_payload'], true);
        $size = SODIUM_CRYPTO_SECRETBOX_NONCEBYTES;
        if ($bytes === false || strlen($bytes) < $size + SODIUM_CRYPTO_SECRETBOX_MACBYTES) {
            throw new \RuntimeException('Invalid interview record');
        }
        $json = sodium_crypto_secretbox_open(substr($bytes, $size), substr($bytes, 0, $size), $this->recordKey($row['id']));
        if ($json === false) {
            throw new \RuntimeException('Invalid interview record');
        }
        return json_decode($json, true, 16, JSON_THROW_ON_ERROR);
    }

    private function query(string $sql, array $parameters): \PDOStatement
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($parameters);
        return $statement;
    }
}
