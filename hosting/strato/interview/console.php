<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli' || count($argv) !== 4) {
    exit(1);
}
require __DIR__.'/Runtime.php';
try {
    $public = realpath($argv[2]);
    if (!$public) {
        throw new RuntimeException();
    }
    $store = \PK\Interview\Runtime::store(\PK\Interview\Runtime::config($argv[3], $public, true));
    switch ($argv[1]) {
        case 'migrate':
            $store->migrate();
            echo "Interview schema ready.\n";
            break;
        case 'purge':
            echo json_encode(['expiredDraftsPurged' => $store->purgeExpiredDrafts(time())], JSON_THROW_ON_ERROR)."\n";
            break;
        default:
            exit(1);
    }
} catch (Throwable) {
    fwrite(STDERR, "Private trainer interview operation failed.\n");
    exit(1);
}
