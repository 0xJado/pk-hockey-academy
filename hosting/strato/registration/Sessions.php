<?php
declare(strict_types=1);
namespace PK\Registration;

final class Sessions
{
    public function __construct(private array $config) {}
    public function lookup(string $id, int $now): ?array
    {
        if (($this->config['enabled'] ?? false)!==true) throw new Failure(503,'sessions-unavailable');
        if (!preg_match('/\A[a-z0-9]+\z/',$this->config['projectId'] ?? '') || !preg_match('/\A[a-z0-9_-]+\z/',$this->config['dataset'] ?? '')
            || preg_match('/[\r\n]/',$this->config['readToken'] ?? '')) throw new Failure(503,'sessions-unavailable');
        // Only the published session ID is sent to Sanity. No registration fields, notes or contact values.
        $query = '*[_type == "trainingSession" && _id == $id && visibility == "public" && contentApproved == true][0]{_id,visibility,contentApproved,isDemo,title,group,startAt,endAt,status,availableSpots,"venue":venue->{_id,visibility,contentApproved,status,city,details}}';
        $url = 'https://'.$this->config['projectId'].'.api.sanity.io/v2026-10-01/data/query/'.$this->config['dataset'].'?perspective=published';
        $headers = "Content-Type: application/json\r\nAccept: application/json\r\nCache-Control: no-store\r\n";
        if (($this->config['readToken'] ?? '') !== '') $headers .= 'Authorization: Bearer '.$this->config['readToken']."\r\n";
        $context = stream_context_create(['http'=>['method'=>'POST','timeout'=>5,'follow_location'=>0,'max_redirects'=>0,'ignore_errors'=>true,'header'=>$headers,
            'content'=>json_encode(['query'=>$query,'params'=>['id'=>$id],'returnQuery'=>false],JSON_THROW_ON_ERROR)],'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true]]);
        $start = hrtime(true); $handle = @fopen($url,'rb',false,$context);
        if (!$handle) throw new Failure(503,'sessions-unavailable');
        try {
            $meta = stream_get_meta_data($handle);
            if (!preg_match('/\AHTTP\/\S+ 200(?: |$)/',$meta['wrapper_data'][0] ?? '')) throw new \RuntimeException();
            $bytes = stream_get_contents($handle,65537); $meta = stream_get_meta_data($handle);
            if ($bytes === false || strlen($bytes)>65536 || ($meta['timed_out'] ?? false) || hrtime(true)-$start>5_000_000_000) throw new \RuntimeException();
            $response = json_decode($bytes,true,12,JSON_THROW_ON_ERROR);
            if (!is_array($response) || !array_key_exists('result',$response)) throw new \RuntimeException();
            return self::requestable($response['result'],$id,$now) ? ['id'=>$id,'requestable'=>true] : null;
        } catch (\Throwable) { throw new Failure(503,'sessions-unavailable'); }
        finally { fclose($handle); }
    }
    public static function requestable(mixed $row, string $id, int $now): bool
    {
        $published = static fn($r) => is_array($r) && is_string($r['_id'] ?? null) && !preg_match('/\A(?:drafts|versions)\./',$r['_id']) && ($r['visibility'] ?? '')==='public' && ($r['contentApproved'] ?? false)===true;
        if (!$published($row) || $row['_id']!==$id || ($row['isDemo'] ?? null)!==false || ($row['status'] ?? '')!=='open'
            || !$published($row['venue'] ?? null) || ($row['venue']['status'] ?? '')!=='active_city') return false;
        foreach (['title','group'] as $name) if (!is_string($row[$name] ?? null) || trim($row[$name])==='' || strlen($row[$name])>640) return false;
        foreach (['city','details'] as $name) if (!is_string($row['venue'][$name] ?? null) || trim($row['venue'][$name])==='') return false;
        $times = [];
        foreach (['startAt','endAt'] as $name) {
            $value = $row[$name] ?? null;
            if (!is_string($value) || !preg_match('/\A(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)\z/',$value,$parts)
                || !checkdate((int)$parts[2],(int)$parts[3],(int)$parts[1])) return false;
            $times[] = strtotime($value);
        }
        $spots = $row['availableSpots'] ?? null;
        return $times[0]!==false && $times[1]!==false && $times[0]>$now && $times[1]>$times[0] && ($spots===null || (is_int($spots) && $spots>0));
    }
}
