import test from "node:test";
import assert from "node:assert/strict";
import {
  signPreviewSession,
  verifyPreviewSession,
  safePreviewRedirect,
} from "../src/lib/preview-auth.ts";

test("draft access requires a valid unexpired signature, not a cookie flag", () => {
  const now = 1792965600000;
  const key = "synthetic-read-token-not-a-real-secret";
  const session = signPreviewSession(key, now);
  assert.equal(verifyPreviewSession(session, key, now), true);
  for (const value of [
    undefined,
    "true",
    "drafts",
    session.replace(/.$/, "z"),
    "1792965600." + "0".repeat(64),
  ]) {
    assert.equal(verifyPreviewSession(value, key, now), false);
  }
  assert.equal(verifyPreviewSession(session, undefined, now), false);
  assert.equal(verifyPreviewSession(session, "different-key", now), false);
  assert.equal(verifyPreviewSession(session, key, now + 3600_000), false);
  assert.equal(verifyPreviewSession(session, key, now - 1000), false);
});

test("preview redirects cannot leave the dedicated preview or retain credentials", () => {
  const fallback = "/redaktion/trainerpool";
  for (const value of [
    undefined,
    "//evil.invalid",
    "https://evil.invalid/redaktion/trainerpool",
    "/trainerpool",
    "/redaktion/trainerpool/../../api",
  ]) {
    assert.equal(safePreviewRedirect(value), fallback);
  }
  assert.equal(
    safePreviewRedirect(
      "/redaktion/trainerpool?id=drafts.coach&sanity-preview-secret=private&perspective=published",
    ),
    "/redaktion/trainerpool?id=coach&perspective=published",
  );
});
