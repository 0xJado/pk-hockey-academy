import { getUpcomingSessions } from "../src/lib/content.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTraining,
  getTrainingConfig,
  fetchTraining,
} from "../src/lib/training.ts";
import { validateSession } from "../../shared/training.ts";
const venue = {
  _id: "v",
  _type: "venue",
  city: "Teststadt",
  details: "Technischer Test",
  status: "active_city",
  visibility: "public",
  contentApproved: true,
};
const session = {
  _id: "s",
  _type: "trainingSession",
  title: "Testtermin",
  group: "Testgruppe",
  startAt: "2099-10-01T10:00:00+02:00",
  endAt: "2099-10-01T12:00:00+02:00",
  venue: { _ref: "v" },
  status: "open",
  isDemo: false,
  visibility: "public",
  contentApproved: true,
};
const data = (s = session, v = venue) => ({ venues: [v], sessions: [s] });
test("training CMS is explicitly opt-in and empty results stay empty", () => {
  assert.equal(getTrainingConfig({}), undefined);
  assert.throws(() => getTrainingConfig({ SANITY_TRAINING_ENABLED: "yes" }));
  assert.throws(() => getTrainingConfig({ SANITY_TRAINING_ENABLED: "true" }));
  assert.deepEqual(normalizeTraining({ venues: [], sessions: [] }), {
    venues: [],
    sessions: [],
  });
});
test("approved sessions need valid times, counts and approved active venues", () => {
  assert.equal(normalizeTraining(data()).sessions[0].availableSpots, null);
  for (const change of [
    { startAt: "2099-02-30T10:00:00Z" },
    { endAt: session.startAt },
    { startAt: "2099-10-01T10:00:00" },
    { availableSpots: -1 },
    { availableSpots: 1.5 },
    { availableSpots: "4" },
    { isDemo: true },
    { title: "  " },
    { venue: { _ref: "missing" } },
  ])
    assert.throws(
      () => normalizeTraining(data({ ...session, ...change })),
      JSON.stringify(change),
    );
  assert.throws(() =>
    normalizeTraining(data(session, { ...venue, status: "planned_city" })),
  );
  assert.throws(() =>
    normalizeTraining(data(session, { ...venue, contentApproved: false })),
  );
  assert.throws(() =>
    normalizeTraining({ ...data(), sessions: [session, session] }),
  );
  assert.notEqual(
    validateSession({ ...session, startAt: "2099-02-30T10:00:00Z" }),
    true,
  );
});
test("drafts, releases, withheld, unapproved and draft-status sessions never render", () => {
  for (const change of [
    { _id: "drafts.s" },
    { _id: "versions.release.s" },
    { visibility: "hidden" },
    { contentApproved: false },
    { status: "draft" },
  ])
    assert.equal(
      normalizeTraining(data({ ...session, ...change })).sessions.length,
      0,
    );
});
test("training transport is published-only, bounded, server authenticated and fails closed", async () => {
  const config = { projectId: "cmsqa123", dataset: "qa" };
  await fetchTraining(config, async (url, options) => {
    assert.equal(url.searchParams.get("perspective"), "published");
    assert.equal(options.headers, undefined);
    assert.ok(options.signal);
    assert.equal(options.redirect, "error");
    return new Response(JSON.stringify({ result: data() }));
  });
  await assert.rejects(
    fetchTraining(config, async () => new Response("", { status: 503 })),
  );
  await assert.rejects(
    fetchTraining(config, async () => {
      throw new Error("secret-provider-detail");
    }),
    /no local fallback/,
  );
  await assert.rejects(fetchTraining(config, async () => new Response("{}")));
});

test("upcoming sessions are ordered, retain cancellations and expire at the end", () => {
  const base = {
    id: "s",
    title: "Test",
    group: "Test",
    venueId: "v",
    startAt: "2099-10-01T10:00:00Z",
    endAt: "2099-10-01T12:00:00Z",
    status: "cancelled",
    availableSpots: null,
    isDemo: false,
  };
  assert.equal(getUpcomingSessions([base], Date.parse(base.endAt)).length, 0);
  assert.equal(getUpcomingSessions([base], Date.parse(base.startAt)).length, 1);
  assert.equal(
    getUpcomingSessions(
      [
        {
          ...base,
          id: "later",
          startAt: "2099-10-02T10:00:00Z",
          endAt: "2099-10-02T12:00:00Z",
        },
        base,
      ],
      0,
    )[0].id,
    "s",
  );
});
