<?php
declare(strict_types=1);

namespace PK\Interview;

use PK\Staff\Staff;

final class Http
{
    public const COACH = '/coach/interview';
    public const INBOX = '/intern/trainerinterviews';
    private const COOKIE = '__Host-pk_interview';
    private const STAFF_COOKIE = '__Host-pk_staff';
    private const MAX_PHOTO = 2 * 1024 * 1024;

    public function __construct(
        private Interviews $store,
        private Staff $staff,
        private array $questions,
        private string $origin,
        private \Closure $notify,
        private bool $testing = false,
    ) {}

    public function serve(string $path): void
    {
        $nonce = base64_encode(random_bytes(18));
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: private, no-store');
        header('Referrer-Policy: same-origin');
        header('X-Robots-Tag: noindex, nofollow');
        header('X-Content-Type-Options: nosniff');
        header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-$nonce'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        $post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
        try {
            if (!$this->testing && ($_SERVER['HTTPS'] ?? '') !== 'on') {
                throw new Unavailable();
            }
            if (!$post && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
                header('Allow: GET, POST');
                http_response_code(405);
                return;
            }
            if ($post) {
                $length = $_SERVER['CONTENT_LENGTH'] ?? '';
                if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $this->origin
                    || !ctype_digit((string)$length) || (int)$length > self::MAX_PHOTO + 512 * 1024) {
                    throw new \InvalidArgumentException();
                }
            }
            if ($path === self::COACH) {
                $this->coach($post, $nonce, time());
            } else {
                $this->inbox($post, time());
            }
        } catch (\PK\Staff\Rejected | Unavailable) {
            http_response_code(403);
            if ($post && $path === self::COACH) {
                $this->failure('Die Einladung ist abgelaufen oder ungültig.');
                return;
            }
            $this->page('Zugang nicht verfügbar', '<p>Bitte verwende einen gültigen Einladungslink oder melde dich in der internen Verwaltung an.</p>');
        } catch (Conflict) {
            http_response_code(409);
            $this->failure('Der Entwurf wurde inzwischen geändert. Sichere deinen Text und lade die Seite neu.');
        } catch (\InvalidArgumentException) {
            http_response_code(422);
            $this->failure('Bitte prüfe deine Angaben und versuche es erneut.');
        }
    }

    private function coach(bool $post, string $nonce, int $now): void
    {
        $cookieName = $this->testing ? 'pk_interview_fixture' : self::COOKIE;
        $token = $this->cookie($cookieName);
        if ($post) {
            $action = $_POST['action'] ?? '';
            if ($action === 'open') {
                $token = $_POST['invitation'] ?? '';
                if (!is_string($token)) {
                    throw new Unavailable();
                }
                $this->store->resume($token, $now);
                setcookie($cookieName, $token, [
                    'path' => '/', 'secure' => !$this->testing,
                    'httponly' => true, 'samesite' => 'Strict',
                ]);
                http_response_code(204);
                return;
            }
            if (!in_array($action, ['save', 'submit'], true)) {
                throw new \InvalidArgumentException();
            }
            $session = $this->store->resume($token, $now);
            if (($_POST['interview'] ?? '') !== $session['id']) {
                throw new Conflict();
            }
            $revision = filter_var($_POST['revision'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            $answers = $_POST['answers'] ?? [];
            if ($revision === false || !is_array($answers)) {
                throw new \InvalidArgumentException();
            }
            if ($action === 'save') {
                $result = ['revision' => $this->store->save($token, $revision, $answers, $now)];
            } else {
                if (($_POST['permissionVersion'] ?? null) !== (string)Interviews::PERMISSION_VERSION) {
                    http_response_code(409);
                    $this->failure('Die Hinweise zur Veröffentlichung wurden aktualisiert. Speichere deinen Entwurf und lade die Seite neu, bevor du das Interview absendest.');
                    return;
                }
                $id = $this->store->submit($token, $revision, $answers, isset($_POST['publishProfile']), $now, $this->photo(), isset($_POST['publishPhoto']));
                // A mail problem cannot undo durable submission or its receipt.
                try {
                    $this->sendAlert($id, $now);
                } catch (\Throwable) {}
                $result = ['submitted' => true];
            }
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($result, JSON_THROW_ON_ERROR);
            return;
        }

        $session = ['answers' => []];
        try {
            $session = $this->store->resume($token, $now);
        } catch (Unavailable) {}
        $body = '<p id="interview-status" role="status"></p>';
        if ($session['submitted'] ?? false) {
            $body .= '<p>Dein Trainerinterview ist eingegangen. Vielen Dank!</p>';
        } elseif (isset($session['revision'])) {
            $body .= $this->coachForm($session);
        } else {
            $body .= '<p>Öffne deinen persönlichen Link, um das Interview zu starten. Bei einem abgelaufenen Link wende dich an Pierre.</p>';
        }
        $body .= '<noscript><p>Bitte aktiviere JavaScript, um den Einladungslink zu öffnen und deine Antworten sicher zu speichern.</p></noscript>';
        $body .= '<script nonce="'.self::e($nonce).'">'.file_get_contents(__DIR__.'/coach.js').'</script>';
        $this->page('Trainerinterview', $body);
    }

    private function coachForm(array $session): string
    {
        $html = '<form id="interview-form" hidden><section aria-labelledby="profile-notice">'
            .'<h2 id="profile-notice">Dein Trainerprofil</h2>'
            .'<p>Mit deinen Antworten erstellt Pierre dein Trainerprofil für die Website der PK Hockey Academy. Du entscheidest, welche freiwilligen Fragen du beantwortest und ob du ein Foto hochlädst. Kontaktdaten für Rückfragen bleiben intern.</p>'
            .'<p>Dein Einladungslink und ein nicht abgeschickter Entwurf sind ab Ausstellung zehn Tage gültig. Pierre löscht die vollständigen Antworten und die interne Fotokopie, sobald er sie für dein Profil nicht mehr benötigt.</p>'
            .'</section>'
            .'<input type="hidden" name="interview" value="'.self::e($session['id']).'">'
            .'<input type="hidden" name="permissionVersion" value="'.Interviews::PERMISSION_VERSION.'">'
            .'<input type="hidden" name="revision" value="'.self::e($session['revision']).'">'
            .'<label class="check"><input type="checkbox" id="voice-opt-in"> Optionale Spracheingabe aktivieren. Je nach Browser kann Audio an dessen Spracherkennungsdienst übertragen werden.</label>'
            .'<p id="voice-status" role="status"></p>';
        foreach ($this->questions as $question) {
            $id = self::e($question['id']);
            $entry = $session['answers'][$question['id']] ?? [];
            $prompt = self::e($question['question']);
            $html .= '<fieldset><legend>'.$prompt.'</legend>'
                .'<label>Antwort<textarea maxlength="3000" name="answers['.$id.'][answer]" data-answer '
                .($question['required'] ? 'required' : '').'>'.self::e($entry['answer'] ?? '').'</textarea></label>'
                .'<button type="button" data-read>Frage vorlesen</button> <button type="button" data-dictate disabled>Antwort sprechen</button>';
            if (is_string($question['followUp'] ?? null)) {
                $html .= '<details'.(!empty($entry['followUpAnswer']) ? ' open' : '').'><summary>Freiwillige Rückfrage</summary>'
                    .'<label>'.self::e($question['followUp']).'<textarea maxlength="3000" name="answers['.$id.'][followUpAnswer]">'.self::e($entry['followUpAnswer'] ?? '').'</textarea></label></details>';
            }
            $html .= '</fieldset>';
        }
        return $html.'<fieldset><legend>Foto und Veröffentlichung</legend>'
            .'<label>Trainerfoto (freiwillig, JPEG oder PNG bis 2 MB)<input type="file" name="photo" accept="image/jpeg,image/png"></label>'
            .'<p>Das Foto wird erst beim Absenden übertragen.</p>'
            .'<label class="check"><input type="checkbox" name="publishProfile"> Ich bin damit einverstanden, dass die PK Hockey Academy mein Trainerprofil auf ihrer Website veröffentlicht.</label>'
            .'<label class="check"><input type="checkbox" name="publishPhoto"> Ich bin damit einverstanden, dass die PK Hockey Academy mein hochgeladenes Foto für mein Trainerprofil auf ihrer Website verwendet.</label>'
            .'<p>Du kannst den Fragebogen auch ohne Zustimmung zur Veröffentlichung absenden. Deine Entscheidung hat keine Auswirkungen auf deine Zusammenarbeit mit der Academy. Du kannst deine Zustimmung jederzeit per E-Mail an info@pkhockeyacademy.de für die Zukunft widerrufen.</p></fieldset>'
            .'<p><a href="/datenschutz" target="_blank" rel="noopener">Datenschutzhinweise</a></p>'
            .'<button type="button" id="save-draft">Entwurf speichern</button> <button type="submit">Interview absenden</button></form>';
    }

    private function photo(): ?array
    {
        $file = $_FILES['photo'] ?? null;
        if (!$file || ($file['error'] ?? null) === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if (($file['error'] ?? null) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) > self::MAX_PHOTO
            || !is_string($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException();
        }
        $bytes = file_get_contents($file['tmp_name'], false, null, 0, self::MAX_PHOTO + 1);
        $image = is_string($bytes) ? @getimagesizefromstring($bytes) : false;
        if (!$image || strlen($bytes) > self::MAX_PHOTO || $image[0] < 1 || $image[1] < 1
            || $image[0] * $image[1] > 20_000_000 || !in_array($image['mime'], ['image/jpeg', 'image/png'], true)) {
            throw new \InvalidArgumentException();
        }
        return ['mime' => $image['mime'], 'data' => base64_encode($bytes)];
    }

    private function inbox(bool $post, int $now): void
    {
        $token = $this->cookie(self::STAFF_COOKIE);
        $this->staff->assertContract();
        $this->staff->requireAdmin($token, $now);
        $csrf = $this->staff->csrf($token);
        $id = $_GET['id'] ?? $_POST['id'] ?? '';
        if (!is_string($id) || ($id !== '' && !preg_match('/\A[a-f0-9]{32}\z/', $id))) {
            throw new \InvalidArgumentException();
        }
        $body = '<p class="screen-only"><a href="'.self::INBOX.'">Interviewübersicht</a> · <a href="/intern/anmeldungen">Zur Verwaltung</a></p>';
        if ($post) {
            $check = $_POST['csrf'] ?? '';
            $this->staff->checkCsrf($token, is_string($check) ? $check : '');
            switch ($_POST['action'] ?? '') {
                case 'issue':
                    $invite = $this->store->issue($now);
                    $link = $this->origin.self::COACH.'#einladung='.$invite['token'];
                    $body .= '<label>Persönlicher Link für WhatsApp<textarea readonly>'.self::e($link).'</textarea></label>'
                        .'<p>Der Link wird nur hier angezeigt. Verschicke ihn direkt an den Coach.</p><p>Referenz: '.self::e($invite['id']).'</p>';
                    break;
                case 'revoke':
                    $this->store->revoke($id);
                    break;
                case 'close':
                    $this->store->closeSubmission($id);
                    break;
                case 'alert':
                    $this->sendAlert($id, $now);
                    break;
                default:
                    throw new \InvalidArgumentException();
            }
        }
        if ($id !== '' && !$post) {
            $record = $this->store->readSubmission($id);
            $download = $_GET['download'] ?? '';
            if ($download === 'json' || $download === 'photo') {
                $this->download($download, $record);
                return;
            }
            $body .= $this->submission($id, $record, $csrf);
        } else {
            $offset = filter_var($_GET['offset'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100000]]);
            if ($offset === false) {
                throw new \InvalidArgumentException();
            }
            $body .= $this->staffForm($csrf, '', 'issue', 'Persönlichen Link erstellen');
            $rows = $this->store->listing($now, $offset);
            foreach ($rows as $row) {
                $ref = self::e($row['id']);
                $body .= '<section><h2>'.($row['submitted_at'] === null ? 'Offene Einladung' : '<a href="'.self::INBOX.'?id='.$ref.'">Abgeschlossenes Interview</a>').'</h2>'
                    .'<p>Referenz: '.$ref.'</p>'
                    .($row['submitted_at'] === null
                        ? $this->staffForm($csrf, $ref, 'revoke', 'Einladung widerrufen')
                        : '<p>'.($row['alerted_at'] === null ? 'E-Mail noch nicht bestätigt' : 'E-Mail an Maildienst übergeben').'</p>')
                    .'</section>';
            }
            if ($offset > 0) {
                $body .= '<a href="'.self::INBOX.'?offset='.max(0, $offset - 50).'">Vorherige Seite</a> ';
            }
            if (count($rows) === 50) {
                $body .= '<a href="'.self::INBOX.'?offset='.($offset + 50).'">Weitere Interviews</a>';
            }
        }
        $this->page('Trainerinterviews verwalten', $body);
    }

    private function submission(string $id, array $record, string $csrf): string
    {
        $base = self::INBOX.'?id='.self::e($id);
        $body = '<h1 class="print-only" style="display:none">Trainerinterview · intern</h1><p>Profilfreigabe: '.($record['publishProfile'] ? 'Ja' : 'Nein').'<br>Fotofreigabe: '
            .($record['publishPhoto'] ? 'Ja' : 'Nein').'</p><p class="screen-only"><a href="'.$base.'&amp;download=json">Internen JSON-Export herunterladen</a> · PDF über die Druckfunktion des Browsers speichern</p>';
        if ($record['closed'] ?? false) {
            return $body.'<p>Bearbeitung abgeschlossen. Gespeicherter Nachweis für '.self::e($record['name']).'.</p>';
        }
        $answers = $record['answers'];
        if ($record['publishProfile']) {
            $body .= '<section class="screen-only"><h2>Vorausgefüllter Profilentwurf</h2><p>Hier kannst du den Text zum Kopieren bearbeiten. Änderungen werden in dieser Ansicht nicht gespeichert.</p>';
            foreach (['name' => 'Name', 'role' => 'Rolle', 'intro' => 'Biografie'] as $field => $label) {
                $body .= '<label for="profile-'.$field.'">'.$label.'</label><textarea id="profile-'.$field.'">'.self::e($answers[$field]['answer'] ?? '').'</textarea>';
            }
            $body .= '</section>';
        }
        if ($record['publishProfile']) {
            $topics = [
                'start' => 'Einstieg in den Hockeysport', 'teams' => 'Stationen und Vereine',
                'highlights' => 'Ligen und Erfolge', 'experience' => 'Erfahrung und Qualifikationen',
                'focus' => 'Trainingsschwerpunkte', 'ages' => 'Alters- und Leistungsgruppen',
                'philosophy' => 'Trainingsphilosophie', 'kids' => 'Arbeit mit Kindern', 'stats' => 'Profilquelle',
            ];
            $body .= '<section class="screen-only"><h2>Material für die redaktionelle Prüfung</h2>';
            foreach ($topics as $field => $label) {
                $entry = $answers[$field] ?? [];
                if (!empty($entry['answer'])) {
                    $body .= '<h3>'.$label.'</h3><p>'.self::e($entry['answer']).'</p>';
                    if (!empty($entry['followUpAnswer'])) {
                        $body .= '<p>'.self::e($entry['followUpAnswer']).'</p>';
                    }
                }
            }
            $body .= '</section>';
        }
        $body .= '<section><h2>Vollständige interne Antworten</h2>';
        foreach ($this->questions as $question) {
            $entry = $answers[$question['id']] ?? [];
            $hasAnswer = trim($entry['answer'] ?? '') !== '' || trim($entry['followUpAnswer'] ?? '') !== '';
            $body .= '<div'.($hasAnswer ? '' : ' class="screen-only"').'><h3>'.self::e($question['label']).'</h3><p>'.self::e($entry['answer'] ?? '').'</p>';
            if (!empty($entry['followUpAnswer'])) {
                $body .= '<p>'.self::e($entry['followUpAnswer']).'</p>';
            }
            $body .= '</div>';
        }
        $body .= '</section>';
        if ($record['photo']) {
            $body .= '<p class="screen-only"><a href="'.$base.'&amp;download=photo">Internes Trainerfoto herunterladen</a></p>';
        }
        return $body.$this->staffForm($csrf, $id, 'alert', 'Benachrichtigung erneut prüfen')
            .'<details class="screen-only"><summary>Interviewbearbeitung abschließen</summary><p>Dadurch werden Rohantworten und das interne Foto gelöscht. Der Freigabenachweis bleibt erhalten.</p>'
            .$this->staffForm($csrf, $id, 'close', 'Rohdaten löschen und abschließen').'</details>';
    }

    private function download(string $type, array $record): void
    {
        if ($type === 'json') {
            unset($record['photo']);
            header('Content-Type: application/json; charset=utf-8');
            header('Content-Disposition: attachment; filename="trainerinterview-intern.json"');
            echo json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            return;
        }
        $mime = $record['photo']['mime'] ?? '';
        $suffix = ['image/jpeg' => 'jpg', 'image/png' => 'png'][$mime] ?? null;
        if (!$suffix) {
            throw new Unavailable();
        }
        header('Content-Type: '.$mime);
        header('Content-Disposition: attachment; filename="trainerfoto-intern.'.$suffix.'"');
        echo base64_decode($record['photo']['data'], true);
    }

    private function sendAlert(string $id, int $now): void
    {
        $this->store->deliverAlert($id, $now, $this->notify);
    }

    private function staffForm(string $csrf, string $id, string $action, string $label): string
    {
        return '<form method="post" action="'.self::INBOX.'"><input type="hidden" name="csrf" value="'.self::e($csrf).'">'
            .'<input type="hidden" name="id" value="'.self::e($id).'"><button name="action" value="'.$action.'">'.$label.'</button></form>';
    }

    private function cookie(string $name): string
    {
        $value = $_COOKIE[$name] ?? '';
        return is_string($value) ? $value : '';
    }

    private function failure(string $message): void
    {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => $message], JSON_THROW_ON_ERROR);
    }

    private static function e(mixed $text): string
    {
        return htmlspecialchars((string)$text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function page(string $title, string $body): void
    {
        echo '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            .'<title>'.self::e($title).' · PK Hockey Academy</title><style>'
            .'body{margin:0;background:#101d2e;color:#101d2e;font:1rem/1.5 system-ui}main{box-sizing:border-box;max-width:56rem;margin:0 auto;padding:clamp(1rem,4vw,3rem);background:#f4f8fc;min-height:100vh}h1,h2,h3{line-height:1.2}a{color:#005a9d}fieldset,section{margin:1.25rem 0;padding:1rem;border:1px solid #b8cedf;min-width:0}legend{font-weight:700}label{display:block;margin:.6rem 0}textarea{display:block;box-sizing:border-box;width:100%;min-height:5rem;font:inherit;padding:.5rem}button{font:inherit;padding:.6rem 1rem;margin:.25rem 0}details{padding:.5rem 0}summary{cursor:pointer}p{overflow-wrap:anywhere;white-space:pre-wrap}:focus-visible{outline:3px solid #087ed5;outline-offset:3px}@media print{body,main{background:white;color:black}main{padding:0}button,form,nav,summary,textarea,.screen-only{display:none}.print-only{display:block!important}main>h1:not(.print-only){display:none}h2,h3{break-after:avoid}section{border:0;padding:0}}</style>'
            .'<main><header>PK HOCKEY ACADEMY</header><h1>'.self::e($title).'</h1>'.$body.'</main></html>';
    }
}
