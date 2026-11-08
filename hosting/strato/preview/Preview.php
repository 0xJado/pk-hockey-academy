<?php
declare(strict_types=1);

namespace PK\Preview;

const COOKIE = 'pk-strato-editor-preview';
const PATH = '/redaktion/trainerpool';
const LIFETIME = 3600;
const SECRET_QUERY = '{"private": *[_type == "sanity.previewUrlSecret" && secret == $secret && dateTime(_updatedAt) > dateTime(now()) - 3600][0]{_id,_updatedAt,secret,studioUrl}, "public": *[_id == "sanity-preview-url-secret.share-access" && _type == "sanity.previewUrlShareAccess" && secret == $secret][0]{secret,studioUrl}}';
const TRAINER_QUERY = '*[_type == "trainer" && (!defined($id) || _id == $id)] | order(displayOrder asc, _id asc)[0...200]{_id,_type,name,role,biography,verifiedBackground,qualifications,specialties,displayOrder,active,visibility,contentApproved,playingYears,coachingYears,highestDivision,notableTeams,playerGallery[]{alt,credit,caption,asset->{url,mimeType,size,metadata{dimensions{width,height}}}},portrait{alt,credit,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}}';

function origin(string $url): string {
    $parts = parse_url($url);
    if (!$parts || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])
        || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])
        || !preg_match('/\A[a-z0-9.-]+\z/i', $parts['host']) || preg_match('/[\r\n\\\\]/', $url)) throw new \RuntimeException('Invalid preview origin');
    return 'https://' . strtolower($parts['host']);
}

function validateConfig(array $config): array {
    foreach (['projectId','dataset','readToken','sessionKey','studioUrl','siteOrigin'] as $key)
        if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') throw new \RuntimeException('Preview configuration unavailable');
    if (!preg_match('/\A[a-z0-9]+\z/', $config['projectId']) || !preg_match('/\A[a-z0-9_-]+\z/', $config['dataset'])
        || strlen($config['sessionKey']) < 32 || preg_match('/[\r\n]/', $config['readToken'])) throw new \RuntimeException('Invalid preview configuration');
    $config['studioOrigin'] = origin($config['studioUrl']);
    if (origin($config['siteOrigin']) !== $config['siteOrigin']) throw new \RuntimeException('Invalid site origin');
    return $config;
}

function loadConfig(string $publicRoot, ?string $configurationFile = null): array {
    $root = realpath($publicRoot);
    $file = realpath($configurationFile ?? (string) getenv('PK_PREVIEW_CONFIG_FILE'));
    if (!$root || !$file || !is_file($file)) throw new \RuntimeException('Preview configuration unavailable');
    $normalize = static fn(string $path): string => PHP_OS_FAMILY === 'Windows' ? strtolower(str_replace('\\','/',$path)) : $path;
    if (str_starts_with($normalize($file), rtrim($normalize($root),'/') . '/')) throw new \RuntimeException('Configuration must stay outside public files');
    $bytes = file_get_contents($file, false, null, 0, 16385);
    if ($bytes === false || strlen($bytes) > 16384) throw new \RuntimeException('Invalid preview configuration');
    return validateConfig(json_decode($bytes, true, 8, JSON_THROW_ON_ERROR));
}

function locateConfig(string $entryDirectory): array {
    $directory=realpath($entryDirectory);
    for($level=0;$directory && $level<6;$level++) {
        $locator=$directory . '/.pk-preview-location.json';
        if(is_file($locator)) {
            $bytes=file_get_contents($locator,false,null,0,4097);
            if($bytes===false || strlen($bytes)>4096)throw new \RuntimeException('Invalid private configuration locator');
            $location=json_decode($bytes,true,8,JSON_THROW_ON_ERROR);
            if(!is_array($location)||!is_string($location['publicRoot']??null)||!is_string($location['configFile']??null)
                || realpath($location['publicRoot'])!==$directory)throw new \RuntimeException('Invalid private configuration locator');
            return [$directory,$location['configFile']];
        }
        $parent=dirname($directory);if($parent===$directory)break;$directory=$parent;
    }
    throw new \RuntimeException('Private preview is not provisioned');
}

