import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import {
  galleryCamp,
  galleryPhoto,
  galleryVideo,
} from "../schemaTypes/gallery.ts";
import { normalizeGallery } from "../../web/src/lib/gallery.ts";

const schema = createSchema({
  name: "gallery-test",
  types: [galleryCamp, galleryPhoto, galleryVideo],
});
const photo = {
  _type: "galleryPhoto",
  _key: "photo1",
  asset: { _type: "reference", _ref: "image-abc-800x600-webp" },
  alt: "Technische Testgrafik ohne echte Personen",
  credit: "Test fixture",
};
const video = {
  _type: "galleryVideo",
  _key: "video1",
  title: "Technische Testaufnahme",
  file: { _type: "file", asset: { _type: "reference", _ref: "file-abc-mp4" } },
  poster: photo,
  transcript: "Technische Testaufnahme ohne reale Camp-Inhalte.",
  credit: "Test fixture",
};
const album = {
  _id: "fixture",
  _type: "galleryCamp",
  _rev: "qa",
  _createdAt: "2026-10-01T00:00:00Z",
  _updatedAt: "2026-10-01T00:00:00Z",
  title: "Technisches Testalbum",
  slug: { _type: "slug", current: "technisches-testalbum" },
  occurredOn: "2026-10-01",
  city: "Testort",
  description: "Technischer Datensatz ohne echte Camp-Inhalte.",
  media: [photo, video],
  visibility: "public",
  rightsConfirmed: true,
};
const asset = {
  mimeType: "image/webp",
  size: 1024,
  metadata: { dimensions: { width: 800, height: 600 } },
};
const validate = async (change, imageAsset = asset) => {
  const client = {
    config: () => ({ projectId: "cmsqa123", dataset: "qa" }),
    withConfig() {
      return this;
    },
    fetch: async (_query, { id } = {}) => {
      if (typeof id !== "string") return true;
      if (imageAsset instanceof Error) throw imageAsset;
      return id.startsWith("file-")
        ? { mimeType: "video/mp4", size: 2048 }
        : imageAsset;
    },
  };
  return validateDocument({
    document: { ...album, ...change },
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

test("native gallery publication accepts complete content and blocks whitespace, invalid dates and broken media", async () => {
  assert.deepEqual(await validate({}), []);
  assert.deepEqual(
    await validate({ visibility: "hidden", rightsConfirmed: false }),
    [],
  );
  for (const change of [
    { title: "   " },
    { city: " " },
    { description: "\n " },
    { occurredOn: "2026-02-30" },
    { slug: { current: "x".repeat(81) } },
    { visibility: "unexpected" },
    { rightsConfirmed: false },
    { media: [] },
    {
      media: Array.from({ length: 61 }, (_, i) => ({
        ...photo,
        _key: `p${i}`,
      })),
    },
    { media: [photo, { ...photo }] },
    { media: [{ ...photo, alt: " ".repeat(12) }] },
    { media: [{ ...photo, credit: "   " }] },
    { media: [{ ...photo, spotlight: "middle" }] },
    { media: [{ ...photo, section: "unexpected" }] },
    { media: [{ ...video, title: " " }] },
    { media: [{ ...video, credit: " " }] },
    { media: [{ ...video, transcript: " ".repeat(25) }] },
    { media: [{ ...video, poster: { ...photo, credit: " " } }] },
  ])
    assert.ok(
      (await validate(change)).some((marker) => marker.level === "error"),
      JSON.stringify(change),
    );
});

test("native gallery asset validation rejects invalid uploads and reports failed lookups as errors", async () => {
  for (const badAsset of [
    null,
    new Error("Synthetic lookup failure"),
    { ...asset, size: 0.5 },
    { ...asset, size: 13 * 1024 * 1024 },
    { ...asset, mimeType: "image/svg+xml" },
  ]) {
    assert.ok(
      (await validate({}, badAsset)).some((marker) => marker.level === "error"),
    );
  }
  assert.ok(
    (await validate({ media: [{ ...photo, asset: undefined }] })).some(
      (marker) => marker.level === "error",
    ),
  );
});

test("whitespace-credit regression is rejected by both native publication and public retrieval", async () => {
  const publicPhoto = {
    ...photo,
    asset: {
      ...asset,
      url: "https://cdn.sanity.io/images/cmsqa123/qa/abc-800x600.webp",
    },
  };
  const publicAlbum = {
    ...album,
    slug: album.slug.current,
    media: [publicPhoto],
  };
  const config = { projectId: "cmsqa123", dataset: "qa" };
  assert.equal(normalizeGallery([publicAlbum], config).length, 1);
  assert.ok(
    (await validate({ media: [{ ...photo, credit: "   " }] })).some(
      (marker) => marker.level === "error",
    ),
  );
  assert.throws(
    () =>
      normalizeGallery(
        [{ ...publicAlbum, media: [{ ...publicPhoto, credit: "   " }] }],
        config,
      ),
    /approved gallery album/,
  );
  assert.equal(
    normalizeGallery(
      [{ ...publicAlbum, visibility: "hidden", media: [] }],
      config,
    ).length,
    0,
  );
});
