import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import { siteImages } from "../schemaTypes/siteImages.ts";

const schema = createSchema({ name: "site-images-test", types: [siteImages] });
const image = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-fixture-800x1000-webp" },
  alt: "Technisches Website-Bild ohne echte Personen",
};
async function validate(change, asset = { mimeType: "image/webp", size: 1024 }) {
  const client = {
    config: () => ({ projectId: "cmsqa123", dataset: "qa" }),
    withConfig() { return this; },
    fetch: async () => {
      if (asset instanceof Error) throw asset;
      return asset;
    },
  };
  return validateDocument({
    document: {
      _id: "siteImages",
      _type: "siteImages",
      _rev: "qa",
      _createdAt: "2026-11-06T00:00:00Z",
      _updatedAt: "2026-11-06T00:00:00Z",
      ...change,
    },
    workspace: {
      schema,
      getClient: () => client,
      i18n: {
        currentLocale: { id: "de-DE" },
        loadNamespaces: async () => {},
        t: (key) => key,
      },
    },
    getClient: () => client,
    getDocumentExists: async () => true,
  });
}

test("website images allow partial replacements but require rights approval", async () => {
  assert.deepEqual(await validate({}), []);
  assert.deepEqual(await validate({ philosophy: image, contentApproved: true }), []);
  assert.ok((await validate({ philosophy: image })).some(item => item.level === "error"));
});

test("website images reject inaccessible uploads, invalid files and whitespace alternatives", async () => {
  for (const change of [
    { crest: { ...image, alt: " " } },
    { galleryGoalie: { ...image, asset: undefined } },
  ]) {
    assert.ok((await validate({ ...change, contentApproved: true })).some(item => item.level === "error"));
  }
  for (const asset of [
    { mimeType: "image/svg+xml", size: 1024 },
    { mimeType: "image/png", size: 13 * 1024 * 1024 },
    new Error("Unavailable asset"),
  ]) {
    assert.ok((await validate({ venues: image, contentApproved: true }, asset)).some(item => item.level === "error"));
  }
});
