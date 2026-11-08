import {spawnSync} from 'node:child_process';
import {cp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export async function packageStratoPreview(output=new URL('../../output/strato/public/',import.meta.url)) {
  const enabled=process.env.STRATO_PRIVATE_PREVIEW_ENABLED||'false';
  if(!['true','false'].includes(enabled))throw Error('Invalid private preview build flag');
  if(enabled!=='true')return;
  const script=new URL('build-preview-candidate.mjs',import.meta.url);
  const result=spawnSync(process.execPath,[fileURLToPath(script)],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:process.env,encoding:'utf8',timeout:120000});
  const candidate=new URL('../../output/strato-preview-candidate/',import.meta.url);
  await writeFile(new URL('build.log',candidate),result.stdout+result.stderr);
  if(result.error||result.status!==0)throw Error('Private preview package failed; inspect the local candidate build log');
  await cp(new URL('public/_astro/',candidate),new URL('_astro/',output),{recursive:true});
  await cp(new URL('public/preview/editor.php',candidate),new URL('api/editor.php',output));
  await cp(new URL('public/preview/preview-lib/',candidate),new URL('api/preview-lib/',output),{recursive:true});
  const file=new URL('.htaccess',output);
  const router=await readFile(file,'utf8');
  const marker='RewriteRule ^api/registration/?$ api/registration.php [END]';
  if(!router.includes(marker))throw Error('Unexpected STRATO routing overlay');
  await writeFile(file,router.replace(marker,
    'RewriteRule ^api/preview-lib(?:/|$) - [F,END]\n'+
    'RewriteRule ^(?:api/preview/enable|redaktion/(?:verbinden|trainerpool|daten|abmelden))/?$ api/editor.php [END]\n'+marker));
}
