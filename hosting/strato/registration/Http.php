<?php
declare(strict_types=1);
namespace PK\Registration;

final class Http
{
    public static function response(int $status, array $body): array
    {
        return ['status'=>$status,'headers'=>[
            'Content-Type'=>'application/json; charset=utf-8','Cache-Control'=>'private, no-store, max-age=0',
            'X-Robots-Tag'=>'noindex, nofollow, noarchive','X-Content-Type-Options'=>'nosniff','Referrer-Policy'=>'no-referrer',
            'Cross-Origin-Resource-Policy'=>'same-origin','Content-Security-Policy'=>"default-src 'none'; frame-ancestors 'none'",
        ]+($status===429?['Retry-After'=>'900']:[]) + ($status===405?['Allow'=>'POST']:[]),'body'=>$body];
    }
    /** Service/body callbacks are lazy: disabled, cross-origin and oversized requests never read participant bodies. */
    public static function handle(array $server, bool $enabled, \Closure $service, \Closure $readBody, ?int $now = null): array
    {
        $now ??= time(); $writing = false;
        try {
            if (!$enabled) throw new Failure(503,'inactive');
            if (($server['REQUEST_METHOD'] ?? '')!=='POST') throw new Failure(405,'method');
            if (($server['HTTPS'] ?? '')!=='on' || ($server['HTTP_ORIGIN'] ?? '')!=='https://pkhockeyacademy.de') throw new Failure(403,'origin');
            $uri = $server['REQUEST_URI'] ?? '';
            if (str_contains($uri,'?')) throw new Failure(400,'query');
            $tokenRequest = $uri==='/api/registration/token';
            if (!$tokenRequest && $uri!=='/api/registration') throw new Failure(404,'route');
            if (!preg_match('#\Aapplication/json(?:;\s*charset=utf-8)?\z#i',$server['CONTENT_TYPE'] ?? '')) throw new Failure(415,'content-type');
            $length = $server['CONTENT_LENGTH'] ?? '';
            if (!is_string($length) || !ctype_digit($length)) throw new Failure(411,'body-length');
            if ((int)$length>16384) throw new Failure(413,'body-limit');
            if (isset($server['HTTP_CONTENT_ENCODING']) || isset($server['CONTENT_ENCODING'])) throw new Failure(415,'content-encoding');
            $peer = $server['REMOTE_ADDR'] ?? '';
            $intake = $service(); $intake->attempt($peer,$now,$tokenRequest);
            $started = hrtime(true); $body = $readBody(16385);
            if (hrtime(true)-$started>3_000_000_000) throw new Failure(408,'body-timeout');
            if (!is_string($body) || strlen($body)!==(int)$length) throw new Failure(400,'body');
            if (strlen($body)>16384) throw new Failure(413,'body-limit');
            $input = Policy::json($body);
            if ($tokenRequest) {
                if ($input!==[]) throw new Failure(422,'unknown-fields');
                return self::response(200,['code'=>'request-token','token'=>$intake->ticket($now),'expiresIn'=>Intake::TICKET_SECONDS]);
            }
            $ticket = $server['HTTP_IDEMPOTENCY_KEY'] ?? '';
            if (!is_string($ticket) || strlen($ticket)>400) throw new Failure(400,'idempotency-key');
            $writing = true;
            $result = $intake->submit($ticket,$input,$peer,$now);
            return self::response($result['replayed']?200:201,['code'=>'received','reference'=>$result['reference'],
                'message'=>'Deine Trainingsanfrage wurde entgegengenommen. Die Academy prüft die Anfrage. Ein Trainingsplatz ist damit noch nicht bestätigt.']);
        } catch (Failure $error) {
            return self::response($error->status,['code'=>$error->reason]+($error->fields?['errors'=>$error->fields]:[]));
        } catch (\Throwable) {
            return self::response(503,['code'=>$writing?'outcome-unknown':'unavailable','message'=>$writing
                ?'Der Speicherstatus ist unklar. Bitte denselben Vorgang beibehalten und keine neue Anfrage beginnen. Bei Rückfragen kontaktiere die Academy.'
                :'Die Trainingsanfrage ist derzeit nicht verfügbar. Es wurde kein Erfolg bestätigt.']);
        }
    }
    public static function emit(array $response): void
    {
        http_response_code($response['status']); foreach ($response['headers'] as $name=>$value) header($name.': '.$value);
        echo json_encode($response['body'],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
}
