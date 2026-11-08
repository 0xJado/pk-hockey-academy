import {spawnSync} from 'node:child_process';
import {mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const web=new URL('../',import.meta.url);
const output=new URL('../../output/strato-preview-candidate/',import.meta.url);
await mkdir(output,{recursive:true});
await rm(new URL('READY.json',output),{force:true});
const result=spawnSync(process.execPath,[fileURLToPath(new URL('node_modules/astro/bin/astro.mjs',web)),'build','--outDir',fileURLToPath(new URL('public/',output))],{
  cwd:fileURLToPath(web),stdio:'inherit',
  env:{...process.env,DEPLOY_TARGET:'strato',PK_STRATO_PREVIEW_CANDIDATE:'true',PUBLIC_LAUNCH_READY:'false',SANITY_READ_TOKEN:'',SANITY_PREVIEW_READ_TOKEN:''},
});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status||1);
const directory=new URL('public/preview/',output);await mkdir(directory,{recursive:true});
const library=new URL('preview-lib/',directory);await mkdir(library,{recursive:true});
await copyFile(new URL('../../hosting/strato/preview/Preview.php',import.meta.url),new URL('Preview.php',library));
await copyFile(new URL('../../hosting/strato/preview/entry.php',import.meta.url),new URL('editor.php',directory));
for(const [route,file] of [['__private-preview-template','preview-shell.html'],['__private-preview-connect','preview-connect.html']]){
  let html=await readFile(new URL('public/'+route+'/index.html',output),'utf8');
  // Astro inlines small modules. Externalize them for a strict script-src 'self'
  // policy without allowing arbitrary inline code in an authenticated preview.
  for(const match of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]) {
    if(/\bsrc\s*=/.test(match[1])||!match[2].trim()||/application\/(?:ld\+)?json/.test(match[1]))continue;
    const name='pk-preview-'+createHash('sha256').update(match[2]).digest('hex').slice(0,20)+'.js';
    await writeFile(new URL('public/_astro/'+name,output),match[2]);
    html=html.replace(match[0],`<script${match[1]} src="/_astro/${name}"></script>`);
  }
  await writeFile(new URL(file,library),html);
}
await writeFile(new URL('.htaccess',library),'Require all denied\n');
await writeFile(new URL('READY.json',output),JSON.stringify({candidate:true,publicDeployment:false,containsDrafts:false,verifiedAt:new Date().toISOString()}));
console.log('Isolated PHP preview candidate built. Not a production deployment artifact; no Studio configuration changed.');
