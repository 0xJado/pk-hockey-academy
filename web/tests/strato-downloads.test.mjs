import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stratoDownloadPath,fetchReleaseDownload} from '../src/lib/strato-downloads.ts';
const asset={id:'approved-test',url:'https://cdn.sanity.io/files/public123/production/abcd.pdf?dl=test.pdf',sizeBytes:4,format:'PDF',downloadName:'test.pdf'};
test('release downloads use stable website paths and fetch bounded approved bytes',async()=>{
  assert.equal(stratoDownloadPath(asset),'/downloads/medienkit/entry-approved-test.pdf');
  const result=await fetchReleaseDownload(asset,async(url,options)=>{
    assert.equal(new URL(url).origin,'https://cdn.sanity.io');
    assert.equal(options.redirect,'manual');return new Response('test',{headers:{'content-type':'application/pdf'}});
  });
  assert.equal(Buffer.from(result.bytes).toString(),'test');
});
test('download failures, redirects, wrong MIME, size mismatches and foreign URLs fail the build',async()=>{
  for(const response of [new Response(null,{status:302}),new Response('test',{headers:{'content-type':'text/html'}}),new Response('longer',{headers:{'content-type':'application/pdf'}}),new Response('x',{headers:{'content-type':'application/pdf'}})])
    await assert.rejects(fetchReleaseDownload(asset,async()=>response));
  await assert.rejects(fetchReleaseDownload({...asset,url:'https://foreign.example/file.pdf'}));
  assert.throws(()=>stratoDownloadPath({...asset,id:'../secret'}));
});
