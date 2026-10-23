import test from "node:test";
import assert from "node:assert/strict";
import { getStudioUrl } from "../src/lib/admin.ts";

test("admin entry has no destination until configured, and accepts a real HTTPS Studio subpath", () => {
  assert.equal(getStudioUrl({}), undefined);
  assert.equal(getStudioUrl({ PUBLIC_SANITY_STUDIO_URL: "  " }), undefined);
  assert.equal(
    getStudioUrl({
      PUBLIC_SANITY_STUDIO_URL: "https://pk-hockey-academy.sanity.studio/",
    }),
    "https://pk-hockey-academy.sanity.studio/",
  );
  assert.equal(
    getStudioUrl({ PUBLIC_SANITY_STUDIO_URL: "https://academy.de/redaktion" }),
    "https://academy.de/redaktion",
  );
});
test("invalid configured admin links fail explicitly without logging their value", () => {
  for (const url of [
    "http://academy.de",
    "javascript:alert(1)",
    "//academy.de",
    "https://username:password@academy.de/",
    "https://academy.de/?token=do-not-log",
    "https://academy.de/#fragment",
    "https://academy.de:8443/",
    "https://localhost/",
    "https://x.localhost/",
    "https://127.0.0.1/",
    "https://2130706433/",
    "https://0x7f000001/",
    "https://[::1]/",
    "https://192.168.1.1/",
    "https://10.0.0.1/",
    "https://example.com/",
    "https://x.example.org/",
    "https://studio.invalid/",
    "https://studio.test/",
    "https://studio.local/",
    "https://internal/",
    "bad-value",
  ])
    assert.throws(
      () => getStudioUrl({ PUBLIC_SANITY_STUDIO_URL: url }),
      (error) =>
        error.message.includes("PUBLIC_SANITY_STUDIO_URL") &&
        !error.message.includes(url),
    );
});
