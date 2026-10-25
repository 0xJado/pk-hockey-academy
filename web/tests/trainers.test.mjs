import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchTrainers,
  getTrainerConfig,
  normalizeTrainers,
  trainerImageUrl,
  TRAINERS_QUERY,
} from "../src/lib/trainers.ts";
import {
  parseTrainerFields,
  validateTrainerPublication,
} from "../../shared/trainer-profile.ts";
import { trainers } from "../src/data/academy.ts";

// Synthetic records are transport fixtures only. Never imported into the website.
const config = {
  projectId: "cmsqa123",
  dataset: "qa",
  token: "test-token-never-real",
};
const coach = {
  _id: "fixture-coach",
  _type: "trainer",
  name: "Technisches Testprofil",
  role: "Testrolle",
  biography: "Dieses technische Testprofil stellt keinen echten Trainer vor.",
  verifiedBackground: ["Technischer Testdatensatz"],
  qualifications: [],
  specialties: [],
  displayOrder: 20,
  active: true,
  visibility: "public",
  contentApproved: true,
};
const portrait = {
  alt: "Technische Testgrafik ohne echte Person",
  credit: "Test fixture",
  asset: {
    url: "https://cdn.sanity.io/images/cmsqa123/qa/abc-800x1000.webp",
    mimeType: "image/webp",
    size: 1024,
    metadata: { dimensions: { width: 800, height: 1000 } },
  },
};

test("coach migration is opt-in and incomplete/invalid configuration fails closed", () => {
  assert.equal(getTrainerConfig({}), undefined);
  assert.equal(
    getTrainerConfig({ SANITY_TRAINERS_ENABLED: "false" }),
    undefined,
  );
  assert.equal(getTrainerConfig({ SANITY_PROJECT_ID: "abc" }), undefined);
  assert.throws(() => getTrainerConfig({ SANITY_TRAINERS_ENABLED: "yes" }));
  assert.throws(() => getTrainerConfig({ SANITY_TRAINERS_ENABLED: "true" }));
  for (const project of ["host.invalid/", "abc?x=", "abc@evil", "abc\ndef"]) {
    assert.throws(() =>
      getTrainerConfig({
        SANITY_TRAINERS_ENABLED: "true",
        SANITY_PROJECT_ID: project,
        SANITY_DATASET: "qa",
        SANITY_READ_TOKEN: "test",
      }),
    );
  }
  assert.deepEqual(
    getTrainerConfig({
      SANITY_TRAINERS_ENABLED: "true",
      SANITY_PROJECT_ID: "cmsqa123",
      SANITY_DATASET: "qa",
      SANITY_READ_TOKEN: config.token,
    }),
    config,
  );
  assert.deepEqual(
    getTrainerConfig({
      SANITY_TRAINERS_ENABLED: "true",
      SANITY_PROJECT_ID: "cmsqa123",
      SANITY_DATASET: "qa",
    }),
    { projectId: "cmsqa123", dataset: "qa" },
  );
});

test("only active approved published coaches survive independently of query filtering", () => {
  const hidden = [
    { _id: "drafts.fixture" },
    { _id: "versions.release.fixture" },
    { visibility: "hidden" },
    { contentApproved: false },
    { contentApproved: "true" },
    { active: false },
    { active: "true" },
    { _type: "galleryCamp" },
    { _id: "bad/id" },
  ].map((change) => ({ ...coach, ...change }));
  const result = normalizeTrainers([...hidden, coach, coach], config);
  assert.deepEqual(
    result.map((item) => item.id),
    [coach._id],
  );
  assert.deepEqual(normalizeTrainers([], config), []);
  assert.deepEqual(
    normalizeTrainers([{ ...coach, visibility: "hidden" }], config),
    [],
  );
});

test("ordering is deterministic and CMS removal does not restore the starter profile", () => {
  assert.deepEqual(
    normalizeTrainers(
      [
        { ...coach, _id: "a.coach" },
        { ...coach, _id: "A.coach" },
      ],
      config,
    ).map((item) => item.id),
    ["A.coach", "a.coach"],
  );
  const source = [
    { ...coach, _id: "z", displayOrder: 30 },
    { ...coach, _id: "b" },
    { ...coach, _id: "a" },
  ];
  assert.deepEqual(
    normalizeTrainers(source, config).map((item) => item.id),
    ["a", "b", "z"],
  );
  assert.deepEqual(
    normalizeTrainers(
      source.filter((item) => item._id !== "b"),
      config,
    ).map((item) => item.id),
    ["a", "z"],
  );
  assert.deepEqual(normalizeTrainers([], config), []);
  assert.equal(parseTrainerFields(trainers[0]).name, "Pierre Klein");
});

test("invalid approved records fail the build rather than silently deleting public content", () => {
  for (const change of [
    { name: " " },
    { role: {} },
    { biography: "short" },
    { biography: "a".repeat(4001) },
    { verifiedBackground: [] },
    { verifiedBackground: [" "] },
    { qualifications: [9] },
    { specialties: Array(13).fill("Test") },
    { displayOrder: -1 },
    { displayOrder: 0.5 },
    { displayOrder: "0" },
    { displayOrder: Infinity },
    { name: "A\u0000B" },
  ])
    assert.throws(
      () => normalizeTrainers([{ ...coach, ...change }], config),
      /invalid required fields/,
    );
  assert.throws(
    () => normalizeTrainers({ result: [] }, config),
    /expected an array/,
  );
});

