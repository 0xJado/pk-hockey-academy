import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getPhpTrainerPreviewResolver,getTrainerPreviewOptions} from '../lib/presentation.ts';
test('PHP preview uses native Studio secret in fragment only and keeps selected profile/perspective',async()=>{
  const resolve=getPhpTrainerPreviewResolver('https://pkhockeyacademy.de');
  const url=new URL(await resolve({previewUrlSecret:'ISOLATED_TEST_SECRET',studioPreviewPerspective:'published',previewSearchParam:'/redaktion/trainerpool?id=selected'}));
  assert.equal(url.pathname,'/redaktion/verbinden');assert.equal(url.search,'');
  const fragment=new URLSearchParams(url.hash.slice(1));
  assert.equal(fragment.get('sanity-preview-secret'),'ISOLATED_TEST_SECRET');
  assert.equal(fragment.get('sanity-preview-perspective'),'published');
  assert.equal(fragment.get('sanity-preview-pathname'),'/redaktion/trainerpool?id=selected');
  assert.equal(getTrainerPreviewOptions('https://existing.example').previewMode.enable,'/api/preview/enable');
  assert.throws(()=>getPhpTrainerPreviewResolver('http://localhost:4321'));
  assert.throws(()=>getPhpTrainerPreviewResolver('https://example.test/path'));
});
