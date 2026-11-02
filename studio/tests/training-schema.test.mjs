import test from "node:test";
import assert from "node:assert/strict";
import { createSchema, validateDocument } from "sanity";
import { venue, trainingSession } from "../schemaTypes/training.ts";
const schema = createSchema({
  name: "training-test",
  types: [venue, trainingSession],
});
const valid = {
  _id: "s",
  _type: "trainingSession",
  title: "Testtermin",
  group: "Testgruppe",
  startAt: "2099-10-01T10:00:00Z",
  endAt: "2099-10-01T12:00:00Z",
  venue: { _type: "reference", _ref: "v" },
  status: "open",
  isDemo: false,
  visibility: "public",
  contentApproved: true,
};
async function errors(change = {}, lookup = 1) {
  const client = {
    config: () => ({ projectId: "cmsqa123", dataset: "qa" }),
    withConfig() {
      return this;
    },
    fetch: async () => lookup,
  };
  const markers = await validateDocument({
    document: { ...valid, ...change },
    workspace: {
      schema,
      getClient: () => client,
      i18n: {
        currentLocale: { id: "de-DE" },
        loadNamespaces: async () => {},
        t: (key) => key,
      },
    },
    getClient: () => client,
    getDocumentExists: async () => true,
  });
  return markers.filter((x) => x.level === "error");
}
test("native training publication blocks invalid dates, capacity, approval and nonactive references", async () => {
  assert.equal((await errors()).length, 0);
  for (const change of [
    { title: " " },
    { startAt: "2099-02-30T10:00:00Z" },
    { availableSpots: -1 },
    { contentApproved: false },
    { isDemo: true },
    { venue: { _type: "reference", _ref: "drafts.v" } },
  ])
    assert.ok((await errors(change)).length, JSON.stringify(change));
  assert.ok((await errors({}, 0)).length);
});
