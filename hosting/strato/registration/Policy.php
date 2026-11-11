<?php
declare(strict_types=1);
namespace PK\Registration;

final class Failure extends \RuntimeException
{
    public function __construct(public int $status, public string $reason, public array $fields = []) { parent::__construct($reason); }
}

/** Strict JSON and the selected minimal request policy. Never returns submitted values in errors. */
final class Policy
{
    public const VERSION = 'registration-request-v1-2026-11-11';
    public function __construct(public readonly array $document)
    {
        if (($document['version'] ?? '') !== self::VERSION || ($document['booking']['type'] ?? '') !== 'request-only'
            || ($document['booking']['spielerPlusIntegration'] ?? null) !== false) throw new \RuntimeException('Unsupported policy');
    }

    public static function json(string $body): array
    {
        try {
            $object = json_decode($body, false, 8, JSON_THROW_ON_ERROR);
            if (!$object instanceof \stdClass) throw new \RuntimeException();
            // PHP otherwise silently accepts repeated keys, including escaped aliases.
            preg_match_all('/"(?:[^"\\\\\x00-\x1f]|\\\\.)*"|[{}]/s', $body, $tokens, PREG_OFFSET_CAPTURE);
            $stack = [];
            foreach ($tokens[0] as [$token,$offset]) {
                if ($token === '{') { $stack[] = []; continue; }
                if ($token === '}') { array_pop($stack); continue; }
                if (str_starts_with(ltrim(substr($body,$offset+strlen($token))), ':')) {
                    $key = json_decode($token, true, 2, JSON_THROW_ON_ERROR); $index = count($stack)-1;
                    if (isset($stack[$index][$key])) throw new \RuntimeException();
                    $stack[$index][$key] = true;
                }
            }
            return get_object_vars($object);
        } catch (\Throwable) { throw new Failure(400,'body'); }
    }

    public function validate(array $input, int $now): array
    {
        $rules = $this->document['fields'];
        $allowed = [...array_column($rules,'name'),'policyVersion','sessionId','consents'];
        if (array_diff(array_keys($input),$allowed)) throw new Failure(422,'unknown-fields');
        if (($input['policyVersion'] ?? '') !== self::VERSION) throw new Failure(409,'policy-version');
        $org = []; $care = []; $errors = [];
        foreach ($rules as $rule) {
            $name = $rule['name']; $value = $input[$name] ?? null;
            if ($rule['type'] === 'boolean') {
                if ($value !== true) $errors[$name] = 'Bitte bestätigen.';
                continue;
            }
            if ($value === null && !array_key_exists($name,$input)) $value = '';
            if (!is_string($value) || !preg_match('//u',$value) || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/',$value)) { $errors[$name] = 'Bitte prüfen.'; continue; }
            $value = trim($value);
            if ($value === '') { if ($rule['required']) $errors[$name] = 'Bitte ausfüllen.'; continue; }
            if (preg_match_all('/./us',$value) > ($rule['maxLength'] ?? ($rule['type']==='year'?4:160))) { $errors[$name] = 'Angabe zu lang.'; continue; }
            if (!in_array($name,['experience','healthNotes'],true) && preg_match('/[\r\n\t]/',$value)) { $errors[$name] = 'Bitte prüfen.'; continue; }
            $valid = match ($rule['type']) {
                'year' => preg_match('/\A\d{4}\z/',$value) && (int)$value >= 1900 && (int)$value <= (int)gmdate('Y',$now),
                'enum' => in_array($value,$rule['values'],true),
                'email' => filter_var($value,FILTER_VALIDATE_EMAIL) !== false,
                'tel' => preg_match('/\A[+0-9 ()\/.\-]+\z/',$value) && strlen(preg_replace('/\D/','',$value)) >= 6,
                default => true,
            };
            if (!$valid) { $errors[$name] = 'Bitte prüfen.'; continue; }
            if ($rule['category'] === 'care') $care[$name] = $value;
            else $org[$name] = $rule['type'] === 'year' ? (int)$value : $value;
        }
        $consents = $input['consents'] ?? new \stdClass();
        if (!$consents instanceof \stdClass || array_diff(array_keys(get_object_vars($consents)),['health','website','print','analysis'])) throw new Failure(422,'consents');
        $grants = [];
        foreach (['health','website','print','analysis'] as $purpose) {
            $value = property_exists($consents,$purpose) ? $consents->$purpose : false;
            if (!is_bool($value)) $errors['consents'] = 'Bitte prüfen.';
            $grants[$purpose] = $value === true;
        }
        if (isset($care['healthNotes']) && !$grants['health']) $errors['healthNotes'] = 'Gesundheitshinweise benötigen eine gesonderte Einwilligung.';
        if (isset($care['emergencyName']) !== isset($care['emergencyPhone'])) $errors['emergencyPhone'] = 'Name und Telefonnummer gemeinsam angeben.';
        $session = $input['sessionId'] ?? '';
        if (!is_string($session) || ($session !== '' && !preg_match('/\A[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,159}\z/',$session)) || preg_match('/\A(?:drafts|versions)\./',(string)$session)) $errors['sessionId'] = 'Bitte Termin prüfen.';
        if (($org['bookingType'] ?? '') === 'single' && $session === '') $errors['sessionId'] = 'Bitte Termin wählen.';
        if (($org['bookingType'] ?? '') === 'five' && $session !== '') $errors['sessionId'] = 'Pakettermine werden persönlich abgestimmt.';
        if ($errors) throw new Failure(422,'validation',$errors);
        if ($session !== '') $org['sessionId'] = $session;
        $org['policyVersion'] = self::VERSION; $org['guardianAuthority'] = true;
        ksort($org); ksort($care);
        return ['org'=>$org,'care'=>$care,'grants'=>$grants];
    }

    public function proofs(array $request, int $now): array
    {
        $result = [];
        foreach ($this->document['consents'] as $consent) if ($request['grants'][$consent['purpose']]) $result[$consent['purpose']] = [
            'version'=>self::VERSION,'textSha256'=>hash('sha256',$consent['text']), 'grantedAt'=>$now,
            'actor'=>$request['org']['guardianName'],'contact'=>$request['org']['guardianEmail'],'subject'=>$request['org']['childName'],
        ];
        return $result;
    }
}
