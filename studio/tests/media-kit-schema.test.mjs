import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import { mediaKitDownload } from "../schemaTypes/mediaKitDownload.ts";
const schema = createSchema({
  name: "media-kit-test",
  types: [mediaKitDownload],
});
const file = { mimeType: "image/png", extension: "png", size: 1024 };
const fixture = {
  _id: "fixture",
  _type: "mediaKitDownload",
  _rev: "fixture",
  _createdAt: "2026-10-01T00:00:00Z",
  _updatedAt: "2026-10-01T00:00:00Z",
  title: "Testlogo",
  description: "Technische Testdatei.",
  file: {
    _type: "file",
    asset: { _type: "reference", _ref: "file-fixture-png" },
  },
  downloadName: "Academy-Test.png",
  displayOrder: 1,
  visibility: "public",
  contentApproved: true,
};
const validate = async (change, asset = file) => {
  const client = {
    withConfig() {
      return this;
    },
    fetch: async () => {
      if (asset instanceof Error) throw asset;
      return asset;
    },
  };
  return validateDocument({
    document: { ...fixture, ...change },
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
};
test("native media-kit publication accepts approved downloads, withheld entries and optional usage guidance", async () => {
  for (const change of [
    {},
    { visibility: "hidden", contentApproved: false },
    { usageGuidance: "Technischer Testtext, keine Lizenzfreigabe." },
  ])
    assert.deepEqual(await validate(change), []);
});
test("native media-kit publication blocks whitespace, unapproved content, absent files, mismatched formats and failed lookups", async () => {
  for (const change of [
    { title: " " },
    { description: " " },
    { contentApproved: false },
    { downloadName: "../test.png" },
    { downloadName: "test.pdf" },
    { file: undefined },
    { displayOrder: -1 },
    { visibility: "unexpected" },
  ])
    assert.ok(
      (await validate(change)).some((marker) => marker.level === "error"),
      JSON.stringify(change),
    );
  for (const asset of [
    null,
    new Error("Synthetic lookup failure"),
    { ...file, size: -1 },
    { ...file, size: 1.5 },
    { ...file, size: 21 * 1024 * 1024 },
    { ...file, mimeType: "image/svg+xml" },
  ])
    assert.ok(
      (await validate({}, asset)).some((marker) => marker.level === "error"),
    );
});
