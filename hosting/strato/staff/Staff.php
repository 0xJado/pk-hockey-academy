<?php
declare(strict_types=1);

namespace PK\Staff;

use PDO;
use RuntimeException;

final class Rejected extends RuntimeException {}

/** Private staff candidate. The public registration endpoint never imports this module. */
final class Staff
{
    public const VERSION = 1;
    private PDO $db;
    private array $keys;
    private string $journal;
    private bool $testing;

    public function __construct(PDO $db, array $keys, string $journal, bool $testing = false)
    {
        $this->db = $db; $this->keys = $keys; $this->journal = $journal; $this->testing = $testing;
        foreach (['data', 'auth', 'audit', 'backup'] as $name) {
            if (strlen($keys[$name] ?? '') !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) throw new Rejected('Invalid private key configuration');
        }
        if (count(array_unique(array_values($keys), SORT_STRING)) !== 4) throw new Rejected('Use distinct keys for data, authentication, journal and backups');
        if (!$testing && $db->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') throw new Rejected('Production requires the accepted MySQL/MariaDB database');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') $db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    }

    public function migrate(): void
    {
        // Migration privileges are needed only by the offline operator, never a web request.
        $suffix = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';
        foreach ([
            'pk_staff_schema' => 'version INTEGER PRIMARY KEY',
            'pk_staff_users' => 'id VARCHAR(64) PRIMARY KEY, password_hash VARCHAR(255) NOT NULL, enabled INTEGER NOT NULL, epoch INTEGER NOT NULL, role VARCHAR(16) NOT NULL',
            'pk_staff_sessions' => 'id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NULL, epoch INTEGER NOT NULL, created_at BIGINT NOT NULL, seen_at BIGINT NOT NULL',
            'pk_staff_limits' => 'id VARCHAR(64) PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL',
            'pk_staff_requests' => 'id VARCHAR(32) PRIMARY KEY, status VARCHAR(16) NOT NULL, version INTEGER NOT NULL, created_at BIGINT NOT NULL, activity_at BIGINT NOT NULL, org TEXT NULL, care TEXT NULL, proofs TEXT NULL, care_due BIGINT NULL, org_due BIGINT NULL, proof_due BIGINT NULL, `hold` TEXT NULL, hold_until BIGINT NULL',
            'pk_staff_audit' => 'id VARCHAR(32) PRIMARY KEY, actor VARCHAR(64) NOT NULL, record_ref VARCHAR(64) NOT NULL, action VARCHAR(32) NOT NULL, at_time BIGINT NOT NULL',
        ] as $table => $columns) $this->db->exec("CREATE TABLE IF NOT EXISTS $table ($columns)$suffix");
        $row = $this->sql('SELECT version FROM pk_staff_schema')->fetchColumn();
        if ($row === false) $this->sql('INSERT INTO pk_staff_schema (version) VALUES (?)', [self::VERSION]);
        elseif ((int)$row !== self::VERSION) throw new Rejected('Unknown staff contract version');
        if (!file_exists($this->journal)) $this->writeJournal([]);
    }

    private function sql(string $sql, array $args = []): \PDOStatement
    {
        $statement = $this->db->prepare($sql); $statement->execute($args); return $statement;
    }

    public function assertContract(): void
    {
        if ((int)$this->sql('SELECT version FROM pk_staff_schema')->fetchColumn() !== self::VERSION) throw new Rejected('Staff contract not accepted');
    }

