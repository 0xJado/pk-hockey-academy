import type {MediaKitDownload} from '../types/media-kit.ts';

// Bundled Astro assets already belong to the static release; only CMS files need copying.
export function isBundledDownload(asset: MediaKitDownload) {
  return /^\/_astro\/[A-Za-z0-9_.-]+\.(png|jpe?g|webp|pdf|zip)$/.test(asset.url);
}

export function stratoDownloadPath(asset: MediaKitDownload) {
  if(isBundledDownload(asset))return asset.url;
  const url=new URL(asset.url);
  const extension=url.pathname.split('.').at(-1);
  if(!/^[A-Za-z0-9_.-]{1,200}$/.test(asset.id)||!extension||!['png','jpg','jpeg','webp','pdf','zip'].includes(extension))
    throw new Error('Invalid release download path.');
  return `/downloads/medienkit/entry-${asset.id}.${extension}`;
}

// Build-time only: public CMS assets become release-owned files on STRATO.
// Withdrawals remove the site-owned URL without deleting shared CMS assets.
export async function fetchReleaseDownload(asset: MediaKitDownload,transport: typeof fetch=fetch) {
  const url=new URL(asset.url);
  if(url.origin!=='https://cdn.sanity.io'||url.username||url.password||url.hash||!/^\/files\/[a-z0-9]+\/[a-z0-9_-]+\/[A-Za-z0-9-]+\.(png|jpe?g|webp|pdf|zip)$/.test(url.pathname))
    throw new Error('Untrusted release download.');
  if(!Number.isSafeInteger(asset.sizeBytes)||asset.sizeBytes<=0||asset.sizeBytes>50*1024*1024)
    throw new Error('Invalid release download size.');
  const response=await transport(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(!response.ok||!response.body)throw new Error('Release download unavailable.');
  const expected: Record<string,string[]>={PNG:['image/png'],JPEG:['image/jpeg'],WebP:['image/webp'],PDF:['application/pdf'],ZIP:['application/zip','application/x-zip-compressed']};
  const type=response.headers.get('content-type')?.split(';')[0];
  if(!type||!expected[asset.format]?.includes(type))throw new Error('Release download type mismatch.');
  const reader=response.body.getReader(),chunks: Uint8Array[]=[];let length=0;
  try {
    while(true) {
      const {done,value}=await reader.read();if(done)break;
      length+=value.byteLength;
      if(length>asset.sizeBytes)throw new Error('Release download exceeds declared size.');
      chunks.push(value);
    }
  } finally {await reader.cancel();}
  if(length!==asset.sizeBytes)throw new Error('Incomplete release download.');
  const bytes=new Uint8Array(length);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return {bytes,type};
}
