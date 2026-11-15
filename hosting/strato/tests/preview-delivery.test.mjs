import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPreviewHandshake} from '../lib/delivery.mjs';
import {sha256} from '../lib/artifact.mjs';

test('delivery permits only the exact approved public Studio binding and verifies every other byte',()=>{
  const template=Buffer.from('<meta name="pk-preview-studio-origin" content="__PK_STUDIO_ORIGIN__"><main>Connect</main>');
  const expected=sha256(template);
  const bound=Buffer.from(template.toString().replace('__PK_STUDIO_ORIGIN__','https://pk-hockey-academy.sanity.studio'));
  assert.doesNotThrow(()=>verifyPreviewHandshake(bound,expected));
  assert.throws(()=>verifyPreviewHandshake(Buffer.from(bound.toString().replace('Connect','Changed')),expected));
  assert.throws(()=>verifyPreviewHandshake(Buffer.from(bound.toString().replace('pk-hockey-academy.sanity.studio','evil.example')),expected));
  const legacy=Buffer.from('<main>Previous connection template</main>');
  assert.doesNotThrow(()=>verifyPreviewHandshake(legacy,sha256(legacy)));
});
