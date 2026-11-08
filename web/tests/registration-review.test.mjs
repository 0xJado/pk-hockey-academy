import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,unlink,rmdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cwd=fileURLToPath(new URL('../',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,['--experimental-strip-types','scripts/registration-policy-review.mjs',...args],{cwd,encoding:'utf8'});

test('review packet matches unchanged source PDF',()=>{
  const result=run('--check');
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/"pdfUnchanged":true/);
  assert.match(result.stdout,/"status":"unapproved"/);
});

test('private worksheet checks expose counts only and cannot confer approval',async()=>{
  const doc=await readFile(new URL('../../docs/REGISTRATION-POLICY-REVIEW.md',import.meta.url),'utf8');
  const name=doc.match(/policy-answers\.[a-f0-9]{12}\.local\.json/)[0];
  assert.equal(run('--init-private').status,0);
  const original=new URL('../../output/registration-private/'+name,import.meta.url);
  const before=await readFile(original,'utf8');
  assert.equal(run('--init-private').status,0);
  assert.equal(await readFile(original,'utf8'),before,'Existing owner answers must be preserved');
  const directory=await mkdtemp(new URL('../../output/registration-private/test-',import.meta.url));
  const path=directory+'/synthetic.local.json';
  const marker='SYNTHETIC_PRIVATE_ANSWER_DO_NOT_PRINT';
  try{
    const worksheet=JSON.parse(before);
    for(const id of Object.keys(worksheet.fields))worksheet.fields[id]={collection:'include',purpose:marker,requiredness:'optional',format:marker};
    for(const id of Object.keys(worksheet.decisions))worksheet.decisions[id]={resolution:marker,approvalReference:marker};
    for(const id of Object.keys(worksheet.approvalReferences))worksheet.approvalReferences[id]=marker;
    await writeFile(path,JSON.stringify(worksheet));
    const complete=run('--status',path);
    assert.equal(complete.status,0,complete.stderr);
    assert.match(complete.stdout,/"fieldDecisionsPending":0/);
    assert.match(complete.stdout,/"processDecisionsPending":0/);
    assert.match(complete.stdout,/"humanApprovalVerified":false,"activatesRegistration":false/);
    assert.ok(!(complete.stdout+complete.stderr).includes(marker));
    worksheet.reviewDigest='stale';
    await writeFile(path,JSON.stringify(worksheet));
    const stale=run('--status',path);
    assert.equal(stale.status,1);
    assert.ok(!(stale.stdout+stale.stderr).includes(marker));
    await writeFile(path,'{"'+marker+'":');
    const malformed=run('--status',path);
    assert.equal(malformed.status,1);
    assert.ok(!(malformed.stdout+malformed.stderr).includes(marker));
    const outside=run('--status',fileURLToPath(new URL('../../docs/registration-policy-review.json',import.meta.url)));
    assert.equal(outside.status,1);
    assert.match(outside.stderr,/no answers were printed/);
  }finally{
    await unlink(path);
    await rmdir(directory);
  }
});
