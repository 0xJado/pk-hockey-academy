<?php
declare(strict_types=1);

// Inactive for every method. Never read php://input, $_POST, or connect to storage.
http_response_code(503);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
echo json_encode([
    'code' => 'inactive',
    'message' => 'Die Onlineanmeldung ist noch nicht freigegeben. Es wurden keine Angaben angenommen.',
], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
