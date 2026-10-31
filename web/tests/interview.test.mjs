import test from "node:test";
import assert from "node:assert/strict";
import { InterviewSession, localFollowUp } from "../src/lib/interview/model.ts";
import { interviewDefinitions, answerLimit } from "../src/data/interviews.ts";
import { SpeechCapture } from "../src/lib/interview/speech.ts";

test("both original question sets retain their ids, optional questions and separate private fields", () => {
  assert.equal(interviewDefinitions.player.questions.length, 15);
  assert.equal(interviewDefinitions.trainer.questions.length, 14);
  for (const { questions } of Object.values(interviewDefinitions)) {
    assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
    assert.ok(questions.every((q) => q.question && q.section && q.label));
  }
  assert.deepEqual(
    interviewDefinitions.trainer.questions
      .filter((q) => q.required)
      .map((q) => q.id),
    ["name"],
  );
  assert.deepEqual(
    interviewDefinitions.trainer.questions
      .filter((q) => q.internal)
      .map((q) => q.id),
    ["birth", "contact"],
  );
  assert.ok(interviewDefinitions.player.questions.every((q) => !q.required));
});

test("trainer name cannot be skipped or removed during review; no other requiredness is invented", () => {
  const session = new InterviewSession("trainer");
  session.start();
  assert.throws(() => session.advance("", true), /Namen/);
  assert.throws(() => session.advance("   "), /Namen/);
  assert.equal(session.index, 0);
  session.advance("Testcoach");
  while (session.stage === "question") session.advance("", true);
  assert.equal(session.stage, "review");
  session.edit("name", "answer", "");
  assert.throws(() => session.export(), /Namen/);
  session.edit("name", "answer", "Korrigierter Testcoach");
  assert.equal(session.export().answers[0].answer, "Korrigierter Testcoach");
});

test("back and follow-up navigation preserve separate answers, with no duplicate or unbounded follow-up loop", () => {
  const session = new InterviewSession("player");
  session.start();
  session.goTo(7);
  session.advance("Meine Familie hat mich zum Eishockey gebracht.");
  assert.equal(session.following, true);
  assert.match(session.prompt, /ersten Mal/);
  session.back("Das erste Eis war aufregend.");
  assert.equal(session.following, false);
  assert.match(session.value, /Familie/);
  session.advance(session.value);
  assert.equal(session.value, "Das erste Eis war aufregend.");
  session.advance(session.value);
  assert.equal(session.index, 8);
  assert.equal(session.following, false);
  session.back("Mein Testvorbild");
  assert.equal(session.index, 7);
  session.advance("Ich habe zufällig ein Training gesehen.");
  assert.match(session.prompt, /ersten Eishockeytraining/);
  assert.equal(session.value, "");
  session.advance("", true);
  assert.equal(session.index, 8);
});

test("skipping an existing base answer clears its follow-up instead of exporting orphaned data", () => {
  const session = new InterviewSession("player");
  session.start();
  session.goTo(10);
  session.advance("Ich habe ein Tor geschossen.");
  session.advance("Ich war stolz.");
  session.goTo(10);
  session.advance("", true);
  assert.deepEqual(session.getAnswer("success"), {
    answer: "",
    followUpQuestion: "",
    followUpAnswer: "",
    followUpSource: null,
  });
});

test("review preserves literal text and follow-up answers; exports are explicitly unapproved versioned test profiles", () => {
  const session = new InterviewSession("trainer");
  session.start();
  session.advance("Testcoach");
  session.goTo(2);
  session.advance("Testrolle");
  session.advance("Testschwerpunkt");
  while (session.stage === "question") session.advance("", true);
  session.edit("role", "answer", "<img src=x onerror=alert(1)>");
  session.edit("contact", "answer", "intern@example.invalid");
  const result = session.export(new Date("2026-10-30T12:00:00Z"));
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.testOnly, true);
  assert.equal(result.reviewedForPublication, false);
  assert.equal(result.responseMode, "local-rules");
  assert.equal(result.containsInternalAnswers, true);
  assert.equal(
    result.answers.find((q) => q.id === "role").followUpAnswer,
    "Testschwerpunkt",
  );
  assert.match(result.answers.find((q) => q.id === "role").answer, /^<img/);
  assert.equal(result.createdAt, "2026-10-30T12:00:00.000Z");
  session.reset();
  assert.equal(session.stage, "welcome");
  assert.ok(
    session.questions.every((q) =>
      Object.values(session.getAnswer(q.id)).every(
        (v) => v === "" || v === null,
      ),
    ),
  );
  assert.throws(() => session.export(), /abschließen/);
});

