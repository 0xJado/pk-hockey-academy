import {useEffect} from 'react';
import {useClient, type LayoutProps} from 'sanity';
import {getPhpTrainerPreviewResolver} from '../lib/presentation';
import {createPreviewRenewalHandler} from '../lib/preview-renewal';

export function PreviewLayout(props: LayoutProps) {
  const client=useClient({apiVersion:'2025-02-19'});
  useEffect(()=>{
    if(process.env.SANITY_STUDIO_PREVIEW_TRANSPORT!=='php-fragment')return;
    const origin=process.env.SANITY_STUDIO_PREVIEW_URL;
    if(!origin)return;
    let active=true;
    const resolve=getPhpTrainerPreviewResolver(origin);
    const handler=createPreviewRenewalHandler({
      origin,
      active:()=>active,
      frames:()=>Array.from(document.querySelectorAll('iframe')).filter(frame=>{
        try{return new URL(frame.src,location.href).origin===origin;}catch{return false;}
      }).map(frame=>frame.contentWindow),
      createSecret:async()=>{
        const url=new URL(await resolve({client,previewUrlSecret:'',studioPreviewPerspective:'drafts'}));
        const secret=new URLSearchParams(url.hash.slice(1)).get('sanity-preview-secret');
        if(!secret)throw Error('Preview credential unavailable');
        return secret;
      },
    });
    const listener=(event:MessageEvent)=>{void handler(event);};
    window.addEventListener('message',listener);
    return ()=>{active=false;window.removeEventListener('message',listener);};
  },[client]);
  return props.renderDefault(props);
}
