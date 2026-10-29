import test from "node:test";
import assert from "node:assert/strict";
import { normalizePreviewTrainers } from "../src/lib/trainer-preview-source.ts";
import { normalizeTrainers } from "../src/lib/trainers.ts";

const config = { projectId: "cmsqa123", dataset: "qa" };
const draft = {
  _id: "drafts.technical-fixture",
  _type: "trainer",
  name: "Technisches Testprofil",
  role: "Testrolle",
  biography: "Reiner technischer Datensatz für die Vorschauprüfung.",
  verifiedBackground: ["Technischer Testdatensatz"],
  displayOrder: 10,
  active: false,
  contentApproved: false,
  visibility: "hidden",
};

test("withheld native drafts render only in the private preview adapter", () => {
  assert.deepEqual(normalizeTrainers([draft], config), []);
  const result = normalizePreviewTrainers([draft], config);
  assert.equal(result.trainers[0].id, "technical-fixture");
  assert.equal(result.trainers[0].name, draft.name);
  assert.equal(result.incomplete.length, 0);
  assert.deepEqual(normalizeTrainers([draft], config), []);
});

test("new and incomplete trainer entries have an editable completion placeholder", () => {
  const result = normalizePreviewTrainers(
    [{ _id: "drafts.new-fixture", _type: "trainer" }],
    config,
  );
  assert.equal(result.trainers.length, 0);
  assert.deepEqual(result.incomplete, [
    { id: "new-fixture", name: "Neues Trainerprofil" },
  ]);
});
