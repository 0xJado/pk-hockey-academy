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

test('Studio 6 empty-secret callback creates only a native private capability through the signed-in client', async () => {
  const created = [];
  const client = {withConfig(config) {
    assert.equal(config.useCdn, false);
    return {
      async create(document) { created.push(document); return document; },
      async delete({query}) {
        assert.match(query, /source == "pk-strato-presentation"/);
        assert.match(query, /dateTime\(_updatedAt\) < dateTime\(now\(\)\) - 3600/);
        assert.match(query, /sanity\.previewUrlSecret/);
      },
    };
  }};
  const resolve = getPhpTrainerPreviewResolver('https://pkhockeyacademy.de');
  const context = {client, previewUrlSecret: '', studioPreviewPerspective: 'drafts', previewSearchParam: '/redaktion/trainerpool?id=selected'};
  const [first, second] = await Promise.all([resolve(context), resolve(context)]);
  assert.equal(created.length, 1);
  assert.equal(first, second);
  const url = new URL(first);
  assert.equal(url.search, '');
  assert.equal(url.pathname, '/redaktion/verbinden');
  const document = created[0];
  assert.match(document._id, /^drafts\.pk-strato-preview-/);
  assert.equal(document._type, 'sanity.previewUrlSecret');
  assert.match(document.secret, /^[a-f0-9]{64}$/);
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('sanity-preview-secret'), document.secret);
  await resolve(context);
  assert.equal(created.length, 2, 'a new opening rechecks the current CMS write permission');
  await assert.rejects(resolve({...context, client: undefined}), /Signed-in/);
  const denied = getPhpTrainerPreviewResolver('https://pkhockeyacademy.de');
  await assert.rejects(denied({...context, client: {withConfig() {return {async create() {throw new Error('private transport details');}};}}}), error => !error.message.includes('private transport details'));
});
