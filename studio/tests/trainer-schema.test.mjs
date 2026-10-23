import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import { trainer } from "../schemaTypes/trainer.ts";

const schema = createSchema({ name: "trainer-test", types: [trainer] });
const profile = {
  _id: "fixture",
  _type: "trainer",
  _rev: "qa",
  _createdAt: "2026-10-01T00:00:00Z",
  _updatedAt: "2026-10-01T00:00:00Z",
  name: "Technisches Testprofil",
  role: "Testrolle",
  biography: "Dieses Profil dient ausschließlich der technischen Prüfung.",
  verifiedBackground: ["Technische Angabe"],
  displayOrder: 0,
  active: true,
  visibility: "public",
  contentApproved: true,
};
const portrait = {
  _type: "image",
  asset: { _type: "reference", _ref: "image-abc-800x1000-webp" },
  alt: "Technische Testgrafik ohne reale Person",
  credit: "Test fixture",
};
const validate = async (
  change,
  asset = { mimeType: "image/webp", size: 1024 },
) => {
  const client = {
    config: () => ({ projectId: "cmsqa123", dataset: "qa" }),
    withConfig() {
      return this;
    },
    fetch: async () => asset,
  };
  const workspace = {
    schema,
    getClient: () => client,
    i18n: {
      currentLocale: { id: "de-DE" },
      loadNamespaces: async () => {},
      t: (key) => key,
    },
  };
  return validateDocument({
    document: { ...profile, ...change },
    workspace,
    getClient: () => client,
    getDocumentExists: async () => true,
  });
};

test("native Sanity validation allows complete profiles with and without a portrait", async () => {
  for (const change of [
    {},
    { portrait },
    { visibility: "hidden", contentApproved: false },
  ]) {
    const markers = await validate(change);
    assert.equal(
      markers.some((marker) => marker.level === "error"),
      false,
      JSON.stringify(markers),
    );
  }
});

test("native publication checks are blocking errors, including whitespace and upload validation", async () => {
  for (const change of [
    { name: "  " },
    { role: "  " },
    { biography: " ".repeat(30) },
    { verifiedBackground: ["  "] },
    { qualifications: ["  "] },
    { contentApproved: false },
    { displayOrder: 0.5 },
    { active: "true" },
    { visibility: "invalid" },
    { portrait: {} },
    { portrait: { ...portrait, alt: " ".repeat(10) } },
    { portrait: { ...portrait, credit: " " } },
  ]) {
    const markers = await validate(change);
    assert.equal(
      markers.some((marker) => marker.level === "error"),
      true,
      JSON.stringify({ change, markers }),
    );
  }
  for (const asset of [
    null,
    { mimeType: "image/webp", size: -1 },
    { mimeType: "image/webp", size: NaN },
    { mimeType: "image/webp", size: "1024" },
    { mimeType: "image/svg+xml", size: 1024 },
    { mimeType: "image/webp", size: 13 * 1024 * 1024 },
  ]) {
    const markers = await validate({ portrait }, asset);
    assert.equal(
      markers.some(
        (marker) => marker.level === "error" && marker.path[0] === "portrait",
      ),
      true,
      JSON.stringify(markers),
    );
  }
});
