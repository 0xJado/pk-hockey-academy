import test from "node:test";
import assert from "node:assert/strict";
import { getStudioConfig } from "../config.ts";
import { getStudioAuthProvider, selectAuthProviders } from "../auth-policy.ts";

test("Studio configuration requires explicit safe project and dataset identifiers", () => {
  assert.throws(() => getStudioConfig({}), /noch nicht eingerichtet/);
  assert.throws(() =>
    getStudioConfig({
      SANITY_STUDIO_PROJECT_ID: "abc",
      SANITY_STUDIO_DATASET: "qa/evil",
    }),
  );
  assert.throws(() =>
    getStudioConfig({
      SANITY_STUDIO_PROJECT_ID: "abc@evil",
      SANITY_STUDIO_DATASET: "qa",
    }),
  );
  assert.deepEqual(
    getStudioConfig({
      SANITY_STUDIO_PROJECT_ID: " cmsqa123 ",
      SANITY_STUDIO_DATASET: " qa ",
    }),
    { projectId: "cmsqa123", dataset: "qa" },
  );
});
test("native login providers stay intact by default and invalid restrictions fail closed", () => {
  const providers = [
    { name: "google", url: "native-google" },
    { name: "github", url: "native-github" },
    { name: "sanity", url: "native-sanity" },
  ];
  assert.equal(getStudioAuthProvider({}), undefined);
  assert.equal(selectAuthProviders(providers, undefined), providers);
  assert.deepEqual(
    selectAuthProviders(
      providers,
      getStudioAuthProvider({ SANITY_STUDIO_AUTH_PROVIDER: "google" }),
    ),
    [providers[0]],
  );
  assert.deepEqual(selectAuthProviders(providers, "github"), [providers[1]]);
  assert.deepEqual(selectAuthProviders(providers, "sanity"), [providers[2]]);
  assert.throws(() =>
    getStudioAuthProvider({ SANITY_STUDIO_AUTH_PROVIDER: "evil" }),
  );
  assert.throws(
    () => selectAuthProviders([{ name: "google" }], "github"),
    /not available/,
  );
});
