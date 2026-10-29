import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import { socialPost } from "../schemaTypes/socialPost.ts";
const schema = createSchema({ name: "social-test", types: [socialPost] });
const fixture = {
  _id: "fixture", _type: "socialPost", _rev: "fixture", _createdAt: "2026-10-01T00:00:00Z", _updatedAt: "2026-10-01T00:00:00Z",
  title: "Technischer Testbeitrag", platform: "instagram", sourceUrl: "https://www.instagram.com/p/fixture123/",
  sourceStatus: "available", displayOrder: 1, visibility: "public", contentApproved: true,
};
const validate = async change => validateDocument({
  document: { ...fixture, ...change },
  workspace: { schema, getClient: () => ({}), i18n: { currentLocale: { id: "de-DE" }, loadNamespaces: async () => {}, t: key => key } },
  getClient: () => ({}), getDocumentExists: async () => true,
});

test("native social schema permits approved cards and explicit unavailable-source fallbacks", async () => {
  for (const change of [{}, { sourceStatus: "unavailable", fallbackUrl: "https://www.instagram.com/fixtureacademy/" }]) {
    assert.deepEqual((await validate(change)).filter(marker=>marker.level === "error"), []);
  }
});

test("native publication blocks unapproved, whitespace, foreign-source and incomplete fallback cards", async () => {
  for (const change of [{ contentApproved: false }, { title: "   " }, { sourceUrl: "https://evil.test/" }, { sourceStatus: "unavailable" }, { fallbackUrl: "https://www.facebook.com/fixtureacademy/" }]) {
    assert.ok((await validate(change)).some(marker=>marker.level === "error"));
  }
});
