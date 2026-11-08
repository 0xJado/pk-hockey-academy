import type {APIRoute,GetStaticPaths} from 'astro';
import {getMediaKitDownloads} from '../../../lib/media-kit-source.ts';
import {fetchReleaseDownload,stratoDownloadPath} from '../../../lib/strato-downloads.ts';
import type {MediaKitDownload} from '../../../types/media-kit.ts';

export const prerender=true;
export const getStaticPaths: GetStaticPaths=async()=>{
  if(import.meta.env.DEPLOY_TARGET!=='strato')return [];
  return (await getMediaKitDownloads()).map(asset=>({params:{file:stratoDownloadPath(asset).split('/').at(-1)},props:{asset}}));
};
export const GET: APIRoute=async({props})=>{
  const asset=props.asset as MediaKitDownload;
  const {bytes,type}=await fetchReleaseDownload(asset);
  return new Response(bytes,{headers:{'Content-Type':type,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(asset.downloadName)}`,'X-Content-Type-Options':'nosniff'}});
};
