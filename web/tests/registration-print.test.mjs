import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

test('printable request is bound to the accepted policy and verified PDF bytes',async()=>{
 const policy=JSON.parse(await readFile(new URL('../../docs/registration-policy-draft-2026-11-11.json',import.meta.url),'utf8'));
 const manifest=JSON.parse(await readFile(new URL('../../shared/registration-print-manifest.json',import.meta.url),'utf8'));
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.policyVersion,policy.version);
 assert.equal(manifest.policySha256,sha(JSON.stringify(policy)),'Policy changed: regenerate/review the printable request');
 assert.deepEqual(manifest.fields,policy.fields.map(field=>field.name));
 assert.deepEqual(manifest.consentPurposes,policy.consents.map(consent=>consent.purpose));
 assert.equal(manifest.draft,true);assert.equal(manifest.fillable,false);assert.equal(manifest.pages,2);
 assert.match(manifest.filename,/^PK-Hockey-Academy-Trainingsanfrage-v\d+\.pdf$/);
 const pdf=await readFile(new URL('../../docs/'+manifest.filename,import.meta.url));
 assert.equal(pdf.byteLength,manifest.sizeBytes);assert.equal(sha(pdf),manifest.sha256);
 assert.ok(pdf.subarray(0,5).equals(Buffer.from('%PDF-')));
 // The supplied v2 is preserved independently, not silently replaced by a derivative.
 const original=await readFile(new URL('../public/downloads/PK-Hockey-Academy-Anmeldung-v2.pdf',import.meta.url));
 assert.equal(sha(original),policy.sourcePdfSha256);
});