test("portrait is optional but uploaded assets require trusted URLs and valid metadata", () => {
  const [result] = normalizeTrainers([{ ...coach, portrait }], config);
  assert.equal(result.portrait.alt, portrait.alt);
  assert.equal(normalizeTrainers([coach], config)[0].portrait, undefined);
  for (const url of [
    "https://evil.invalid/x.webp",
    "https://cdn.sanity.io.evil.invalid/images/cmsqa123/qa/a.webp",
    "https://cdn.sanity.io/images/other/qa/abc.webp",
    "https://cdn.sanity.io/images/cmsqa123/other/abc.webp",
    "https://cdn.sanity.io/images/cmsqa123/qa/abc.svg",
    "https://cdn.sanity.io/images/cmsqa123/qa/sub/abc.webp",
    "https://user:pass@cdn.sanity.io/images/cmsqa123/qa/abc.webp",
    portrait.asset.url + "?token=secret",
    portrait.asset.url + "#fragment",
    "javascript:alert(1)",
  ])
    assert.throws(
      () =>
        normalizeTrainers(
          [
            {
              ...coach,
              portrait: { ...portrait, asset: { ...portrait.asset, url } },
            },
          ],
          config,
        ),
      /portrait/,
    );
  for (const change of [
    { size: NaN },
    { size: -1 },
    { size: 13 * 1024 * 1024 },
    { mimeType: "image/svg+xml" },
    { metadata: { dimensions: { width: "800", height: 1000 } } },
  ]) {
    assert.throws(
      () =>
        normalizeTrainers(
          [
            {
              ...coach,
              portrait: {
                ...portrait,
                asset: { ...portrait.asset, ...change },
              },
            },
          ],
          config,
        ),
      /portrait/,
    );
  }
  assert.throws(
    () =>
      normalizeTrainers(
        [{ ...coach, portrait: { ...portrait, alt: " " } }],
        config,
      ),
    /portrait/,
  );
  assert.equal(
    new URL(trainerImageUrl(result.portrait, 1200)).searchParams.get("w"),
    "800",
  );
});

test("shared validation accepts approved verified content and rejects missing approval", () => {
  assert.equal(validateTrainerPublication(coach), true);
  assert.notEqual(
    validateTrainerPublication({ ...coach, contentApproved: false }),
    true,
  );
  assert.equal(
    validateTrainerPublication({
      ...coach,
      visibility: "hidden",
      contentApproved: false,
    }),
    true,
  );
  assert.notEqual(
    validateTrainerPublication({ ...coach, qualifications: [" "] }),
    true,
  );
  assert.notEqual(
    validateTrainerPublication({
      ...coach,
      portrait: { ...portrait, alt: " " },
    }),
    true,
  );
});

test("public trainer transport needs no token and still excludes drafts and withheld profiles", async () => {
  const result = await fetchTrainers(
    { projectId: config.projectId, dataset: config.dataset },
    async (input, options) => {
      const url = new URL(input);
      assert.equal(new Headers(options.headers).has("Authorization"), false);
      assert.equal(url.searchParams.get("perspective"), "published");
      assert.equal(options.redirect, "error");
      return new Response(JSON.stringify({ result: [
        coach,
        { ...coach, _id: "drafts.fixture" },
        { ...coach, _id: "versions.release.fixture" },
        { ...coach, _id: "hidden", visibility: "hidden" },
        { ...coach, _id: "unapproved", contentApproved: false },
      ] }));
    },
  );
  assert.deepEqual(result.map((item) => item.id), [coach._id]);
});

test("build transport is published-only, fresh, bounded and keeps the read token server-side", async () => {
  const result = await fetchTrainers(config, async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://cmsqa123.api.sanity.io");
    assert.equal(url.searchParams.get("perspective"), "published");
    assert.equal(url.searchParams.get("query"), TRAINERS_QUERY);
    assert.match(TRAINERS_QUERY, /drafts\.\*\*/);
    assert.match(TRAINERS_QUERY, /versions\.\*\*/);
    assert.equal(url.href.includes(config.token), false);
    assert.equal(options.headers.Authorization, `Bearer ${config.token}`);
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ result: [coach] }));
  });
  assert.equal(result.length, 1);
  for (const status of [401, 403, 429, 500])
    await assert.rejects(
      fetchTrainers(
        config,
        async () => new Response("private details", { status }),
      ),
      new RegExp(String(status)),
    );
  await assert.rejects(
    fetchTrainers(config, async () => {
      throw new Error(config.token);
    }),
    (error) => !error.message.includes(config.token),
  );
  await assert.rejects(
    fetchTrainers(config, async () => new Response("not-json")),
    /invalid JSON/,
  );
  await assert.rejects(
    fetchTrainers(
      config,
      async () => new Response(JSON.stringify({ result: null })),
    ),
    /expected an array/,
  );
});