function signSession(string $key, int $now): string {
    $claim = ($now + LIFETIME) . '.' . bin2hex(random_bytes(24));
    return $claim . '.' . hash_hmac('sha256', 'pk-strato-preview:' . $claim, $key);
}

function verifySession(?string $value, string $key, int $now): bool {
    if (!$value || !preg_match('/\A([0-9]{10})\.([a-f0-9]{48})\.([a-f0-9]{64})\z/', $value, $parts)) return false;
    $remaining = (int) $parts[1] - $now;
    return $remaining > 0 && $remaining <= LIFETIME
        && hash_equals(hash_hmac('sha256', 'pk-strato-preview:' . $parts[1] . '.' . $parts[2], $key), $parts[3]);
}

function documentId(mixed $value): ?string {
    return is_string($value) && preg_match('/\A[a-zA-Z0-9_.-]{1,200}\z/', $value) ? preg_replace('/\Adrafts\./','',$value) : null;
}

function safeRedirect(mixed $value, mixed $perspective = null): string {
    $result = [];
    if (is_string($value) && !preg_match('/[\x00-\x20\\\\]/', $value)) {
        $parts = parse_url($value);
        if ($parts && ($parts['path'] ?? '') === PATH && !isset($parts['scheme']) && !isset($parts['host'])) {
            parse_str($parts['query'] ?? '', $query);
            if ($id = documentId($query['id'] ?? null)) $result['id'] = $id;
            if (($query['perspective'] ?? null) === 'published') $result['perspective'] = 'published';
        }
    }
    if ($perspective === 'published') $result['perspective'] = 'published';
    return PATH . ($result ? '?' . http_build_query($result, '', '&', PHP_QUERY_RFC3986) : '');
}

function response(int $status, mixed $body, array $config, array $extra = []): array {
    return ['status'=>$status,'headers'=>$extra + [
        'Content-Type'=>'application/json; charset=utf-8',
        'Cache-Control'=>'private, no-store, max-age=0',
        'X-Robots-Tag'=>'noindex, nofollow, noarchive',
        'Referrer-Policy'=>'no-referrer',
        'X-Content-Type-Options'=>'nosniff',
        'Cross-Origin-Resource-Policy'=>'same-origin',
        'Content-Security-Policy'=>"default-src 'none'; frame-ancestors 'self' " . $config['studioOrigin'] . ' https://www.sanity.io',
    ],'body'=>$body];
}

