import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMediaKit,
  fetchMediaKit,
  formatDownloadSize,
} from "../src/lib/media-kit.ts";
const config = { projectId: "cmsqa123", dataset: "qa" };
const file = {
  url: "https://cdn.sanity.io/files/cmsqa123/qa/abc.png",
  mimeType: "image/png",
  size: 1024,
  extension: "png",
};
const entry = {
  _id: "fixture-download",
  _type: "mediaKitDownload",
  title: "Technisches Testlogo",
  description: "Testdatei ohne neue Rechtebehauptung.",
  downloadName: "Academy-Test.png",
  displayOrder: 1,
  visibility: "public",
  contentApproved: true,
  file: { asset: file },
};

test("only approved published media-kit entries render in deterministic order, including an authoritative empty result", () => {
  assert.equal(formatDownloadSize(1), "1 B");
  assert.equal(formatDownloadSize(1024), "1,02 kB");
  assert.equal(formatDownloadSize(1558622), "1,56 MB");
  const second = {
    ...entry,
    _id: "second",
    title: "Zweiter Download",
    displayOrder: 2,
  };
  const hidden = [
    { ...entry, _id: "drafts.draft", title: " " },
    { ...entry, _id: "versions.release.test" },
    { ...entry, visibility: "hidden" },
    { ...entry, contentApproved: false },
  ];
  const result = normalizeMediaKit([second, ...hidden, entry], config);
  assert.deepEqual(
    result.map((item) => item.id),
    [entry._id, second._id],
  );
  assert.equal(result[0].format, "PNG");
  assert.equal(result[0].sizeBytes, 1024);
  assert.equal(
    new URL(result[0].url).searchParams.get("dl"),
    "Academy-Test.png",
  );
  assert.equal(result[0].usageGuidance, undefined);
  assert.deepEqual(normalizeMediaKit(hidden, config), []);
  assert.deepEqual(normalizeMediaKit([{ ...entry, file: null }], config), []);
  assert.deepEqual(
    normalizeMediaKit(
      [{ ...entry, file: { asset: null }, preview: null }],
      config,
    ),
    [],
  );
  assert.throws(() => normalizeMediaKit([entry, entry], config), /duplicate/);
});

test("approved downloads reject incomplete metadata, unsafe files, misleading filenames and foreign asset URLs", () => {
  for (const change of [
    { title: "   " },
    { description: " " },
    { displayOrder: 1.5 },
    { usageGuidance: "a".repeat(2001) },
    { downloadName: "../../private.png" },
    { downloadName: "test.pdf" },
    { downloadName: "test.png\r\nX-Header: bad" },
    ...[
      { ...file, mimeType: "text/html" },
      { ...file, mimeType: "image/svg+xml" },
      { ...file, size: 0 },
      { ...file, size: 1.5 },
      { ...file, size: 21 * 1024 * 1024 },
      { ...file, url: "https://cdn.sanity.io/files/other/qa/abc.png" },
      { ...file, url: "https://evil.test/file.png" },
      { ...file, url: file.url + "?dl=other" },
      { ...file, extension: "pdf" },
    ].map((asset) => ({ file: { asset } })),
  ])
    assert.throws(
      () => normalizeMediaKit([{ ...entry, ...change }], config),
      /approved media-kit download/,
    );
  assert.throws(() => normalizeMediaKit(null, config), /expected an array/);
  const pdf = normalizeMediaKit(
    [
      {
        ...entry,
        downloadName: "Academy.pdf",
        file: {
          asset: {
            ...file,
            url: file.url.replace(".png", ".pdf"),
            mimeType: "application/pdf",
            extension: "pdf",
          },
        },
      },
    ],
    config,
  );
  assert.equal(pdf[0].format, "PDF");
  assert.equal(pdf[0].preview, undefined);
});

test("optional media-kit previews require trusted raster files and complete descriptions", () => {
  const preview = {
    alt: "Technische Testgrafik",
    credit: "Test fixture",
    asset: {
      url: "https://cdn.sanity.io/images/cmsqa123/qa/abc-800x600.png",
      mimeType: "image/png",
      size: 1024,
      metadata: { dimensions: { width: 800, height: 600 } },
    },
  };
  const result = normalizeMediaKit([{ ...entry, preview }], config);
  assert.match(result[0].preview.image, /w=720/);
  for (const change of [
    { ...preview, credit: " " },
    { ...preview, alt: " " },
    { ...preview, asset: { ...preview.asset, url: "https://evil.test/a.png" } },
    {
      ...preview,
      asset: {
        ...preview.asset,
        url: "https://cdn.sanity.io/images/cmsqa123/qa/fake.pdf",
      },
    },
    {
      ...preview,
      asset: {
        ...preview.asset,
        url: "https://cdn.sanity.io/images/cmsqa123/qa/nested/fake.png",
      },
    },
  ])
    assert.throws(
      () => normalizeMediaKit([{ ...entry, preview: change }], config),
      /preview image/,
    );
  assert.equal(
    normalizeMediaKit(
      [{ ...entry, preview: { ...preview, asset: null } }],
      config,
    )[0].preview,
    undefined,
  );
});

test("media-kit transport reads published content, checks file availability without credentials, and omits missing files", async () => {
  for (const token of [undefined, "test-token-never-real"]) {
    const calls = [];
    const result = await fetchMediaKit(
      { ...config, token },
      async (url, options) => {
        calls.push({ url: String(url), options });
        if (options.method === "HEAD") {
          assert.equal(
            new Headers(options.headers).has("Authorization"),
            false,
          );
          return new Response(null, { status: 200 });
        }
        assert.equal(url.searchParams.get("perspective"), "published");
        assert.equal(
          new Headers(options.headers).has("Authorization"),
          !!token,
        );
        assert.match(url.searchParams.get("query"), /contentApproved == true/);
        return Response.json({ result: [entry] });
      },
    );
    assert.equal(result.length, 1);
    assert.equal(calls.length, 2);
    assert.ok(calls.every((call) => call.options.redirect === "error"));
  }
  for (const status of [404, 410])
    assert.deepEqual(
      await fetchMediaKit(config, async (_url, options) =>
        options.method === "HEAD"
          ? new Response(null, { status })
          : Response.json({ result: [entry] }),
      ),
      [],
    );
  await assert.rejects(
    fetchMediaKit(config, async () => new Response(null, { status: 403 })),
    /403/,
  );
  await assert.rejects(
    fetchMediaKit(config, async (_url, options) =>
      options.method === "HEAD"
        ? new Response(null, { status: 503 })
        : Response.json({ result: [entry] }),
    ),
    /availability check/,
  );
});
