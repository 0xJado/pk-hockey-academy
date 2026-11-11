<?php
declare(strict_types=1);
namespace PK\Staff;

final class Http
{
    private static function e(mixed $s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
    private const LABELS = ['childName'=>'Kind', 'birthYear'=>'Jahrgang', 'guardianName'=>'Erziehungsberechtigte Person', 'guardianEmail'=>'E-Mail', 'guardianPhone'=>'Telefon', 'bookingType'=>'Anfrage', 'team'=>'Verein / Mannschaft', 'position'=>'Position', 'experience'=>'Trainingshinweise', 'healthNotes'=>'Gesundheitshinweise', 'emergencyName'=>'Zusätzlicher Notfallkontakt', 'emergencyPhone'=>'Notfalltelefon', 'pickupPersons'=>'Abholberechtigte', 'health'=>'Gesundheit', 'website'=>'Academy-Website', 'print'=>'Print', 'analysis'=>'Interne Videoanalyse', 'version'=>'Textfassung', 'grantedAt'=>'Erklärt am', 'withdrawnAt'=>'Widerrufen am'];
    private const STATUS = ['pending'=>'Offene Anfrage','confirmed'=>'Persönlich bestätigt','completed'=>'Abgeschlossen','rejected'=>'Abgelehnt','withdrawn'=>'Zurückgezogen','reconciliation'=>'Wiederhergestellt – Abgleich nötig'];

    public static function serve(Staff $staff, array $config, bool $testing = false): void
    {
        ob_start(); // Keep status/error headers mutable until the complete response is known.
        $now = time(); $origin = $config['origin']; $path = $config['path']; $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store, max-age=0'); header('Pragma: no-cache');
        // no-referrer turns a native form's Origin into 'null' in Chromium. Preserve same-origin verification without cross-site referrers.
        header('X-Robots-Tag: noindex, nofollow'); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: same-origin'); header('X-Frame-Options: DENY');
        header("Content-Security-Policy: default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
        $cookieName = $testing ? 'pk_staff_fixture' : '__Host-pk_staff';
        $token = $_COOKIE[$cookieName] ?? null; $message = ''; $session = null;
        try {
            $staff->assertContract();
            if (!$testing && ($_SERVER['HTTPS'] ?? '') !== 'on') throw new Rejected('Secure connection required');
            if (!in_array($method, ['GET','POST'], true)) { http_response_code(405); header('Allow: GET, POST'); throw new Rejected('Unsupported method'); }
            if (array_diff(array_keys($_GET), ['record','offset'])) throw new Rejected('Unknown query');
            if (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) !== $path) { http_response_code(404); throw new Rejected('Unknown route'); }
            $session = $staff->session(is_string($token) ? $token : null, $now);
            if (!$session) {
                if ($method !== 'GET') throw new Rejected('Authentication required');
                $staff->allowSession($_SERVER['REMOTE_ADDR'] ?? '', $now); $token = $staff->newSession($now); $session = $staff->session($token, $now);
                self::cookie($cookieName, $token, !$testing);
            }
            if ($method === 'POST') {
                if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $origin) throw new Rejected('Origin mismatch');
                $length = $_SERVER['CONTENT_LENGTH'] ?? '';
                if (!ctype_digit((string)$length) || (int)$length > 16384 || !preg_match('#^application/x-www-form-urlencoded(?:;\s*charset=UTF-8)?$#iD', $_SERVER['CONTENT_TYPE'] ?? '')) throw new Rejected('Invalid body');
                $body = file_get_contents('php://input', false, null, 0, 16385);
                if ($body === false || strlen($body) > 16384) throw new Rejected('Invalid body');
                parse_str($body, $input);
                foreach ($input as $value) if (!is_string($value)) throw new Rejected('Nested values rejected');
                if (array_diff(array_keys($input), ['action','csrf','login','password','record','version','confirmedOutside','lastTrainingAt','basis','holdDays','category','specialBasis'])) throw new Rejected('Unknown form field');
                $staff->checkCsrf($token, $input['csrf'] ?? ''); $action = $input['action'] ?? '';
                if ($action === 'login') {
                    $token = $staff->login($token, $input['csrf'], $input['login'] ?? '', $input['password'] ?? '', $_SERVER['REMOTE_ADDR'] ?? '', $now);
                    self::cookie($cookieName, $token, !$testing);
                } elseif ($action === 'logout') {
                    $staff->requireAdmin($token, $now); $staff->logout($token); self::cookie($cookieName, '', !$testing);
                } else {
                    $version = filter_var($input['version'] ?? null, FILTER_VALIDATE_INT);
                    if (!$version || $version < 1) throw new Rejected('Invalid version');
                    if ($action === 'completed') {
                        $date = \DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $input['lastTrainingAt'] ?? '', new \DateTimeZone('Europe/Berlin'));
                        if (!$date || $date->format('Y-m-d\TH:i') !== ($input['lastTrainingAt'] ?? '')) throw new Rejected('Invalid date');
                        $input['lastTrainingAt'] = (string)$date->getTimestamp();
                    }
                    if ($action === 'hold') { $days = filter_var($input['holdDays'] ?? null, FILTER_VALIDATE_INT); if (!$days || $days > 31 || $days < 1) throw new Rejected('Invalid review interval'); $input['until'] = $now + $days * 86400; $input['categories'] = [$input['category'] ?? '']; }
                    $staff->change($token, $input['csrf'], $input['record'] ?? '', $version, $action, $input, $now);
                }
                // Redirect contains no submitted names, notes, credentials or personal contact details.
                header('Location: ' . $path, true, 303); ob_end_clean(); return;
            }
        } catch (Rejected $error) {
            if (http_response_code() < 400) http_response_code(403);
            $message = 'Die Aktion konnte nicht übernommen werden. Bitte erneut anmelden oder die Ansicht neu laden und die Angaben prüfen.';
        } catch (\Throwable $error) {
            http_response_code(503); $message = 'Die Verwaltung ist vorübergehend nicht verfügbar. Es wurde kein Erfolg bestätigt.';
        }

