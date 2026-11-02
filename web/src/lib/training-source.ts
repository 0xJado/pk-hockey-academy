import { sessions, venues } from "../data/academy.ts";
import { fetchTraining, getTrainingConfig } from "./training.ts";
let pending: ReturnType<typeof fetchTraining> | undefined;
export async function getTraining() {
  const config = getTrainingConfig({
    SANITY_TRAINING_ENABLED: import.meta.env.SANITY_TRAINING_ENABLED,
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  if (!config) return { sessions, venues };
  return (pending ??= fetchTraining(config));
}