// POST keeps the preview secret and query parameters out of upstream URL logs.
// No redirects, configurable hosts, browser tokens or CDN draft requests.
function query(array $config, string $groq, array $params, string $perspective): mixed {
    if (!in_array($perspective, ['raw','drafts','published'], true)) throw new \RuntimeException('Invalid perspective');
    $url = 'https://' . $config['projectId'] . '.api.sanity.io/v2025-02-19/data/query/' . $config['dataset'] . '?perspective=' . $perspective;
    $context = stream_context_create(['http'=>[
        'method'=>'POST','timeout'=>15,'follow_location'=>0,'max_redirects'=>0,'ignore_errors'=>true,
        'header'=>"Content-Type: application/json\r\nAccept: application/json\r\nCache-Control: no-store\r\nAuthorization: Bearer " . $config['readToken'] . "\r\n",
        'content'=>json_encode(['query'=>$groq,'params'=>(object) $params,'returnQuery'=>false], JSON_THROW_ON_ERROR),
    ],'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
    $handle = @fopen($url, 'rb', false, $context);
    if (!$handle) throw new \RuntimeException('Preview source unavailable');
    try {
        $meta = stream_get_meta_data($handle);
        $status = $meta['wrapper_data'][0] ?? '';
        if (!preg_match('/\AHTTP\/\S+ 200(?: |$)/', $status)) throw new \RuntimeException('Preview source unavailable');
        $bytes = stream_get_contents($handle, 2 * 1024 * 1024 + 1);
        if ($bytes === false || strlen($bytes) > 2 * 1024 * 1024) throw new \RuntimeException('Preview source exceeds bounds');
        $data = json_decode($bytes, true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($data) || !array_key_exists('result',$data)) throw new \RuntimeException('Invalid preview source');
        return $data['result'];
    } finally {fclose($handle);}
}

function validSecret(mixed $result, string $secret, string $studioOrigin, int $now): bool {
    if (!is_array($result)) return false;
    foreach (['private','public'] as $type) {
        $record = $result[$type] ?? null;
        if (!is_array($record) || !is_string($record['secret'] ?? null) || !hash_equals($record['secret'],$secret)) continue;
        if ($type === 'private') {
            $updated = is_string($record['_updatedAt'] ?? null) ? strtotime($record['_updatedAt']) : false;
            if (empty($record['_id']) || !$updated || $updated <= $now - LIFETIME || $updated > $now + 60) continue;
        }
        try {if (origin((string) ($record['studioUrl'] ?? '')) === $studioOrigin) return true;} catch (\Throwable) {}
    }
    return false;
}

// Pure request boundary, also exercised with an isolated synthetic Sanity transport.
function handle(array $config, array $request, ?callable $transport = null, ?int $now = null): array {
    $config = validateConfig($config);$now ??= time();
    $transport ??= static fn($groq,$params,$perspective) => query($config,$groq,$params,$perspective);
    $method = $request['method'] ?? '';$path = $request['path'] ?? '';
    $query = $request['query'] ?? [];$headers = array_change_key_case($request['headers'] ?? [], CASE_LOWER);
    $fail = static fn(int $status,string $code) => response($status,['code'=>$code],$config);
    $expectedMethod = $path === '/api/preview/enable' ? 'POST' : 'GET';
    if ($method !== $expectedMethod) return response(405,['code'=>'method_not_allowed'],$config,['Allow'=>$expectedMethod]);
    if (isset($headers['origin']) && !in_array($headers['origin'],[$config['siteOrigin'],$config['studioOrigin'],'https://www.sanity.io'],true)) return $fail(403,'origin_denied');
    if ($path === '/api/preview/enable') {
        if (($headers['origin'] ?? '') !== $config['siteOrigin'] || ($headers['sec-fetch-site'] ?? '') === 'cross-site') return $fail(403,'origin_denied');
        // Native Studio secrets arrive through a fragment-only handshake page,
        // then a same-origin POST. Never accept bearer secrets in URL parameters.
        if (isset($query['sanity-preview-secret'])) return $fail(400,'secret_in_url_denied');
        $body = $request['body'] ?? [];
        $secret = $body['sanity-preview-secret'] ?? null;
        if (!is_string($secret) || !preg_match('/\A[\x21-\x7E]{1,256}\z/', $secret)) return $fail(401,'invalid_preview_link');
        try {
            $valid = validSecret($transport(SECRET_QUERY,['secret'=>$secret],'raw'),$secret,$config['studioOrigin'],$now);
        } catch (\Throwable) {return $fail(503,'preview_unavailable');}
        if (!$valid) return $fail(401,'invalid_preview_link');
        return response(200,['redirectTo'=>safeRedirect($body['sanity-preview-pathname'] ?? null,$body['sanity-preview-perspective'] ?? null)],$config,[
            'Set-Cookie'=>COOKIE . '=' . signSession($config['sessionKey'],$now) . '; Path=/redaktion; Max-Age=3600; HttpOnly; Secure; SameSite=None; Partitioned',
        ]);
    }
    if (!in_array($path,[PATH,'/redaktion/daten','/redaktion/abmelden'],true)) return $fail(404,'not_found');
    // Data is read only by the same-origin iframe, not by Studio or arbitrary origins.
    if ($path === '/redaktion/daten' && (($headers['sec-fetch-site'] ?? '') === 'cross-site'
        || (isset($headers['origin']) && $headers['origin'] !== $config['siteOrigin']))) return $fail(403,'origin_denied');
    if ($path === '/redaktion/abmelden') return response(303,null,$config,[
        'Location'=>'/trainerpool','Set-Cookie'=>COOKIE . '=; Path=/redaktion; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned',
    ]);
    $cookie = $request['cookies'][COOKIE] ?? null;
    if (!is_string($cookie) || !verifySession($cookie,$config['sessionKey'],$now)) return $fail(401,'preview_login_required');
    if ($path === PATH) return response(200,['authenticated'=>true],$config);
    $id = documentId($query['id'] ?? null);
    if (isset($query['id']) && !$id) return $fail(400,'invalid_document');
    $perspective = ($query['perspective'] ?? null) === 'published' ? 'published' : 'drafts';
    try {
        $result = $transport(TRAINER_QUERY,['id'=>$id],$perspective);
        if (!is_array($result) || !array_is_list($result) || count($result)>200) throw new \RuntimeException('Invalid profiles');
        return response(200,['documents'=>$result,'projectId'=>$config['projectId'],'dataset'=>$config['dataset'],'studioUrl'=>$config['studioUrl'],'perspective'=>$perspective,'expiresAt'=>(int) explode('.', $request['cookies'][COOKIE])[0]],$config);
    } catch (\Throwable) {return $fail(503,'preview_unavailable');}
}

function httpRequest(): array {
    $request = ['method'=>$_SERVER['REQUEST_METHOD'] ?? '', 'path'=>parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH),
        'query'=>$_GET,'cookies'=>$_COOKIE,'headers'=>function_exists('getallheaders') ? getallheaders() : []];
    if ($request['method'] === 'POST' && $request['path'] === '/api/preview/enable') {
        if (strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json'
            || (int) ($_SERVER['CONTENT_LENGTH'] ?? 0)>2048) throw new \InvalidArgumentException('Invalid request');
        $bytes = file_get_contents('php://input',false,null,0,2049);
        if ($bytes===false || strlen($bytes)>2048) throw new \InvalidArgumentException('Invalid request');
        try {$request['body']=json_decode($bytes,true,8,JSON_THROW_ON_ERROR);}catch (\Throwable) {throw new \InvalidArgumentException('Invalid request');}
        if (!is_array($request['body'])) throw new \InvalidArgumentException('Invalid request');
    }
    return $request;
}

function dispatch(array $config,array $request,?callable $transport=null,?int $now=null): array {
    $config=validateConfig($config);
    $connect=($request['path'] ?? '')==='/redaktion/verbinden' && ($request['method'] ?? '')==='GET';
    $result=$connect ? response(200,null,$config) : handle($config,$request,$transport,$now);
    if ($connect || (($request['path'] ?? '')===PATH && $result['status']===200)) {
        $result['template']=$connect ? 'preview-connect.html' : 'preview-shell.html';
        $result['headers']['Content-Type']='text/html; charset=utf-8';
        $result['headers']['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.sanity.io data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self' " . $config['studioOrigin'] . ' https://www.sanity.io';
    }
    return $result;
}

function emit(array $result,string $directory): void {
    if (isset($result['template']) && (!in_array($result['template'],['preview-connect.html','preview-shell.html'],true)
        || !is_file($directory . '/' . $result['template']))) throw new \RuntimeException('Preview template unavailable');
    http_response_code($result['status']);
    foreach ($result['headers'] as $key=>$value) header($key . ': ' . $value);
    if (isset($result['template'])) readfile($directory . '/' . $result['template']);
    elseif ($result['body']!==null) echo json_encode($result['body'],JSON_THROW_ON_ERROR|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT);
}
