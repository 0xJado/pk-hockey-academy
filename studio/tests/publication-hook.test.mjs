import test from "node:test";
import assert from "node:assert/strict";
import { parse, evaluate } from "groq-js";
import { CMS_PUBLICATION_FILTER, CMS_PUBLICATION_PROJECTION, publicationWebhook } from "../../shared/cms-publication.ts";

const filter = parse(CMS_PUBLICATION_FILTER, { mode: "delta" });
const matches = async (before, after) => (await evaluate(filter, { before, after })).get();
const doc = { _id: "real-profile", _type: "trainer", visibility: "public", contentApproved: true };

test("publication filter includes creates, edits, withdrawals and deletes for each supported content type", async () => {
  for (const _type of ["trainer", "galleryCamp", "socialPost"]) {
    const before = { ...doc, _type };
    assert.equal(await matches(null, before), true);
    assert.equal(await matches(before, { ...before, name: "Updated" }), true);
    assert.equal(await matches(before, { ...before, visibility: "hidden", contentApproved: false }), true);
    assert.equal(await matches(before, null), true);
  }
});

test("native drafts, releases, assets and unrelated documents do not trigger builds", async () => {
  for (const id of ["drafts.real-profile", "versions.release.real-profile"]) {
    assert.equal(await matches(null, { ...doc, _id: id }), false);
    assert.equal(await matches({ ...doc, _id: id }, null), false);
  }
  for (const _type of ["sanity.imageAsset", "registration", "system.release"]) {
    assert.equal(await matches(null, { ...doc, _type }), false);
  }
});

test("projection sends only routing metadata and hook configuration excludes unpublished changes", async () => {
  const node = parse(CMS_PUBLICATION_PROJECTION, { mode: "delta" });
  const value = await (await evaluate(node, { before: { ...doc, biography: "PRIVATE_COPY" }, after: null })).get();
  assert.deepEqual(value, { documentId: doc._id, documentType: "trainer", operation: "delete" });
  const hook = publicationWebhook("qa", "https://api.vercel.com/v1/integrations/deploy/prj_fixture/fixture-secret");
  assert.equal(hook.includeDrafts, false);
  assert.equal(hook.includeAllVersions, false);
  assert.deepEqual(hook.rule.on, ["create", "update", "delete"]);
  for (const url of ["http://api.vercel.com/v1/integrations/deploy/prj_fixture/key", "https://api.vercel.com.evil.test/x", "https://api.vercel.com/v1/integrations/deploy/prj_fixture/key?x=y"])
    assert.throws(() => publicationWebhook("qa", url));
});
