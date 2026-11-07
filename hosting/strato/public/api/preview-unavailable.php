<?php
declare(strict_types=1);

// Full private Visual Editing still runs on the protected review host.
http_response_code(503);
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
echo 'Die private Website-Vorschau ist auf diesem Host noch nicht eingerichtet. Bitte die bestehende geschützte Vorschau verwenden.';
