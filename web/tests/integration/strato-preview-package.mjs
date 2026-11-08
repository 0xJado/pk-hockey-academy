import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {cp,mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadArtifact} from '../../../hosting/strato/lib/artifact.mjs';
const output=new URL('../../../output/',import.meta.url);await mkdir(output,{recursive:true});
const root=pathToFileURL((await mkdtemp(fileURLToPath(new URL('preview-package-test-',output))))+'/');
await cp(new URL('strato/public/',output),new URL('public/',root),{recursive:true});
const result=spawnSync(process.execPath,['--input-type=module','-e',
  `import {packageStratoPreview} from './scripts/package-strato-preview.mjs';import {verifyStrato} from './scripts/verify-strato.mjs';const root=new URL(process.env.PK_PREVIEW_PACKAGE_ROOT);await packageStratoPreview(new URL('public/',root));await verifyStrato(root);`
],{cwd:fileURLToPath(new URL('../../',import.meta.url)),encoding:'utf8',timeout:120000,env:{...process.env,PK_PREVIEW_PACKAGE_ROOT:root.href,STRATO_PRIVATE_PREVIEW_ENABLED:'true',PK_STRATO_PREVIEW_CANDIDATE:'',SANITY_PROJECT_ID:'cmsqa123',SANITY_DATASET:'qa',SANITY_READ_TOKEN:'',SANITY_PREVIEW_READ_TOKEN:'',SANITY_TRAINERS_ENABLED:'true',SANITY_TRAINING_ENABLED:'false',SANITY_SOCIAL_ENABLED:'false',PUBLIC_SANITY_STUDIO_URL:'https://example.sanity.studio',PK_CMS_QA_MODE:'empty',PK_CMS_QA_TRACE:fileURLToPath(new URL('trace.jsonl',root)),NODE_OPTIONS:`--import="${new URL('sanity-fixture.mjs',import.meta.url).href}"`}});
await writeFile(new URL('package.log',root),result.stdout+result.stderr);
assert.equal(result.status,0,(result.stdout+result.stderr).slice(-2000));
const {ready,contents}=await loadArtifact(root);
assert.equal(ready.privatePreview,'php-candidate');
assert.ok(contents.has('api/editor.php'));
assert.equal(contents.get('api/preview-lib/.htaccess').toString(),'Require all denied\n');
assert.match(contents.get('.htaccess').toString(),/api\/preview-lib\(\?:\/\|\$\) - \[F,END\]/);
assert.ok(!contents.has('preview-config.json'));
assert.ok(!contents.get('api/preview-lib/preview-connect.html').toString().match(/<script[^>]*>\s*[^<\s]/));
assert.match(await readFile(new URL('public/api/editor.php',root),'utf8'),/preview-lib/);
console.log('Optional PHP preview package passed: complete manifest, isolated template guards, strict scripts and no private configuration in the artifact. Normal deployment artifact retained.');
