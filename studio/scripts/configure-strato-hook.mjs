// Dry run by default. New hook only; never changes the existing review hook.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {stratoPublicationWebhook} from '../../shared/cms-publication.ts';
import {getStudioConfig} from '../config.ts';
try {
  const {projectId,dataset}=getStudioConfig();
  const payload=stratoPublicationWebhook(dataset,process.env.STRATO_DISPATCH_TOKEN||'');
  const require=createRequire(import.meta.url);
  const {getProjectCliClient}=await import(pathToFileURL(require.resolve('@sanity/cli-core')).href);
  const client=await getProjectCliClient({apiVersion:'2025-02-19',projectId,requireUser:true});
  const endpoint=`/hooks/projects/${projectId}`;
  const hooks=await client.request({url:endpoint});
  if(hooks.some(hook=>hook.name===payload.name&&!hook.deletedAt))throw Error('Existing STRATO hook requires inspection; not overwritten.');
  if(process.argv.includes('--apply')) {
    await client.request({url:endpoint,method:'POST',body:payload});
    console.log('Created STRATO publication hook. Existing review hook retained.');
  }else console.log('Validated new STRATO hook configuration. No changes applied.');
}catch {
  console.error('STRATO webhook setup failed. Check local credentials and inspect existing hooks privately.');process.exitCode=1;
}
