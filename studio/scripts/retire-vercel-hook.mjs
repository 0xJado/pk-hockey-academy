// Disable only the superseded academy publishing hook; retain it for recovery.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {getStudioConfig} from '../config.ts';

try {
  const {projectId,dataset}=getStudioConfig();
  const require=createRequire(import.meta.url);
  const {getProjectCliClient}=await import(pathToFileURL(require.resolve('@sanity/cli-core')).href);
  const client=await getProjectCliClient({apiVersion:'2025-02-19',projectId,requireUser:true});
  const endpoint=`/hooks/projects/${projectId}`;
  const hooks=(await client.request({url:endpoint})).filter(h=>!h.deletedAt);
  const old=hooks.filter(h=>h.name==='PK Hockey Academy · Website' && h.dataset===dataset && new URL(h.url).origin==='https://api.vercel.com');
  const current=hooks.filter(h=>h.name==='PK Hockey Academy · STRATO' && h.dataset===dataset && h.url==='https://api.github.com/repos/0xJado/pk-hockey-academy/actions/workflows/strato-publish.yml/dispatches' && !h.isDisabled && !h.isDisabledByUser);
  if(old.length!==1 || current.length!==1)throw new Error('Hook inventory needs review');
  if(process.argv.includes('--apply')) {
    await client.request({method:'PATCH',url:`${endpoint}/${old[0].id}`,body:{isDisabledByUser:true}});
    const updated=await client.request({url:`${endpoint}/${old[0].id}`});
    if(updated.isDisabledByUser!==true || updated.url!==old[0].url)throw new Error('Readback mismatch');
    console.log('Verified: Vercel publication hook disabled; STRATO hook retained and enabled.');
  }else console.log('Ready: one superseded Vercel hook and one active STRATO hook. No changes applied.');
}catch {
  console.error('Hook retirement failed. Inspect the authenticated project privately; no hook URLs or headers are logged.');
  process.exitCode=1;
}
