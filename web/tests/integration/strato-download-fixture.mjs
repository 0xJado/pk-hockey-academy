import './sanity-fixture.mjs';
const inherited=globalThis.fetch;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4S8AAAAASUVORK5CYII=','base64');
const assetUrl='https://cdn.sanity.io/files/cmsqa123/qa/strato-fixture.png';
globalThis.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.origin==='https://cdn.sanity.io'&&url.pathname==='/files/cmsqa123/qa/strato-fixture.png')
    return new Response(options?.method==='HEAD'?null:png,{headers:{'content-type':'image/png'}});
  if(url.hostname==='cmsqa123.api.sanity.io'&&url.searchParams.get('query')?.includes('_type == "mediaKitDownload"'))
    return Response.json({result:process.env.PK_STRATO_QA_EMPTY==='true'?[]:[{
      _id:'strato-fixture',_type:'mediaKitDownload',title:'Technischer Downloadtest',description:'Isolierter Buildtest; kein Academy-Inhalt.',downloadName:'Test.png',displayOrder:0,visibility:'public',contentApproved:true,
      file:{asset:{url:assetUrl,mimeType:'image/png',extension:'png',size:process.env.PK_STRATO_QA_BAD_SIZE==='true'?png.length+1:png.length}}
    }]});
  return inherited(input,options);
};
