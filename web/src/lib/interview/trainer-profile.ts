import { interviewDefinitions } from "../../data/interviews.ts";
import type { InterviewAnswer } from "./model.ts";

export const trainerProductionQuestions = interviewDefinitions.trainer.questions.filter(
  ({ id }) => id !== "birth",
);

export function trainerProfilePrefill(
  answers: (id: string) => Pick<InterviewAnswer, "answer">,
) {
  return {
    name: answers("name").answer.trim(),
    role: answers("role").answer.trim(),
    biography: answers("intro").answer.trim(),
  };
}
