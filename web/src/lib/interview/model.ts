import {
  answerLimit,
  interviewDefinitions,
  type InterviewKind,
  type InterviewQuestion,
} from "../../data/interviews.ts";

export interface InterviewAnswer {
  answer: string;
  followUpQuestion: string;
  followUpAnswer: string;
}
export type InterviewStage = "welcome" | "question" | "review";

// Local provider for the first preview. An AI provider must be an explicit,
// server-side integration; this module never sends interview answers anywhere.
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
});

export class InterviewSession {
  readonly kind: InterviewKind;
  stage: InterviewStage = "welcome";
  index = 0;
  following = false;
  private answers: Record<string, InterviewAnswer> = {};

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
    answer[part] = value;
  }
  save(value: string) {
    this.edit(
      this.current.id,
      this.following ? "followUpAnswer" : "answer",
      value,
    );
  }
  advance(value: string, skip = false) {
    if (this.stage !== "question") return;
    if (!this.following && this.current.required && (skip || !value.trim()))
      throw new Error("Bitte gib einen Namen für das Testprofil ein.");
    this.save(skip ? "" : value);
    if (!this.following && skip) {
      this.answers[this.current.id]!.followUpQuestion = "";
      this.answers[this.current.id]!.followUpAnswer = "";
    }
    if (!this.following && !skip) {
      const answer = this.answers[this.current.id]!;
      const prompt = localFollowUp(this.kind, this.current, value);
      if (prompt !== answer.followUpQuestion) answer.followUpAnswer = "";
      answer.followUpQuestion = prompt;
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
      schemaVersion: 1,
      kind: this.kind,
      createdAt: now.toISOString(),
      testOnly: true,
      responseMode: "local-rules",
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
