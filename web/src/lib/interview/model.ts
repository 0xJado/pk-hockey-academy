import {
  answerLimit,
  interviewDefinitions,
  type InterviewKind,
  type InterviewQuestion,
} from "../../data/interviews.ts";
import { interviewAiModel } from "./ai-policy.ts";

export interface InterviewAnswer {
  answer: string;
  followUpQuestion: string;
  followUpAnswer: string;
  followUpSource: "local-rules" | "browser-ai" | null;
}
export type InterviewStage = "welcome" | "question" | "review";

// Local fallback. Optional browser AI supplies a bounded question explicitly;
// this state model never sends interview answers anywhere.
export function localFollowUp(
  kind: InterviewKind,
  question: InterviewQuestion,
  answer: string,
): string {
  if (!question.followUp || !answer.trim()) return "";
  if (kind === "trainer")
    return answer.trim().split(/\s+/u).length < 38
      ? String(question.followUp)
      : "";
  if (answer.trim().length < 8) return "";
  switch (question.id) {
    case "story":
      return /papa|mama|vater|mutter|familie|bruder|schwester/iu.test(answer)
        ? "Wie war es, als du zum ersten Mal selbst auf dem Eis standest?"
        : "Was hat dir beim ersten Eishockeytraining am besten gefallen?";
    case "success":
      return /\btor(?:e|en)?\b/iu.test(answer)
        ? "Wie hast du dich gefühlt, als du das Tor geschossen hast?"
        : "Was war an diesem Moment besonders schön für dich?";
    case "idol":
      return "Was findest du an diesem Spieler oder Vorbild besonders cool?";
    case "dream":
      return "Was würdest du als Erstes machen, wenn dein Traum wahr wird?";
    case "strength":
      return "Wann hat dir diese Stärke zuletzt beim Spielen geholfen?";
    case "improve":
      return "Was fällt dir daran bisher am schwersten?";
    case "learn":
      return "Warum möchtest du genau das gerne lernen?";
    default:
      return "";
  }
}

const emptyAnswer = (): InterviewAnswer => ({
  answer: "",
  followUpQuestion: "",
  followUpAnswer: "",
  followUpSource: null,
});

export class InterviewSession {
  readonly kind: InterviewKind;
  stage: InterviewStage = "welcome";
  index = 0;
  following = false;
  private answers: Record<string, InterviewAnswer> = {};
  summary = "";
  summaryEdited = false;

  constructor(kind: InterviewKind) {
    this.kind = kind;
    this.reset();
  }
  get questions() {
    return interviewDefinitions[this.kind].questions;
  }
  get current() {
    return this.questions[this.index]!;
  }
  get prompt() {
    return this.following
      ? this.getAnswer(this.current.id).followUpQuestion
      : this.current.question;
  }
  get value() {
    const answer = this.getAnswer(this.current.id);
    return this.following ? answer.followUpAnswer : answer.answer;
  }
  getAnswer(id: string): InterviewAnswer {
    return { ...(this.answers[id] ?? emptyAnswer()) };
  }

  start() {
    this.stage = "question";
    this.index = 0;
    this.following = false;
  }
  reset() {
    this.summary = "";
    this.summaryEdited = false;
    this.answers = Object.fromEntries(
      this.questions.map((question) => [question.id, emptyAnswer()]),
    );
    this.stage = "welcome";
    this.index = 0;
    this.following = false;
  }
  edit(id: string, part: "answer" | "followUpAnswer", value: string) {
    if (!this.questions.some((question) => question.id === id))
      throw new Error("Unbekannte Interviewfrage.");
    if (value.length > answerLimit)
      throw new Error(`Bitte höchstens ${answerLimit} Zeichen verwenden.`);
    const answer = this.answers[id]!;
    if (answer[part] !== value) this.summary = "";
    answer[part] = value;
  }
  setSummary(text: string, edited = false) {
    if (text.length > 1200)
      throw new Error("Bitte höchstens 1200 Zeichen verwenden.");
    this.summary = text;
    this.summaryEdited = edited;
  }
  save(value: string) {
    this.edit(
      this.current.id,
      this.following ? "followUpAnswer" : "answer",
      value,
    );
  }
  advance(value: string, skip = false, aiQuestion?: string) {
    if (this.stage !== "question") return;
    if (!this.following && this.current.required && (skip || !value.trim()))
      throw new Error("Bitte gib einen Namen für das Testprofil ein.");
    const previous = this.getAnswer(this.current.id);
    if (
      aiQuestion !== undefined &&
      (!this.current.followUp ||
        this.current.internal ||
        !aiQuestion.endsWith("?") ||
        aiQuestion.length > 180)
    )
      throw new Error("Ungültige KI-Rückfrage.");
    this.save(skip ? "" : value);
    if (!this.following && skip) {
      this.answers[this.current.id]!.followUpQuestion = "";
      this.answers[this.current.id]!.followUpAnswer = "";
      this.answers[this.current.id]!.followUpSource = null;
    }
    if (!this.following && !skip) {
      const answer = this.answers[this.current.id]!;
      const keepAi =
        aiQuestion === undefined &&
        previous.answer === value &&
        previous.followUpSource === "browser-ai";
      const prompt =
        aiQuestion ??
        (keepAi
          ? previous.followUpQuestion
          : localFollowUp(this.kind, this.current, value));
      if (prompt !== answer.followUpQuestion) answer.followUpAnswer = "";
      answer.followUpQuestion = prompt;
      answer.followUpSource = prompt
        ? aiQuestion !== undefined || keepAi
          ? "browser-ai"
          : "local-rules"
        : null;
      if (answer.followUpQuestion) {
        this.following = true;
        return;
      }
    }
    this.following = false;
    if (this.index === this.questions.length - 1) this.stage = "review";
    else this.index++;
  }
  back(value: string) {
    this.save(value);
    if (this.following) this.following = false;
    else this.index = Math.max(0, this.index - 1);
  }
  goTo(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.questions.length)
      return;
    this.index = index;
    this.following = false;
    this.stage = "question";
  }
  validate() {
    return this.questions.find(
      (question) =>
        question.required && !this.getAnswer(question.id).answer.trim(),
    );
  }
  export(now = new Date()) {
    if (this.stage !== "review")
      throw new Error("Bitte zuerst das Interview abschließen und prüfen.");
    if (this.validate())
      throw new Error("Bitte den Namen im Testprofil ergänzen.");
    return {
      schemaVersion: 2,
      kind: this.kind,
      createdAt: now.toISOString(),
      testOnly: true,
      responseMode:
        this.summary ||
        Object.values(this.answers).some(
          (a) => a.followUpSource === "browser-ai",
        )
          ? "browser-ai-with-local-fallback"
          : "local-rules",
      aiSummary: this.summary
        ? {
            text: this.summary,
            model: interviewAiModel,
            edited: this.summaryEdited,
            verified: false,
          }
        : null,
      reviewedForPublication: false,
      containsInternalAnswers: this.questions.some(
        (question) =>
          question.internal && this.getAnswer(question.id).answer.trim(),
      ),
      answers: this.questions.map((question) => ({
        id: question.id,
        section: question.section,
        label: question.label,
        question: question.question,
        internal: question.internal === true,
        ...this.getAnswer(question.id),
      })),
    };
  }
}