test("answer limits reject oversized values, and local follow-ups do not invent a goal from Torwart", () => {
  const session = new InterviewSession("player");
  session.start();
  assert.throws(
    () => session.advance("x".repeat(answerLimit + 1)),
    /höchstens/,
  );
  assert.equal(session.index, 0);
  const question = interviewDefinitions.player.questions.find(
    (q) => q.id === "success",
  );
  assert.match(
    localFollowUp("player", question, "Ich wurde Torwart in meinem Team."),
    /Moment/,
  );
  assert.match(
    localFollowUp("player", question, "Ich habe zwei Tore geschossen."),
    /Tor geschossen/,
  );
});

function speechHarness() {
  const instances = [],
    statuses = [],
    listening = [],
    transcripts = [];
  class Recognition {
    constructor() {
      instances.push(this);
      this.onstart = this.onresult = this.onerror = this.onend = null;
    }
    start() {
      this.started = true;
    }
    stop() {
      this.stopped = true;
    }
    abort() {
      this.aborted = true;
    }
  }
  const capture = new SpeechCapture(
    Recognition,
    true,
    (text) => statuses.push(text),
    (value) => listening.push(value),
  );
  return {
    capture,
    instances,
    statuses,
    listening,
    transcripts,
    receive: (text) => transcripts.push(text),
  };
}

test("voice binds callbacks to their session and rejects late results/errors/end events after a question change", () => {
  const h = speechHarness();
  h.capture.start("Erste Antwort", h.receive);
  const old = h.instances[0],
    late = old.onresult,
    lateError = old.onerror,
    lateEnd = old.onend;
  h.capture.cancel();
  assert.equal(old.aborted, true);
  h.capture.start("Zweite Antwort", h.receive);
  late({ results: [[{ transcript: "Verspäteter Text" }]] });
  lateError({ error: "network" });
  lateEnd();
  assert.deepEqual(h.transcripts, []);
  assert.equal(h.capture.active, true);
  h.instances[1].onresult({ results: [[{ transcript: "Aktueller Text" }]] });
  assert.deepEqual(h.transcripts, ["Zweite Antwort Aktueller Text"]);
});

test("voice prevents duplicate starts while permission is pending and preserves interim replacement rather than duplication", () => {
  const h = speechHarness();
  h.capture.start("Vorhanden", h.receive);
  h.capture.start("Andere", h.receive);
  assert.equal(h.instances.length, 1);
  h.instances[0].onresult({ results: [[{ transcript: "Halb" }]] });
  h.instances[0].onresult({ results: [[{ transcript: "Ganze Antwort" }]] });
  assert.deepEqual(h.transcripts, [
    "Vorhanden Halb",
    "Vorhanden Ganze Antwort",
  ]);
  h.capture.stop();
  h.capture.stop();
  assert.equal(h.instances[0].stopped, true);
  h.instances[0].onend();
  assert.equal(h.capture.active, false);
});

test("voice denial ends capture with a text fallback and never activates unsupported recognition", () => {
  const h = speechHarness();
  h.capture.start("", h.receive);
  h.instances[0].onerror({ error: "not-allowed" });
  assert.equal(h.capture.active, false);
  assert.match(h.statuses.at(-1), /tippen/);
  const unavailable = new SpeechCapture(
    undefined,
    true,
    () => {},
    () => {},
  );
  assert.equal(unavailable.supported, false);
  unavailable.start("", h.receive);
  assert.equal(unavailable.active, false);
  const insecure = new SpeechCapture(
    class {
      constructor() {
        throw new Error("must not construct");
      }
    },
    false,
    () => {},
    () => {},
  );
  assert.equal(insecure.supported, false);
  insecure.start("", h.receive);
});
