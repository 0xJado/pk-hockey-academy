import { trainers as localTrainers } from "../data/academy.ts";
import { fetchTrainers, getTrainerConfig } from "./trainers.ts";
import type { Trainer } from "../types/content.ts";

// Server/build-time only. Once enabled, an empty CMS stays empty: no resurrected profiles.
let pending: Promise<Trainer[]> | undefined;
export async function getTrainers(): Promise<Trainer[]> {
  // Astro substitutes server-only settings by property access; do not spread import.meta.env.
  const config = getTrainerConfig({
    SANITY_TRAINERS_ENABLED: import.meta.env.SANITY_TRAINERS_ENABLED,
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  if (!config) return localTrainers.filter((trainer) => trainer.active);
  return (pending ??= fetchTrainers(config));
}
