<?php
declare(strict_types=1);
namespace PK\Staff;

/** Operator-only maintenance. Returns counts/status, never records, credentials or backup bytes. */
final class Maintenance
{
    public static function run(Staff $staff, \PK\Registration\Intake $intake, array $config, int $now): array
    {
        $staff->assertContract();
        $directory=realpath($config['backupDirectory'] ?? '');
        if (!$directory || !is_dir($directory) || is_link($config['backupDirectory']) || !is_file($config['journal']) || is_link($config['journal'])) throw new Rejected('Private maintenance state unavailable');
        $staffCounts=$staff->retention($now);$intakeCounts=$intake->retention($now);
        $key=base64_decode($config['keys']['backup'] ?? '',true);
        if ($key===false || strlen($key)!==32) throw new Rejected('Backup key unavailable');
        $day=gmdate('Ymd',$now);$name='pk-staff-'.$day.'-000000-'.substr(hash_hmac('sha256','daily-backup:'.$day,$key),0,16).'.enc';
        $file=$directory.'/'.$name;$created=false;
        if (is_link($file)) throw new Rejected('Private backup link refused');
        if (file_exists($file)) {
            if (!is_file($file) || filesize($file)>32*1024*1024) throw new Rejected('Existing backup invalid');
            $bytes=base64_decode(file_get_contents($file),true);
            if ($bytes===false || strlen($bytes)<40) throw new Rejected('Existing backup invalid');
            $plain=sodium_crypto_secretbox_open(substr($bytes,24),substr($bytes,0,24),$key);
            if ($plain===false) throw new Rejected('Existing backup authentication failed');
            $snapshot=json_decode($plain,true,32,JSON_THROW_ON_ERROR);
            if (($snapshot['schema'] ?? 0)!==Staff::VERSION || !is_int($snapshot['at'] ?? null) || $snapshot['at']>$now || gmdate('Ymd',$snapshot['at'])!==$day || !is_array($snapshot['requests'] ?? null)) throw new Rejected('Existing backup version/time invalid');
        } else {
            $bytes=$staff->backup($now);
            if (strlen($bytes)>32*1024*1024) throw new Rejected('Backup exceeds tested restore limit');
            $temporary=$file.'.'.bin2hex(random_bytes(8)).'.tmp';$handle=fopen($temporary,'x');
            if (!$handle) throw new Rejected('Backup write unavailable');
            try { if (!chmod($temporary,0600) || fwrite($handle,$bytes)!==strlen($bytes) || !fflush($handle)) throw new Rejected('Backup write failed'); }
            catch (\Throwable $error) { fclose($handle);@unlink($temporary);throw $error; }
            fclose($handle);
            if (file_exists($file) || !rename($temporary,$file)) { @unlink($temporary);throw new Rejected('Backup publication failed'); }
            $created=true;
        }
        $pruned=0;$files=glob($directory.'/pk-staff-*.enc');
        if ($files===false || count($files)>1000) throw new Rejected('Backup retention needs review');
        foreach ($files as $old) {
            if (!preg_match('/\Apk-staff-\d{8}-\d{6}-[a-f0-9]{16}\.enc\z/',basename($old))) continue;
            if (is_link($old)) throw new Rejected('Managed backup link refused');
            $modified=filemtime($old);if ($modified===false) throw new Rejected('Backup metadata unavailable');
            if ($modified<$now-35*86400) { if (!unlink($old)) throw new Rejected('Backup retention failed');++$pruned; }
        }
        return ['staff'=>$staffCounts,'intake'=>$intakeCounts,'dailyBackupCreated'=>$created,'existingDailyBackupVerified'=>!$created,'expiredBackupsRemoved'=>$pruned];
    }
}
