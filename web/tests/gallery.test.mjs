import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchGallery,
  getGalleryConfig,
  normalizeGallery,
  groupGalleryMedia,
} from "../src/lib/gallery.ts";

// Synthetic transport fixtures only; never imported by the website.
const config = {
  projectId: "cmsqa123",
  dataset: "qa",
  token: "test-token-never-real",
};
const photo = {
  _key: "photo-1",
  _type: "galleryPhoto",
  alt: "Technische Testgrafik, kein Camp-Foto",
  credit: "Test fixture",
  asset: {
    url: "https://cdn.sanity.io/images/cmsqa123/qa/test-800x600.webp",
    mimeType: "image/webp",
    size: 1024,
    metadata: { dimensions: { width: 800, height: 600 } },
  },
};
const video = {
  _key: "video-1",
  _type: "galleryVideo",
  title: "Technisches Testvideo",
  credit: "Test fixture",
  transcript: "Technische Testaufnahme ohne reale Camp-Inhalte.",
  file: {
    asset: {
      url: "https://cdn.sanity.io/files/cmsqa123/qa/test.mp4",
      mimeType: "video/mp4",
      size: 2048,
    },
  },
  poster: photo,
};
const album = {
  _id: "qa-album",
  title: "Technische Testdaten – kein echtes Camp",
  slug: "test-album",
  occurredOn: "2026-10-01",
  city: "Testort",
  description: "Nur für automatisierte Tests.",
  visibility: "public",
  rightsConfirmed: true,
  media: [photo, video],
};
test("20 photos group into On-Ice and Off-Ice sections, preserving order within each", () => {
  const media = Array.from({ length: 20 }, (_, index) => ({
    ...photo,
    _key: `photo-${index}`,
    section: index % 2 ? "off-ice" : "on-ice",
  }));
  const [result] = normalizeGallery([{ ...album, media }], config);
  const groups = groupGalleryMedia(result.media);
  assert.deepEqual(
    groups.map((group) => [group.id, group.media.length]),
    [
      ["on-ice", 10],
      ["off-ice", 10],
    ],
  );
  assert.deepEqual(
    groups[0].media.map((item) => item.id),
    media.filter((item) => item.section === "on-ice").map((item) => item._key),
  );
  assert.deepEqual(
    groups[1].media.map((item) => item.id),
    media.filter((item) => item.section === "off-ice").map((item) => item._key),
  );
});
test("unassigned media remain visible and videos use their own section, not their poster's", () => {
  const [result] = normalizeGallery(
    [
      {
        ...album,
        media: [
          photo,
          {
            ...video,
            section: "off-ice",
            poster: { ...photo, section: "on-ice" },
          },
          { ...photo, _key: "unassigned-section", section: "other" },
        ],
      },
    ],
    config,
  );
  const groups = groupGalleryMedia(result.media);
  assert.deepEqual(
    groups.map((group) => [group.id, group.media.length]),
    [
      ["off-ice", 1],
      ["other", 2],
    ],
  );
  assert.equal(groups[0].media[0].type, "video");
  assert.deepEqual(groupGalleryMedia([]), []);
});
test("CMS is optional but partial configuration fails closed", () => {
  assert.equal(getGalleryConfig({}), undefined);
  assert.throws(() => getGalleryConfig({ SANITY_PROJECT_ID: "realproject" }));
  assert.throws(() => getGalleryConfig({ SANITY_DATASET: "production" }));
  assert.throws(() => getGalleryConfig({ SANITY_READ_TOKEN: config.token }));
  assert.throws(() =>
    getGalleryConfig({
      SANITY_PROJECT_ID: "../escape",
      SANITY_DATASET: "production",
      SANITY_READ_TOKEN: "test",
    }),
  );
  assert.deepEqual(
    getGalleryConfig({
      SANITY_PROJECT_ID: " cmsqa123 ",
      SANITY_DATASET: "qa",
      SANITY_READ_TOKEN: config.token,
    }),
    config,
  );
});

