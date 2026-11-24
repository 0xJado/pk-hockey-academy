import test from "node:test";
import assert from "node:assert/strict";
import { trainerProductionQuestions, trainerProfilePrefill } from "../src/lib/interview/trainer-profile.ts";

test("the trainer intake definition removes birth year and keeps optional internal contact", () => {
  assert.equal(trainerProductionQuestions.length, 13);
  assert.equal(trainerProductionQuestions.filter(({ followUp }) => followUp).length, 9);
  assert.deepEqual(trainerProductionQuestions.filter(({ required }) => required).map(({ id }) => id), ["name"]);
  assert.deepEqual(trainerProductionQuestions.filter(({ internal }) => internal).map(({ id }) => id), ["contact"]);
  assert.equal(trainerProductionQuestions.some(({ id }) => id === "birth"), false);
});

test("profile prefill copies only the three approved source answers", () => {
  const answers = {
    name: "  Beispiel Coach ",
    role: "",
    intro: "Ich trainiere Skating.\nMein Fokus liegt auf der Technik.",
    contact: "private@example.invalid",
    birth: "1980",
  };
  assert.deepEqual(trainerProfilePrefill((id) => ({ answer: answers[id] })), {
    name: "Beispiel Coach",
    role: "",
    biography: answers.intro,
  });
});
