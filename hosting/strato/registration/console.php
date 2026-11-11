<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
ini_set('display_errors','0'); ini_set('log_errors','0');
foreach (['Policy','Intake','Sessions','Config'] as $name) require __DIR__.'/'.$name.'.php';
try {
    [$config,$intake] = \PK\Registration\Config::load(getenv('PK_INTAKE_CONFIG') ?: '',getenv('PK_PUBLIC_ROOT') ?: '',true);
    $command=$argv[1] ?? '';
    if ($command==='migrate') { $intake->migrate(); echo "Intake schema ready; activation gates unchanged.\n"; }
    elseif ($command==='pause') { $intake->pause(true); echo "Intake paused; old request tokens invalidated.\n"; }
    elseif ($command==='retention') echo json_encode($intake->retention(time()),JSON_THROW_ON_ERROR)."\n";
    elseif ($command==='reconcile') echo json_encode(['state'=>$intake->reconcile($argv[2] ?? '')],JSON_THROW_ON_ERROR)."\n";
    else throw new \RuntimeException(); // No activation command supplied before accepted #12–#15 gates.
} catch (\Throwable) { fwrite(STDERR,"Intake operation failed; inspect private state without logging credentials or submitted values.\n"); exit(1); }