        $e = fn ($s) => self::e($s); $csrf = is_string($token) ? $staff->csrf($token) : '';
        $authenticated = false;
        try { if ($session && is_string($token)) { $staff->requireAdmin($token, $now); $authenticated = true; } } catch (\Throwable) {}
        echo '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><title>Anmeldungsverwaltung – PK Hockey Academy</title><style>' . self::css() . '</style><body><header>PK HOCKEY ACADEMY · GESCHÜTZTE VERWALTUNG</header><main><h1>Anmeldungen</h1>';
        if ($message) echo '<p role="alert" class="notice">' . $e($message) . '</p>';
        if (!$authenticated) {
            if (isset($_GET['record'])) http_response_code(403);
            echo '<p>Nur für persönlich berechtigte Personen. Der Sanity-Zugang gilt hier nicht.</p><form method="post" action="'.$e($path).'"><input type="hidden" name="csrf" value="'.$e($csrf).'"><input type="hidden" name="action" value="login"><label>Kennung<input name="login" autocomplete="username" maxlength="64" required></label><label>Passwort<input name="password" type="password" autocomplete="current-password" maxlength="72" required></label><button>Anmelden</button></form>';
        } else {
            echo '<form method="post" action="'.$e($path).'"><input type="hidden" name="csrf" value="'.$e($csrf).'"><button name="action" value="logout">Abmelden</button></form><p class="notice">Eine Statusänderung versendet keine E-Mail und reserviert keinen Trainingsplatz. Bestätigungen persönlich erledigen. Keine Downloads oder CSV-Exporte verfügbar.</p>';
            try {
                if (isset($_GET['record'])) {
                    if (!is_string($_GET['record'])) throw new Rejected('Invalid identifier');
                    $record = $staff->detail($token, $_GET['record'], $now);
                    echo '<a href="'.$e($path).'">Zur Übersicht</a><h2>'. $e(self::STATUS[$record['status']] ?? 'Abgleich nötig') .'</h2>';
                    foreach (['org'=>'Organisation','care'=>'Betreuungsrelevante Angaben','proofs'=>'Einwilligungsnachweise'] as $key=>$label) {
                        echo '<section><h3>'.$e($label).'</h3>';
                        if ($record[$key] === null) echo '<p>Keine gespeicherten oder noch anzeigbaren Angaben.</p>';
                        else echo self::fields($record[$key]);
                        echo '</section>';
                    }
                    if ($record['hold']) echo '<section class="notice"><h3>Dokumentierte Aufbewahrungsausnahme</h3><p>Erneute Prüfung fällig: '.$e(gmdate('d.m.Y',(int)$record['holdUntil'])).'</p>'.self::fields($record['hold']).'</section>';
                    $hidden = '<input type="hidden" name="csrf" value="'.$e($csrf).'"><input type="hidden" name="record" value="'.$e($record['id']).'"><input type="hidden" name="version" value="'.$e($record['version']).'">';
                    $transitions = Staff::transitions($record['status']);
                    if ($transitions) {
                        echo '<section><h3>Bearbeitungsstand dokumentieren</h3><form method="post" action="'.$e($path).'">'.$hidden.'<label>Neuer Stand<select name="action">';
                        foreach ($transitions as $next) echo '<option value="'.$e($next).'">'.$e(self::STATUS[$next]).'</option>';
                        echo '</select></label>';
                        if (in_array('confirmed',$transitions,true)) echo '<label class="check"><input type="checkbox" name="confirmedOutside" value="yes"> Ich habe die Buchungsbestätigung bereits persönlich übermittelt.</label>';
                        if (in_array('completed',$transitions,true)) echo '<label>Ende der letzten tatsächlichen Einheit (Europe/Berlin; bei Abschluss)<input type="datetime-local" name="lastTrainingAt"></label>';
                        echo '<button>Stand speichern</button></form></section>';
                    }
                    echo '<section><h3>Widerruf dokumentieren</h3><p>Danach betroffene Aufnahmen und Veröffentlichungen im jeweiligen Speicher entfernen. Diese Verwaltung löscht keine CMS- oder Social-Media-Dateien automatisch.</p><form method="post" action="'.$e($path).'">'.$hidden.'<label>Zweck<select name="action"><option value="health">Gesundheitsangaben</option><option value="website">Academy-Website</option><option value="print">Print</option><option value="analysis">Interne Videoanalyse</option></select></label><button>Widerruf speichern</button></form><h3>Beendete Mediennutzung dokumentieren</h3><p>Mindestens jährlich und anhand des tatsächlichen Aufnahmedatums prüfen. Die maximale Nutzungsdauer und die kürzeren Videofristen gelten unabhängig von der Nachweisaufbewahrung. Erst wenn die Nutzung tatsächlich beendet ist, den Nachweisabschluss festhalten.</p><form method="post" action="'.$e($path).'">'.$hidden.'<label>Beendete Nutzung<select name="action"><option value="end-website">Academy-Website</option><option value="end-print">Print</option><option value="end-analysis">Interne Videoanalyse</option></select></label><button>Nutzungsende dokumentieren</button></form></section>';
                    echo '<section><h3>Eng begrenzte Aufbewahrungsausnahme</h3><p>Nur mit konkretem erforderlichem Grund und betroffenen Datenkategorien. Keine allgemeine Verlängerung für Gesundheitsdaten.</p><form method="post" action="'.$e($path).'">'.$hidden.'<input type="hidden" name="action" value="hold"><label>Betroffene Kategorie<select name="category"><option value="org">Organisation</option><option value="care">Betreuung / Gesundheit</option><option value="proofs">Nachweise</option></select></label><label>Konkrete Grundlage und Zweck<textarea name="basis" minlength="20" maxlength="1000" required></textarea></label><label>Prüfung spätestens in Tagen<input type="number" name="holdDays" min="1" max="31" required></label><label class="check"><input type="checkbox" name="specialBasis" value="yes"> Bei Gesundheitsdaten ist die konkrete Grundlage für besondere Datenkategorien dokumentiert.</label><button>Ausnahme dokumentieren</button></form><form method="post" action="'.$e($path).'">'.$hidden.'<button name="action" value="release-hold">Ausnahme beenden</button></form></section>';
                } else {
                    $offset = filter_var($_GET['offset'] ?? 0, FILTER_VALIDATE_INT); if ($offset === false) throw new Rejected('Invalid page');
                    $rows = $staff->listing($token, $now, $offset);
                    if (!$rows) echo '<p>Noch keine Anfragen in dieser Ansicht.</p>';
                    foreach ($rows as $row) echo '<section><h2><a href="'.$e($path).'?record='.$e($row['id']).'">'.$e($row['childName']).'</a></h2><p>'.$e(self::STATUS[$row['status']] ?? 'Abgleich nötig').'</p>'.($row['overdue']?'<p class="notice">Seit mindestens 90 Tagen ohne Fortgang: persönlich prüfen und abschließen.</p>':'').'</section>';
                    if ($offset > 0) echo '<a href="'.$e($path).'?offset='.max(0,$offset-50).'">Vorherige Seite</a> ';
                    if (count($rows) === 50) echo '<a href="'.$e($path).'?offset='.($offset+50).'">Weitere Anfragen</a>';
                }
            } catch (\Throwable) { http_response_code(403); echo '<p role="alert">Diese Ansicht ist nicht verfügbar. Bitte zur Übersicht zurückkehren.</p>'; }
        }
        echo '</main></body></html>'; ob_end_flush();
    }

    private static function fields(array $fields, string $context = ''): string
    {
        $html = '<dl>';
        foreach ($fields as $key=>$value) {
            $label = self::LABELS[$key] ?? match($key) { 'basis'=>'Grundlage', 'categories'=>'Kategorien', 'responsible'=>'Verantwortliche Kennung', 'endedAt'=>'Nutzung beendet am', 'due'=>'Nachweis löschen ab', '_subject'=>'Zuordnung', default=>'Nachweisangabe' };
            $html .= '<dt>'.self::e($label).'</dt><dd>';
            if (is_array($value)) $html .= self::fields($value,(string)$key);
            else {
                $display = is_bool($value) ? ($value ? 'Ja' : 'Nein') : $value;
                if ($key === 'bookingType') $display = ['single'=>'Einzeltermin','five'=>'5er-Paket'][$value] ?? 'Bitte prüfen';
                elseif ($key === 'position') $display = ['field'=>'Feldspieler','goalie'=>'Torwart'][$value] ?? $value;
                elseif ($context === 'categories') $display = ['org'=>'Organisation','care'=>'Betreuung / Gesundheit','proofs'=>'Nachweise'][$value] ?? $value;
                elseif (in_array($key,['grantedAt','withdrawnAt','endedAt','due'],true) && is_numeric($value)) $display = (new \DateTimeImmutable('@'.(int)$value))->setTimezone(new \DateTimeZone('Europe/Berlin'))->format('d.m.Y H:i');
                $html .= self::e($display);
            }
            $html .= '</dd>';
        }
        return $html.'</dl>';
    }

    private static function cookie(string $name, string $token, bool $secure): void
    {
        setcookie($name, $token, ['expires'=>$token===''?1:0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
    }

    private static function css(): string
    {
        return '*{box-sizing:border-box}body{margin:0;background:#DDECF8;color:#101D2E;font:1rem/1.6 system-ui,sans-serif}header{padding:1rem;background:#050B12;color:white;font-weight:800;letter-spacing:.08em}main{max-width:56rem;margin:auto;padding:2rem 1rem}h1{font-size:2.5rem}section,form{background:white;padding:1.2rem;margin:1.2rem 0;border-radius:.3rem}label{display:block;font-weight:650;margin:.8rem 0}input,select,textarea,button{font:inherit;max-width:100%}input:not([type=checkbox]),select,textarea{display:block;width:100%;padding:.7rem;border:1px solid #536a80}button{background:#075799;color:white;border:0;padding:.8rem 1.2rem;font-weight:bold;cursor:pointer;min-height:44px}a{color:#075799;overflow-wrap:anywhere}.check{display:flex;gap:.7rem;align-items:flex-start}.check input{margin-top:.5rem;min-width:20px;min-height:20px}.notice{border-left:4px solid #087ED5;padding:1rem;background:#edf5fc}dt{font-weight:bold}dd{margin:0 0 1rem;white-space:pre-wrap;overflow-wrap:anywhere}:focus-visible{outline:3px solid #005ca8;outline-offset:3px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}';
    }
}
