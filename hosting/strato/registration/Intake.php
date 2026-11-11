<?php
declare(strict_types=1);
namespace PK\Registration;
use PDO;

/** One local transaction: receipt claim + encrypted staff request. No remote delivery or booking. */
final class Intake
{
    public const VERSION = 1;
    public const TICKET_SECONDS = 86400;
    private string $prefix;
    private string $secret;
    public function __construct(private PDO $db, private array $keys, private Policy $policy, private \Closure $sessionSource, bool $testing = false, string $prefix = 'pk_')
    {
        if (!preg_match('/\Apk_(?:fixture_[a-f0-9]{12}_)?\z/',$prefix) || (!$testing && $prefix !== 'pk_')) throw new \RuntimeException('Invalid table scope');
        if (!$testing && $db->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'mysql') throw new \RuntimeException('Private MySQL required');
        foreach (['data','auth','audit','backup'] as $name) if (strlen($keys[$name] ?? '') !== 32) throw new \RuntimeException('Invalid key');
        if (count(array_unique($keys,SORT_STRING)) !== 4) throw new \RuntimeException('Separate keys required');
        $this->prefix = $prefix; $this->secret = hash_hmac('sha256','pk-registration-v1',$keys['auth'],true);
        $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
        if ($this->mysql()) { $db->setAttribute(PDO::ATTR_EMULATE_PREPARES,false); $db->exec("SET time_zone = '+00:00'"); $db->exec('SET SESSION innodb_lock_wait_timeout=5'); }
    }
    private function mysql(): bool { return $this->db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'; }
    private function sql(string $sql, array $args = []): \PDOStatement
    {
        $sql = str_replace(['{meta}','{claims}','{limits}','{requests}'],array_map(fn($s)=>$this->prefix.$s,['intake_meta','intake_claims','intake_limits','staff_requests']),$sql);
        $statement = $this->db->prepare($sql); $statement->execute($args); return $statement;
    }
    public function migrate(): void
    {
        $suffix = $this->mysql() ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : '';
        $this->sql('CREATE TABLE IF NOT EXISTS {meta} (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, epoch VARCHAR(64) NOT NULL, paused INTEGER NOT NULL)'.$suffix);
        $this->sql('CREATE TABLE IF NOT EXISTS {claims} (id VARCHAR(64) PRIMARY KEY, fingerprint VARCHAR(64) NOT NULL, request_id VARCHAR(32) NULL, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL)'.$suffix);
        $this->sql('CREATE TABLE IF NOT EXISTS {limits} (id VARCHAR(64) PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL)'.$suffix);
        if (!$this->sql('SELECT id FROM {meta} WHERE id=1')->fetchColumn()) $this->sql('INSERT INTO {meta} (id,version,epoch,paused) VALUES (1,?,?,1)',[self::VERSION,bin2hex(random_bytes(32))]);
        $this->meta(); // Migrations are operator-only, never HTTP.
    }
    private function meta(bool $lock = false): array
    {
        $row = $this->sql('SELECT version,epoch,paused FROM {meta} WHERE id=1'.($lock && $this->mysql() ? ' FOR UPDATE' : ''))->fetch();
        if (!$row || (int)$row['version'] !== self::VERSION || !preg_match('/\A[a-f0-9]{64}\z/',$row['epoch'])) throw new \RuntimeException('Intake contract missing');
        return $row;
    }
    private function atomic(\Closure $work): mixed
    {
        if ($this->db->inTransaction()) throw new \RuntimeException('Nested transaction');
        $this->db->beginTransaction();
        try { $meta = $this->meta(true); $result = $work($meta); $this->db->commit(); return $result; }
        catch (\Throwable $error) { try { if ($this->db->inTransaction()) $this->db->rollBack(); } catch (\Throwable) {} throw $error; }
    }
    public function pause(bool $paused): void { $this->atomic(function() use($paused) { $this->sql('UPDATE {meta} SET paused=?,epoch=? WHERE id=1',[$paused?1:0,bin2hex(random_bytes(32))]); }); }
    private function hmac(string $value): string { return hash_hmac('sha256',$value,$this->secret); }
    private function available(array $meta): void { if ((int)$meta['paused'] !== 0) throw new Failure(503,'inactive'); }
    private function peer(string $peer): string
    {
        if (!filter_var($peer,FILTER_VALIDATE_IP)) throw new Failure(503,'source-unavailable');
        return bin2hex(inet_pton($peer)); // Canonical direct peer; never X-Forwarded-For.
    }
    private function limit(string $kind, string $identity, int $max, int $now): void
    {
        $end = (intdiv($now,900)+1)*900; $id = $this->hmac('limit:'.$kind.':'.$end.':'.$identity);
        $conflict = $this->mysql() ? ' ON DUPLICATE KEY UPDATE hits=hits+1' : ' ON CONFLICT(id) DO UPDATE SET hits=hits+1';
        $this->sql('INSERT INTO {limits} (id,hits,expires_at) VALUES (?,1,?)'.$conflict,[$id,$end]);
        if ((int)$this->sql('SELECT hits FROM {limits} WHERE id=?',[$id])->fetchColumn() > $max) throw new Failure(429,'rate-limit');
    }
    public function attempt(string $peer, int $now, bool $ticket = false): void
    {
        $peer = $this->peer($peer);
        $this->atomic(function($meta) use($peer,$now,$ticket) { $this->available($meta); $this->limit('attempt-all','all',1000,$now); $this->limit($ticket?'ticket':'attempt',$peer,$ticket?30:60,$now); });
    }
    public function ticket(int $now): string
    {
        $meta = $this->meta(); $this->available($meta);
        $claim = $now.'.'.($now+self::TICKET_SECONDS).'.'.$meta['epoch'].'.'.bin2hex(random_bytes(32));
        return $claim.'.'.$this->hmac('ticket:'.$claim);
    }
    private function verify(string $ticket, array $meta, int $now): string
    {
        if (!preg_match('/\A(\d{10})\.(\d{10})\.([a-f0-9]{64})\.([a-f0-9]{64})\.([a-f0-9]{64})\z/',$ticket,$parts)
            || (int)$parts[1]>$now || (int)$parts[2]<=$now || (int)$parts[2]-(int)$parts[1]!==self::TICKET_SECONDS
            || !hash_equals($meta['epoch'],$parts[3]) || !hash_equals($this->hmac('ticket:'.substr($ticket,0,-65)),$parts[5])) throw new Failure(409,'ticket-expired');
        return $this->hmac('claim:'.$ticket);
    }
    private function seal(array $value, string $context): string
    {
        $key = hash_hmac('sha256','pk-staff:data:'.$context,$this->keys['data'],true); $nonce = random_bytes(24);
        return base64_encode($nonce.sodium_crypto_secretbox(json_encode($value,JSON_THROW_ON_ERROR),$nonce,$key));
    }
    private function replay(array $row, string $fingerprint): array
    {
        if (!hash_equals($row['fingerprint'],$fingerprint)) throw new Failure(409,'idempotency-conflict');
        if (!$row['request_id'] || !$this->sql('SELECT id FROM {requests} WHERE id=?',[$row['request_id']])->fetchColumn()) throw new Failure(409,'reconciliation-required');
        return ['reference'=>$row['id'],'replayed'=>true];
    }
    public function submit(string $ticket, array $input, string $peer, int $now): array
    {
        $peer = $this->peer($peer); $meta = $this->meta(); $this->available($meta); $id = $this->verify($ticket,$meta,$now);
        $request = $this->policy->validate($input,$now); $fingerprint = $this->hmac('payload:'.json_encode($request,JSON_THROW_ON_ERROR));
        $previous = $this->sql('SELECT * FROM {claims} WHERE id=?',[$id])->fetch();
        if ($previous) return $this->replay($previous,$fingerprint);
        // Only a server adapter can supply published session details. Never forward participant input.
        if (isset($request['org']['sessionId'])) {
            $session = ($this->sessionSource)($request['org']['sessionId'],$now);
            if (!is_array($session) || ($session['id'] ?? '') !== $request['org']['sessionId'] || ($session['requestable'] ?? false) !== true) throw new Failure(422,'session-unavailable',['sessionId'=>'Dieser Termin ist nicht anfragbar.']);
        }
        return $this->atomic(function($locked) use($id,$ticket,$request,$fingerprint,$peer,$now) {
            $this->available($locked); $this->verify($ticket,$locked,$now);
            $previous = $this->sql('SELECT * FROM {claims} WHERE id=?',[$id])->fetch();
            if ($previous) return $this->replay($previous,$fingerprint);
            $this->limit('new-all','all',200,$now); $this->limit('new-peer',$peer,10,$now); $this->limit('new-contact',strtolower($request['org']['guardianEmail']),5,$now);
            $record = bin2hex(random_bytes(16));
            $this->sql('INSERT INTO {claims} (id,fingerprint,request_id,created_at,expires_at) VALUES (?,?,?,?,?)',[$id,$fingerprint,$record,$now,(int)explode('.',$ticket)[1]+3600]);
            $proofs = $this->policy->proofs($request,$now);
            $this->sql('INSERT INTO {requests} (id,status,version,created_at,activity_at,org,care,proofs) VALUES (?,\'pending\',1,?,?,?,?,?)',[$record,$now,$now,
                $this->seal($request['org'],$record.':org'), $request['care']?$this->seal($request['care'],$record.':care'):null, $proofs?$this->seal($proofs,$record.':proofs'):null]);
            return ['reference'=>$id,'replayed'=>false];
        });
    }
    public function retention(int $now): array
    {
        return $this->atomic(function() use($now) { $claims=$this->sql('DELETE FROM {claims} WHERE expires_at<=?',[$now])->rowCount(); $limits=$this->sql('DELETE FROM {limits} WHERE expires_at<=?',[$now])->rowCount(); return ['claims'=>$claims,'limits'=>$limits]; });
    }
    public function reconcile(string $reference): string
    {
        if (!preg_match('/\A[a-f0-9]{64}\z/',$reference)) throw new \RuntimeException('Invalid reference');
        $row=$this->sql('SELECT request_id FROM {claims} WHERE id=?',[$reference])->fetch();
        return !$row?'not-found':($this->sql('SELECT id FROM {requests} WHERE id=?',[$row['request_id']])->fetchColumn()?'received':'reconciliation-required');
    }
}