    private function atomic(callable $work): mixed
    {
        if ($this->db->inTransaction()) throw new Rejected('Nested transaction rejected');
        $this->db->beginTransaction();
        try { $result = $work(); $this->db->commit(); return $result; }
        catch (\Throwable $error) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $error; }
    }

    private function key(string $purpose, string $context): string
    {
        if ($purpose !== 'data') return $this->keys[$purpose];
        if (!preg_match('/^[a-f0-9]{32}:(org|care|proofs|hold)$/D',$context)) throw new Rejected('Missing record/category encryption context');
        return hash_hmac('sha256','pk-staff:data:'.$context,$this->keys['data'],true);
    }

    private function seal(mixed $value, string $purpose = 'data', string $context = ''): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return base64_encode($nonce . sodium_crypto_secretbox(json_encode($value, JSON_THROW_ON_ERROR), $nonce, $this->key($purpose,$context)));
    }

    private function open(?string $value, string $purpose = 'data', string $context = ''): mixed
    {
        if ($value === null) return null;
        $bytes = base64_decode($value, true);
        if ($bytes === false || strlen($bytes) < 40) throw new Rejected('Invalid encrypted state');
        $plain = sodium_crypto_secretbox_open(substr($bytes, 24), substr($bytes, 0, 24), $this->key($purpose,$context));
        if ($plain === false) throw new Rejected('Encrypted state authentication failed');
        return json_decode($plain, true, 32, JSON_THROW_ON_ERROR);
    }

    private function ref(string $value): string { return hash_hmac('sha256', $value, $this->keys['audit']); }
    private function sid(string $token): string { return hash_hmac('sha256', $token, $this->keys['auth']); }
    public function csrf(string $token): string { return hash_hmac('sha256', 'csrf:' . $token, $this->keys['auth']); }
    public function checkCsrf(string $token, string $csrf): void
    {
        if (!preg_match('/^[a-f0-9]{64}$/D', $token) || !hash_equals($this->csrf($token), $csrf)) throw new Rejected('Request verification failed');
    }

    private function audit(string $actor, string $record, string $action, int $now): void
    {
        $this->sql('INSERT INTO pk_staff_audit (id,actor,record_ref,action,at_time) VALUES (?,?,?,?,?)', [bin2hex(random_bytes(16)), $this->ref('actor:' . $actor), $this->ref('record:' . $record), $action, $now]);
    }

    public function setAdmin(string $id, string $password): void
    {
        if (!preg_match('/^[a-z0-9-]{3,64}$/D', $id) || strlen($password) < 16 || strlen($password) > 72) throw new Rejected('Invalid administrator credentials');
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => $this->testing ? 4 : 12]);
        $this->atomic(function () use ($id, $hash) {
            $row = $this->sql('SELECT epoch FROM pk_staff_users WHERE id=?', [$id])->fetch();
            if ($row) $this->sql('UPDATE pk_staff_users SET password_hash=?,enabled=1,epoch=?,role=? WHERE id=?', [$hash, (int)$row['epoch'] + 1, 'admin', $id]);
            else $this->sql('INSERT INTO pk_staff_users (id,password_hash,enabled,epoch,role) VALUES (?,?,1,1,?)', [$id, $hash, 'admin']);
            $this->sql('DELETE FROM pk_staff_sessions WHERE user_id=?', [$id]);
            $this->audit('operator', $id, 'access-reset', time());
        });
    }

    public function revoke(string $id, int $now): void
    {
        $this->atomic(function () use ($id, $now) {
            $this->sql('UPDATE pk_staff_users SET enabled=0,epoch=epoch+1 WHERE id=?', [$id]);
            $this->sql('DELETE FROM pk_staff_sessions WHERE user_id=?', [$id]);
            $this->audit('operator', $id, 'access-revoke', $now);
        });
    }

    private function limit(string $bucket, int $maximum, int $now): void
    {
        $id = $this->ref('limit:' . $bucket);
        $suffix = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
        $row = $this->sql('SELECT hits,expires_at FROM pk_staff_limits WHERE id=?' . $suffix, [$id])->fetch();
        if (!$row) $this->sql('INSERT INTO pk_staff_limits (id,hits,expires_at) VALUES (?,1,?)', [$id, $now + 900]);
        elseif ((int)$row['expires_at'] <= $now) $this->sql('UPDATE pk_staff_limits SET hits=1,expires_at=? WHERE id=?', [$now + 900, $id]);
        elseif ((int)$row['hits'] >= $maximum) throw new Rejected('Try again later');
        else $this->sql('UPDATE pk_staff_limits SET hits=hits+1 WHERE id=?', [$id]);
    }

    public function newSession(int $now, ?string $user = null, int $epoch = 0): string
    {
        $token = bin2hex(random_bytes(32));
        $this->sql('INSERT INTO pk_staff_sessions (id,user_id,epoch,created_at,seen_at) VALUES (?,?,?,?,?)', [$this->sid($token), $user, $epoch, $now, $now]);
        return $token;
    }

    public function allowSession(string $peer, int $now): void
    {
        $this->atomic(function () use ($peer, $now) { $this->limit('session-all', 500, $now); $this->limit('session:' . $peer, 60, $now); });
    }

    public function session(?string $token, int $now): ?array
    {
        if (!$token || !preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
        $row = $this->sql('SELECT * FROM pk_staff_sessions WHERE id=?', [$this->sid($token)])->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;
        $absolute = $row['user_id'] === null ? 600 : 28800;
        if ($now >= (int)$row['created_at'] + $absolute || $now >= (int)$row['seen_at'] + 1200) { $this->logout($token); return null; }
        if ($row['user_id'] !== null) {
            $user = $this->sql('SELECT id,epoch,enabled,role FROM pk_staff_users WHERE id=?', [$row['user_id']])->fetch(PDO::FETCH_ASSOC);
            if (!$user || !(int)$user['enabled'] || $user['role'] !== 'admin' || (int)$user['epoch'] !== (int)$row['epoch']) { $this->logout($token); return null; }
        }
        $this->sql('UPDATE pk_staff_sessions SET seen_at=? WHERE id=?', [$now, $this->sid($token)]);
        return $row;
    }

    public function login(string $token, string $csrf, string $login, string $password, string $peer, int $now): string
    {
        $this->checkCsrf($token, $csrf);
        $login = strtolower(trim($login)); // Match the canonical personal ID and rate bucket across DB collations.
        if (!$this->session($token, $now) || strlen($login) > 64 || strlen($password) > 72) throw new Rejected('Login failed');
        // The direct server peer is used; untrusted forwarded headers are never identity.
        $this->atomic(function () use ($peer, $login, $now) {
            $this->limit('all', 300, $now); $this->limit('peer:' . $peer, 30, $now); $this->limit('account:' . $login, 10, $now);
        });
        $user = $this->sql('SELECT * FROM pk_staff_users WHERE id=?', [$login])->fetch(PDO::FETCH_ASSOC);
        $dummy = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = password_verify($password, $user['password_hash'] ?? $dummy);
        if (!$valid || !$user || !(int)$user['enabled'] || $user['role'] !== 'admin') throw new Rejected('Login failed');
        return $this->atomic(function () use ($token, $user, $now) {
            $this->logout($token); $next = $this->newSession($now, $user['id'], (int)$user['epoch']);
            $this->audit($user['id'], '', 'login', $now); return $next;
        });
    }

    public function logout(string $token): void { $this->sql('DELETE FROM pk_staff_sessions WHERE id=?', [$this->sid($token)]); }
    public function requireAdmin(string $token, int $now): string
    {
        $session = $this->session($token, $now);
        if (!$session || $session['user_id'] === null) throw new Rejected('Authentication required');
        return $session['user_id'];
    }

    /** #13 must write this versioned contract atomically after its own intake validation. No HTTP insertion exists here. */
    public function insertFixture(array $org, array $care, array $proofs, int $now): string
    {
        if (!$this->testing) throw new Rejected('Fixture insertion is test-only');
        $id = bin2hex(random_bytes(16));
        $this->sql('INSERT INTO pk_staff_requests (id,status,version,created_at,activity_at,org,care,proofs) VALUES (?, ?,1,?,?,?,?,?)', [$id, 'pending', $now, $now, $this->seal($org, 'data', $id.':org'), $this->seal($care, 'data', $id.':care'), $this->seal($proofs, 'data', $id.':proofs')]);
        return $id;
    }

    public function listing(string $token, int $now, int $offset = 0): array
    {
        $actor = $this->requireAdmin($token, $now);
        if ($offset < 0 || $offset > 100000 || $offset % 50 !== 0) throw new Rejected('Invalid page');
        $rows = $this->sql('SELECT id,status,created_at,activity_at,version,org,org_due,`hold`,hold_until FROM pk_staff_requests ORDER BY created_at DESC,id LIMIT 50 OFFSET ' . $offset)->fetchAll(PDO::FETCH_ASSOC);
        $this->audit($actor, '', 'list', $now);
        return array_map(function ($row) use ($now) {
            $org = $this->visible($row, 'org', $now) ? $this->open($row['org'], 'data', $row['id'].':org') : null;
            return ['id' => $row['id'], 'status' => $row['status'], 'childName' => $org['childName'] ?? 'Angaben gelöscht', 'overdue' => $row['status'] === 'pending' && (int)$row['activity_at'] + 90 * 86400 <= $now];
        }, $rows);
    }

    private function visible(array $row, string $category, int $now): bool
    {
        $due = $row[$category === 'care' ? 'care_due' : ($category === 'org' ? 'org_due' : 'proof_due')];
        $held = (int)($row['hold_until'] ?? 0) > $now && in_array($category, $this->open($row['hold'], 'data', $row['id'].':hold')['categories'] ?? [], true);
        return $row[$category] !== null && ($category === 'proofs' || $due === null || (int)$due > $now || $held);
    }

    public function detail(string $token, string $id, int $now): array
    {
        $actor = $this->requireAdmin($token, $now); $row = $this->row($id);
        $this->audit($actor, $id, 'view', $now);
        return ['id' => $id, 'status' => $row['status'], 'version' => (int)$row['version'], 'org' => $this->visible($row, 'org', $now) ? $this->open($row['org'], 'data', $row['id'].':org') : null, 'care' => $this->visible($row, 'care', $now) ? $this->open($row['care'], 'data', $row['id'].':care') : null, 'proofs' => $this->proofView($row, $now), 'hold' => $this->open($row['hold'], 'data', $row['id'].':hold'), 'holdUntil' => $row['hold_until']];
    }

    private function row(string $id): array
    {
        if (!preg_match('/^[a-f0-9]{32}$/D', $id)) throw new Rejected('Record unavailable');
        $row = $this->sql('SELECT * FROM pk_staff_requests WHERE id=?', [$id])->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new Rejected('Record unavailable');
        return $row;
    }

    private function save(array $row, int $expected): void
    {
        $result = $this->sql('UPDATE pk_staff_requests SET status=?,version=version+1,activity_at=?,org=?,care=?,proofs=?,care_due=?,org_due=?,proof_due=?,`hold`=?,hold_until=? WHERE id=? AND version=?', [$row['status'], $row['activity_at'], $row['org'], $row['care'], $row['proofs'], $row['care_due'], $row['org_due'], $row['proof_due'], $row['hold'], $row['hold_until'], $row['id'], $expected]);
        if ($result->rowCount() !== 1) throw new Rejected('Record changed; reload before retrying');
    }

    private function proofEnd(int $now): int { $date = (new \DateTimeImmutable('@' . $now))->setTimezone(new \DateTimeZone('Europe/Berlin')); return $date->setDate((int)$date->format('Y') + 4, 1, 1)->setTime(0, 0)->getTimestamp(); }

    public static function transitions(string $status): array
    {
        return ['pending'=>['confirmed','rejected','withdrawn'],'reconciliation'=>['confirmed','completed','rejected','withdrawn'],'confirmed'=>['completed','withdrawn'],'completed'=>[],'rejected'=>[],'withdrawn'=>[]][$status] ?? [];
    }

    private function nextProofDue(array $proofs): ?int
    {
        $dates = []; foreach (['health','website','print','analysis'] as $purpose) if (isset($proofs[$purpose]['due'])) $dates[] = (int)$proofs[$purpose]['due'];
        return $dates ? min($dates) : null;
    }

    private function endProof(array &$row, string $purpose, int $at, bool $withdraw = false): void
    {
        $proofs = $this->open($row['proofs'], 'data', $row['id'].':proofs') ?? [];
        if (isset($proofs[$purpose])) {
            $proofs[$purpose]['endedAt'] = $at; $proofs[$purpose]['due'] = $this->proofEnd($at);
            if ($withdraw) $proofs[$purpose]['withdrawnAt'] = $at;
            $row['proofs'] = $this->seal($proofs, 'data', $row['id'].':proofs'); $row['proof_due'] = $this->nextProofDue($proofs);
        }
    }

    private function proofView(array $row, int $now): ?array
    {
        $proofs = $this->open($row['proofs'], 'data', $row['id'].':proofs') ?? [];
        $held = (int)($row['hold_until'] ?? 0) > $now && in_array('proofs',$this->open($row['hold'], 'data', $row['id'].':hold')['categories'] ?? [],true);
        foreach (['health','website','print','analysis'] as $purpose) if (!$held && isset($proofs[$purpose]['due']) && (int)$proofs[$purpose]['due'] <= $now) unset($proofs[$purpose]);
        return array_intersect(array_keys($proofs),['health','website','print','analysis']) ? $proofs : null;
    }

    public function change(string $token, string $csrf, string $id, int $version, string $action, array $input, int $now): void
    {
        $actor = $this->requireAdmin($token, $now); $this->checkCsrf($token, $csrf);
        $this->atomic(function () use ($actor, $id, $version, $action, $input, $now) {
            $row = $this->row($id);
            if ((int)$row['version'] !== $version) throw new Rejected('Record changed; reload before retrying');
            if (in_array($action, ['confirmed', 'completed', 'rejected', 'withdrawn'], true)) {
                if (!in_array($action, self::transitions($row['status']), true)) throw new Rejected('Invalid status transition');
                if ($action === 'confirmed' && ($input['confirmedOutside'] ?? '') !== 'yes') throw new Rejected('Personal confirmation must already have been sent');
                $row['status'] = $action; $row['activity_at'] = $now;
                if ($action === 'completed') {
                    $last = filter_var($input['lastTrainingAt'] ?? null, FILTER_VALIDATE_INT);
                    if ($last === false || $last < (int)$row['created_at'] || $last > $now) throw new Rejected('Actual last training date required');
                    $row['care_due'] = min($now, $last) + 14 * 86400;
                    $row['org_due'] = max($last, $now) + 90 * 86400;
                    $this->endProof($row, 'health', $now);
                } elseif (in_array($action, ['rejected', 'withdrawn'], true)) {
                    $row['care_due'] = $now; $row['org_due'] = $now + 90 * 86400; $this->endProof($row, 'health', $now);
                }
            } elseif (in_array($action, ['health', 'website', 'print', 'analysis'], true)) {
                $this->endProof($row, $action, $now, true);
                $this->erase($id, 'withdraw:' . $action, $now);
                if ($action === 'health') {
                    $care = $this->open($row['care'], 'data', $row['id'].':care') ?? []; unset($care['healthNotes']);
                    $this->erase($id, 'health', $now); $row['care'] = $care ? $this->seal($care, 'data', $row['id'].':care') : null;
                }
            } elseif (in_array($action, ['end-website','end-print','end-analysis'], true)) {
                $purpose = substr($action,4); $this->endProof($row,$purpose,$now); $this->erase($id,'end:'.$purpose,$now);
            } elseif ($action === 'hold') {
                $until = filter_var($input['until'] ?? null, FILTER_VALIDATE_INT);
                $basis = trim((string)($input['basis'] ?? '')); $categories = $input['categories'] ?? [];
                if (!$until || $until <= $now || $until > $now + 31 * 86400 || strlen($basis) < 20 || strlen($basis) > 1000 || !is_array($categories) || !$categories || array_diff($categories, ['org','care','proofs'])) throw new Rejected('Document a narrow basis, categories and review within 31 days');
                if (in_array('care', $categories, true) && ($input['specialBasis'] ?? '') !== 'yes') throw new Rejected('Health hold requires a documented special-category basis');
                foreach ($categories as $category) if (!$this->visible($row,$category,$now)) throw new Rejected('A hold cannot resurrect missing or already expired data');
                $row['hold'] = $this->seal(['basis' => $basis, 'categories' => array_values($categories), 'responsible' => $actor], 'data', $row['id'].':hold'); $row['hold_until'] = $until;
            } elseif ($action === 'release-hold') { $row['hold'] = null; $row['hold_until'] = null; }
            else throw new Rejected('Action unavailable'); // No CSV/export or arbitrary record editing.
            if (in_array($action, ['completed','rejected','withdrawn'], true)) { $this->erase($id,'end:health',$now); $this->erase($id, 'deadlines', $now, ['care_due' => $row['care_due'], 'org_due' => $row['org_due'], 'proof_due' => $row['proof_due']]); }
            if ($action === 'release-hold') $this->erase($id, 'release-hold', $now);
            $this->purgeRow($row, $now); $this->save($row, $version); $this->audit($actor, $id, $action, $now);
        });
    }

    private function writeJournal(array $entries): void
    {
        $bytes = $this->seal($entries, 'audit');
        $temporary = $this->journal . '.' . bin2hex(random_bytes(8)) . '.tmp';
        if (file_put_contents($temporary, $bytes, LOCK_EX) !== strlen($bytes)) throw new Rejected('Private erasure journal unavailable');
        chmod($temporary, 0600);
        if (!rename($temporary, $this->journal)) { @unlink($temporary); throw new Rejected('Private erasure journal unavailable'); }
    }

    private function journal(callable $work): mixed
    {
        $lock = fopen($this->journal . '.lock', 'c'); if (!$lock || !flock($lock, LOCK_EX)) throw new Rejected('Erasure journal locked');
        try {
            if (!is_file($this->journal)) throw new Rejected('Erasure journal missing; recovery cannot continue');
            $entries = $this->open(file_get_contents($this->journal), 'audit');
            return $work($entries);
        } finally { flock($lock, LOCK_UN); fclose($lock); }
    }

    private function erase(string $id, string $category, int $now, array $limits = []): void
    {
        // Journal first: a failed SQL commit may over-redact a restored copy, never resurrect deleted information.
        $this->journal(function ($entries) use ($id, $category, $now, $limits) {
            $entries[] = ['ref' => $this->ref('record:' . $id), 'category' => $category, 'at' => $now, 'limits' => $limits];
            $this->writeJournal(array_values(array_filter($entries, fn ($entry) => $entry['at'] >= $now - 35 * 86400)));
        });
    }

    private function purgeRow(array &$row, int $now): void
    {
        foreach (['org','care'] as $category) if ($row[$category] !== null && !$this->visible($row, $category, $now)) {
            $this->erase($row['id'], $category, $now); $row[$category] = null;
        }
        if ($row['proofs'] !== null) {
            $before = $this->open($row['proofs'], 'data', $row['id'].':proofs'); $after = $this->proofView($row,$now);
            foreach (['health','website','print','analysis'] as $purpose) if (isset($before[$purpose]) && !isset($after[$purpose])) $this->erase($row['id'],'proof:'.$purpose,$now);
            if ($after === null) { $this->erase($row['id'],'proofs',$now); $row['proofs'] = null; $row['proof_due'] = null; }
            elseif ($before !== $after) { $row['proofs'] = $this->seal($after, 'data', $row['id'].':proofs'); $row['proof_due'] = $this->nextProofDue($after); }
        }
        if ($row['hold_until'] !== null && (int)$row['hold_until'] <= $now) { $row['hold'] = null; $row['hold_until'] = null; }
    }

    public function retention(int $now): array
    {
        $counts = ['reviewPending' => 0, 'purgedRecords' => 0, 'redactedCategories' => 0];
        // Initial launch bound: fail visibly rather than silently skip a backlog or starve rows behind held data.
        if ((int)$this->sql('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn() > 10000) throw new Rejected('Retention workload needs a reviewed larger batch strategy');
        $rows = $this->sql('SELECT id FROM pk_staff_requests ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($rows as $id) $this->atomic(function () use ($id, $now, &$counts) {
            $row = $this->row($id); $old = $row; $before = array_filter([$row['org'],$row['care'],$row['proofs']], fn ($x) => $x !== null);
            $this->purgeRow($row, $now);
            if ($old === $row) return;
            $counts['redactedCategories'] += count($before) - count(array_filter([$row['org'],$row['care'],$row['proofs']], fn ($x) => $x !== null));
            if ($row['org'] === null && $row['care'] === null && $row['proofs'] === null && $row['hold'] === null) { $this->erase($id, 'record', $now); $this->sql('DELETE FROM pk_staff_requests WHERE id=? AND version=?', [$id,$row['version']]); ++$counts['purgedRecords']; }
            else $this->save($row, (int)$row['version']);
            $this->audit('retention', $id, 'retention', $now);
        });
        $counts['reviewPending'] = (int)$this->sql('SELECT COUNT(*) FROM pk_staff_requests WHERE status=? AND activity_at<=?', ['pending', $now - 90 * 86400])->fetchColumn();
        $this->sql('DELETE FROM pk_staff_audit WHERE at_time<?', [$now - 90 * 86400]);
        $this->sql('DELETE FROM pk_staff_limits WHERE expires_at<?', [$now - 86400]);
        $this->sql('DELETE FROM pk_staff_sessions WHERE seen_at<? OR created_at<?', [$now - 1200, $now - 28800]);
        return $counts;
    }

    public function backup(int $now): string
    {
        if ((int)$this->sql('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn() > 10000) throw new Rejected('Use a reviewed larger backup strategy');
        return $this->atomic(fn () => $this->seal(['schema' => self::VERSION, 'at' => $now, 'requests' => $this->sql('SELECT * FROM pk_staff_requests')->fetchAll(PDO::FETCH_ASSOC)], 'backup'));
    }

    public function restore(string $backup, int $now): void
    {
        if (strlen($backup) > 32 * 1024 * 1024) throw new Rejected('Backup exceeds offline size limit');
        $data = $this->open($backup, 'backup');
        if (($data['schema'] ?? 0) !== self::VERSION || !is_int($data['at'] ?? null) || $data['at'] > $now || $data['at'] < $now - 35 * 86400 || !is_array($data['requests'] ?? null)) throw new Rejected('Backup version/age invalid');
        $this->journal(function ($entries) use ($data, $now) {
            $this->atomic(function () use ($entries, $data, $now) {
                if ((int)$this->sql('SELECT COUNT(*) FROM pk_staff_requests')->fetchColumn() !== 0) throw new Rejected('Restore only into an empty maintenance database');
                // Intake receipts are deliberately not restored. Invalidate pre-recovery tokens
                // and pause intake atomically so missing/restored claims cannot create duplicates.
                $hasIntake = $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'
                    ? (int)$this->sql('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',['pk_intake_meta'])->fetchColumn()
                    : (int)$this->sql('SELECT COUNT(*) FROM sqlite_master WHERE type=? AND name=?',['table','pk_intake_meta'])->fetchColumn();
                if ($hasIntake) {
                    if ((int)$this->sql('SELECT version FROM pk_intake_meta WHERE id=1')->fetchColumn() !== 1) throw new Rejected('Unknown intake recovery contract');
                    $this->sql('UPDATE pk_intake_meta SET paused=1,epoch=? WHERE id=1',[bin2hex(random_bytes(32))]);
                }
                foreach ($data['requests'] as $row) {
                    if (!preg_match('/^[a-f0-9]{32}$/D', $row['id'] ?? '')) throw new Rejected('Invalid backup record');
                    $skip = false;
                    foreach ($entries as $entry) if ($entry['ref'] === $this->ref('record:' . $row['id']) && $entry['at'] >= $data['at']) {
                        if ($entry['category'] === 'record') $skip = true;
                        elseif ($entry['category'] === 'health') { $care = $this->open($row['care'], 'data', $row['id'].':care') ?? []; unset($care['healthNotes']); $row['care'] = $care ? $this->seal($care, 'data', $row['id'].':care') : null; }
                        elseif (str_starts_with($entry['category'], 'withdraw:')) $this->endProof($row,substr($entry['category'],9),$entry['at'],true);
                        elseif (str_starts_with($entry['category'], 'end:')) $this->endProof($row,substr($entry['category'],4),$entry['at']);
                        elseif (str_starts_with($entry['category'], 'proof:')) { $proofs = $this->open($row['proofs'], 'data', $row['id'].':proofs') ?? []; unset($proofs[substr($entry['category'],6)]); $row['proofs'] = $proofs ? $this->seal($proofs, 'data', $row['id'].':proofs') : null; $row['proof_due'] = $this->nextProofDue($proofs); }
                        elseif ($entry['category'] === 'release-hold') { $row['hold'] = null; $row['hold_until'] = null; }
                        elseif ($entry['category'] === 'deadlines') foreach (['care_due','org_due','proof_due'] as $limit) { $next = $entry['limits'][$limit] ?? null; if ($next !== null) $row[$limit] = $row[$limit] === null ? $next : min((int)$row[$limit], $next); }
                        elseif (in_array($entry['category'], ['org','care','proofs'], true)) $row[$entry['category']] = null;
                    }
                    if ($skip) continue;
                    // The independent journal already accounts for old deletions; enforce newly due limits too.
                    foreach (['org','care'] as $category) if ($row[$category] !== null && !$this->visible($row, $category, $now)) $row[$category] = null;
                    $proofs = $this->proofView($row,$now); $row['proofs'] = $proofs ? $this->seal($proofs, 'data', $row['id'].':proofs') : null; $row['proof_due'] = $proofs ? $this->nextProofDue($proofs) : null;
                    $row['status'] = 'reconciliation'; // A restored snapshot never silently re-confirms a place.
                    $columns = ['id','status','version','created_at','activity_at','org','care','proofs','care_due','org_due','proof_due','hold','hold_until'];
                    $this->sql('INSERT INTO pk_staff_requests (' . implode(',', array_map(fn ($key) => '`' . $key . '`', $columns)) . ') VALUES (' . implode(',', array_fill(0,count($columns),'?')) . ')', array_map(fn ($key) => $row[$key], $columns));
                }
                $this->sql('DELETE FROM pk_staff_sessions'); // Never restore credentials or authenticated sessions.
                $this->audit('operator', '', 'restore', $now);
            });
        });
    }
}