test("public CMS configuration needs only project and dataset; blank tokens stay absent", () => {
  for (const token of [undefined, "", "   "]) {
    assert.deepEqual(
      getGalleryConfig({
        SANITY_PROJECT_ID: " cmsqa123 ",
        SANITY_DATASET: " qa ",
        SANITY_READ_TOKEN: token,
      }),
      { projectId: "cmsqa123", dataset: "qa" },
    );
  }
});
test("only supported photo spotlight placements are accepted; poster settings do not enlarge videos", () => {
  for (const spotlight of ["left", "right", undefined, "none"]) {
    const [result] = normalizeGallery(
      [
        {
          ...album,
          media: [
            { ...photo, spotlight },
            {
              ...video,
              spotlight: "left",
              poster: { ...photo, spotlight: "right" },
            },
          ],
        },
      ],
      config,
    );
    assert.equal(
      result.media[0].spotlight,
      spotlight === "left" || spotlight === "right" ? spotlight : undefined,
    );
    assert.equal(result.media[1].spotlight, undefined);
  }
});
test("only approved published albums render; withheld data never enters publication validation", () => {
  const result = normalizeGallery(
    [
      { ...album, _id: "drafts.qa-album" },
      { ...album, _id: "versions.release.qa-album" },
      { ...album, visibility: "hidden" },
      { ...album, rightsConfirmed: false },
      album,
    ],
    config,
  );
  assert.equal(result.length, 1);
  assert.deepEqual(
    result[0].media.map((item) => item.type),
    ["image", "video"],
  );
});
test("albums are newest first, ordered media are retained and duplicate routes fail the build", () => {
  const newer = {
    ...album,
    _id: "newer",
    slug: "newer",
    occurredOn: "2026-10-02",
    media: [video, photo],
  };
  const result = normalizeGallery([album, newer], config);
  assert.deepEqual(
    result.map((item) => item.slug),
    ["newer", "test-album"],
  );
  assert.equal(result[0].cover.url, photo.asset.url);
  assert.equal(result[0].media[0].type, "video");
  assert.throws(
    () => normalizeGallery([album, { ...album, _id: "duplicate" }], config),
    /duplicate album route/,
  );
  assert.throws(
    () => normalizeGallery([album, album], config),
    /duplicate document ID/,
  );
});
test("untrusted or wrong-project assets and unsupported uploads cannot reach the page", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://evil.example/pic.webp",
    "https://cdn.sanity.io/images/other/qa/test.webp",
    "https://cdn.sanity.io/images/cmsqa123/qa/evil.svg",
    `${photo.asset.url}?token=secret`,
  ]) {
    assert.throws(
      () =>
        normalizeGallery(
          [{ ...album, media: [{ ...photo, asset: { ...photo.asset, url } }] }],
          config,
        ),
      /approved gallery album/,
    );
  }
  assert.throws(
    () =>
      normalizeGallery([{ ...album, media: [{ ...photo, alt: "" }] }], config),
    /approved gallery album/,
  );
  assert.throws(
    () =>
      normalizeGallery(
        [
          {
            ...album,
            media: [
              { ...photo, asset: { ...photo.asset, size: 13 * 1024 * 1024 } },
            ],
          },
        ],
        config,
      ),
    /approved gallery album/,
  );
});
test("videos need valid files, posters, credits and accessible text alternatives", () => {
  for (const invalid of [
    { ...video, poster: undefined },
    { ...video, transcript: "" },
    { ...video, credit: "" },
    {
      ...video,
      file: { asset: { ...video.file.asset, mimeType: "application/pdf" } },
    },
  ]) {
    assert.throws(
      () => normalizeGallery([{ ...album, media: [invalid] }], config),
      /approved gallery album/,
    );
  }
});

test("invalid approved album fields or any malformed media fail instead of silently disappearing", () => {
  for (const change of [
    { title: "   " },
    { city: " " },
    { description: "\n " },
    { occurredOn: "2026-02-30" },
    { slug: "../verwaltung" },
    { slug: "x".repeat(81) },
    { media: [] },
    { media: "invalid" },
    { media: [photo, { ...photo }] },
    { media: [{ ...photo, _key: "" }] },
    {
      media: Array.from({ length: 61 }, (_, i) => ({
        ...photo,
        _key: `p${i}`,
      })),
    },
    { media: [photo, { ...photo, _key: "bad", credit: "   " }] },
    { media: [{ ...photo, spotlight: "middle" }] },
    { media: [{ ...photo, section: "unknown" }] },
    { media: [{ ...photo, asset: { ...photo.asset, size: 1.5 } }] },
    {
      media: [
        {
          ...photo,
          asset: {
            ...photo.asset,
            metadata: { dimensions: { width: "800", height: 600 } },
          },
        },
      ],
    },
  ])
    assert.throws(
      () => normalizeGallery([{ ...album, ...change }], config),
      /approved gallery album/,
    );
});
test("public gallery fetch omits authorization and retains approval and draft filtering", async () => {
  const result = await fetchGallery(
    { projectId: config.projectId, dataset: config.dataset },
    async (url, options) => {
      assert.equal(new Headers(options.headers).has("Authorization"), false);
      assert.equal(url.searchParams.get("perspective"), "published");
      assert.match(url.searchParams.get("query"), /rightsConfirmed == true/);
      return new Response(
        JSON.stringify({
          result: [
            album,
            { ...album, _id: "drafts.qa-album" },
            { ...album, _id: "versions.release.qa-album" },
            { ...album, _id: "hidden", visibility: "hidden" },
            { ...album, _id: "unapproved", rightsConfirmed: false },
          ],
        }),
      );
    },
  );
  assert.deepEqual(
    result.map((item) => item.id),
    [album._id],
  );
});

test("build fetch uses a server-only token and published perspective; errors never silently empty the gallery", async () => {
  const result = await fetchGallery(config, async (url, options) => {
    assert.equal(url.searchParams.get("perspective"), "published");
    assert.match(url.searchParams.get("query"), /rightsConfirmed == true/);
    assert.equal(options.headers.Authorization, `Bearer ${config.token}`);
    assert.equal(url.href.includes(config.token), false);
    return new Response(JSON.stringify({ result: [album] }));
  });
  assert.equal(result.length, 1);
  await assert.rejects(
    fetchGallery(config, async () => new Response("Denied", { status: 401 })),
    /401/,
  );
  await assert.rejects(
    fetchGallery(
      config,
      async () => new Response(JSON.stringify({ result: null })),
    ),
    /expected an array/,
  );
});
