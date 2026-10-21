import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { loadLocalGallery } from "../src/lib/local-gallery.ts";
import localGalleryPlugin from "../local-gallery-plugin.mjs";

async function cleanup(folder) {
  assert.equal(dirname(resolve(folder)), resolve(tmpdir()));
  assert.ok(basename(folder).startsWith("pk-gallery-"));
  await rm(folder, { recursive: true, force: true });
}

test("production does not read even a malformed local album, and media serving is dev-only", async () => {
  const folder = await mkdtemp(join(tmpdir(), "pk-gallery-"));
  try {
    await writeFile(join(folder, "album.json"), "not json");
    assert.deepEqual(await loadLocalGallery(false, folder), []);
    await assert.rejects(loadLocalGallery(true, folder), SyntaxError);
    assert.equal(localGalleryPlugin().apply, "serve");
    assert.equal("configurePreviewServer" in localGalleryPlugin(), false);
  } finally {
    await cleanup(folder);
  }
});

test("optional local album preserves section/spotlight without inventing camp facts or accepting external files", async () => {
  const folder = await mkdtemp(join(tmpdir(), "pk-gallery-"));
  const album = {
    title: "Technische Vorschau",
    slug: "qa-preview",
    description: "Nur Testdaten.",
    cover: "photo",
    media: [
      {
        type: "image",
        id: "photo",
        file: "qa.webp",
        width: 1,
        height: 1,
        alt: "Testgrafik",
        credit: "Test fixture",
        section: "off-ice",
        spotlight: "right",
      },
    ],
  };
  try {
    assert.deepEqual(await loadLocalGallery(true, folder), []);
    await mkdir(join(folder, "media"));
    await writeFile(join(folder, "media", "qa.webp"), "synthetic test fixture");
    const save = () =>
      writeFile(join(folder, "album.json"), JSON.stringify(album));
    await save();
    const [result] = await loadLocalGallery(true, folder);
    assert.equal(result.isLocalPreview, true);
    assert.equal(result.occurredOn, "");
    assert.equal(result.city, "");
    assert.equal(result.cover.url, "/__local-gallery/qa.webp");
    assert.equal(result.cover.spotlight, "right");
    assert.equal(result.cover.section, "off-ice");
    for (const invalid of [
      "../outside.webp",
      "https://example.invalid/photo.webp",
    ]) {
      album.media[0].file = invalid;
      await save();
      await assert.rejects(
        loadLocalGallery(true, folder),
        /invalid media filename/,
      );
    }
  } finally {
    await cleanup(folder);
  }
});
