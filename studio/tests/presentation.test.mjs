import test from "node:test";
import assert from "node:assert/strict";
import {
  getPreviewUrl,
  getTrainerPreviewOptions,
  trainerLocations,
} from "../lib/presentation.ts";

test("separate Studio and website ports resolve preview and enable URLs to the website", () => {
  const options = getTrainerPreviewOptions("http://localhost:4322");
  assert.equal(options.initial, "http://localhost:4322/redaktion/trainerpool");
  assert.equal(
    new URL(options.previewMode.enable, options.initial).href,
    "http://localhost:4322/api/preview/enable",
  );
  const deployed = getTrainerPreviewOptions("https://academy.vercel.app");
  assert.equal(
    deployed.initial,
    "https://academy.vercel.app/redaktion/trainerpool",
  );
});

test("Presentation is opt-in with an explicit preview origin", () => {
  assert.equal(getPreviewUrl(undefined), undefined);
  assert.equal(getPreviewUrl("http://localhost:4321"), "http://localhost:4321");
  assert.equal(
    getPreviewUrl("https://academy.sanity.studio/"),
    "https://academy.sanity.studio",
  );
  for (const value of [
    "http://external.invalid",
    "https://user:secret@example.org",
    "https://example.org/path",
    "https://example.org/?secret=value",
  ])
    assert.throws(() => getPreviewUrl(value));
});

test("new and existing profiles resolve to an authenticated preview", () => {
  const resolve = trainerLocations.locations.trainer.resolve;
  const result = resolve({
    name: "Technisches Testprofil",
    id: "drafts.test-profile",
  });
  assert.equal(
    result.locations[0].href,
    "/redaktion/trainerpool?id=test-profile",
  );
  assert.equal(result.locations[1].href, "/redaktion/trainerpool");
});
