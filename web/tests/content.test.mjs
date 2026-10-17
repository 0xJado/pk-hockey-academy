import test from "node:test";
import assert from "node:assert/strict";
import {
  getPublishedSessions,
  getRegistrationUrl,
} from "../src/lib/content.ts";

const session = {
  id: "test",
  title: "Test fixture only",
  startAt: "2030-01-05T10:00:00+01:00",
  endAt: "2030-01-05T12:00:00+01:00",
  group: "U13",
  venueId: "essen",
  status: "open",
  availableSpots: null,
  isDemo: false,
};
test("published sessions are chronological and exclude demos, drafts and invalid times", () => {
  const later = {
    ...session,
    id: "later",
    startAt: "2030-01-06T10:00:00+01:00",
    endAt: "2030-01-06T12:00:00+01:00",
  };
  const result = getPublishedSessions([
    later,
    { ...session, isDemo: true },
    { ...session, status: "draft" },
    { ...session, startAt: "2030-01-05T10:00:00" },
    { ...session, endAt: session.startAt },
    session,
  ]);
  assert.deepEqual(
    result.map((value) => value.id),
    ["test", "later"],
  );
});
test("integration remains inactive even when a URL is supplied", () => {
  for (const spielerPlusUrl of [
    undefined,
    "javascript:alert(1)",
    "not a url",
    "http://example.com",
    "https://example.com",
  ]) {
    assert.equal(getRegistrationUrl({ ...session, spielerPlusUrl }), undefined);
  }
});
test("demos and unavailable sessions cannot register", () => {
  assert.equal(
    getRegistrationUrl({
      ...session,
      isDemo: true,
      spielerPlusUrl: "https://example.com",
    }),
    undefined,
  );
  assert.equal(
    getRegistrationUrl({
      ...session,
      availableSpots: 0,
      spielerPlusUrl: "https://example.com",
    }),
    undefined,
  );
});
