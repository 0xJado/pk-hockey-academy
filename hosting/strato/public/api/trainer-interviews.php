<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '0');

try {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (!in_array($path, ['/coach/interview', '/intern/trainerinterviews'], true)) {
        http_response_code(404);
        return;
    }
    $directory = realpath(__DIR__);
    $location = null;
    for ($level = 0; $directory && $level < 6; $level++) {
        $locator = $directory.'/.pk-trainer-interview-location.json';
        if (is_file($locator)) {
            if (is_link($locator)) {
                throw new RuntimeException();
            }
            $location = json_decode(file_get_contents($locator, false, null, 0, 4097), true, 6, JSON_THROW_ON_ERROR);
            if (($location['publicRoot'] ?? '') !== $directory) {
                throw new RuntimeException();
            }
            break;
        }
        $directory = dirname($directory);
    }
    $file = $location['runtimeFile'] ?? '';
    $runtime = realpath($file);
    $normalize = static fn (string $value): string => PHP_OS_FAMILY === 'Windows'
        ? strtolower(str_replace('\\', '/', $value)) : $value;
    if (!$runtime || is_link($file) || $normalize($runtime) !== $normalize($file)
        || str_starts_with($normalize($runtime), rtrim($normalize($directory), '/').'/')) {
        throw new RuntimeException();
    }
    require $runtime;
    \PK\Interview\Runtime::serve($path, $directory, $location['configFile']);
} catch (Throwable) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Robots-Tag: noindex, nofollow');
    header('Referrer-Policy: no-referrer');
    echo 'Das Trainerinterview ist derzeit nicht verfügbar.';
}
