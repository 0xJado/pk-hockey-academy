import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const web=new URL('../../',import.meta.url),output=new URL('../../../output/strato-preview-candidate/',import.meta.url);
await mkdir(output,{recursive:true});
const result=spawnSync(process.execPath,[fileURLToPath(new URL('scripts/build-preview-candidate.mjs',web))],{
  cwd:fileURLToPath(web),encoding:'utf8',timeout:120000,
  env:{...process.env,SITE_URL:'',SANITY_PROJECT_ID:'cmsqa123',SANITY_DATASET:'qa',SANITY_READ_TOKEN:'',SANITY_PREVIEW_READ_TOKEN:'',SANITY_TRAINERS_ENABLED:'true',SANITY_TRAINING_ENABLED:'false',SANITY_SOCIAL_ENABLED:'false',PUBLIC_SANITY_STUDIO_URL:'https://example.sanity.studio',PK_CMS_QA_MODE:'empty',PK_CMS_QA_TRACE:fileURLToPath(new URL('build-trace.jsonl',output)),NODE_OPTIONS:`--import="${new URL('sanity-fixture.mjs',import.meta.url).href}"`},
});
await writeFile(new URL('build.log',output),result.stdout+result.stderr);
if(result.error)throw result.error;
if(result.status!==0)throw Error('Isolated preview build failed; inspect output/strato-preview-candidate/build.log');
console.log('Isolated PHP preview build passed; generated candidate only, no production/Studio changes. Vendor editing-library warnings remain in the build log.');
