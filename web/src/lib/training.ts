import {
  isPublishedTraining,
  validateSession,
  validateVenue,
} from "../../../shared/training.ts";
import { getGalleryConfig, type GalleryConfig } from "./gallery.ts";
import type { TrainingSession, Venue } from "../types/content.ts";
type Row = Record<string, unknown>;
export const TRAINING_QUERY = `{ "venues": *[_type == "venue" && visibility == "public" && contentApproved == true], "sessions": *[_type == "trainingSession" && visibility == "public" && contentApproved == true] }`;
export function getTrainingConfig(env: Record<string, string | undefined>) {
  const flag = env.SANITY_TRAINING_ENABLED?.trim();
  if (!flag || flag === "false") return;
  if (flag !== "true")
    throw new Error("SANITY_TRAINING_ENABLED must be true or false.");
  const config = getGalleryConfig(env);
  if (!config) throw new Error("Training CMS requires project and dataset.");
  return config;
}
export function normalizeTraining(raw: unknown): {
  venues: Venue[];
  sessions: TrainingSession[];
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid training response.");
  const data = raw as Row;
  const records = (key: string) => {
    if (!Array.isArray(data[key]))
      throw new Error("Invalid training collection.");
    const rows = (data[key] as unknown[])
      .filter(
        (x): x is Row => !!x && typeof x === "object" && !Array.isArray(x),
      )
      .filter(isPublishedTraining);
    if (new Set(rows.map((x) => x._id)).size !== rows.length)
      throw new Error("Duplicate training document.");
    return rows;
  };
  const venues = records("venues").map((v) => {
    if (v._type !== "venue" || validateVenue(v) !== true)
      throw new Error("Invalid approved venue.");
    return {
      id: v._id,
      city: (v.city as string).trim(),
      status: v.status,
      details: (v.details as string).trim(),
      rinkName: v.rinkName,
      address: v.address,
    } as Venue;
  });
  const sessions = records("sessions")
    .filter((v) => v.status !== "draft")
    .map((v) => {
      if (v._type !== "trainingSession" || validateSession(v) !== true)
        throw new Error("Invalid approved session.");
      const venueId = (v.venue as Row)._ref as string;
      if (!venues.some((x) => x.id === venueId && x.status === "active_city"))
        throw new Error("Session requires an approved active venue.");
      return {
        id: v._id,
        title: v.title,
        startAt: v.startAt,
        endAt: v.endAt,
        group: v.group,
        venueId,
        status: v.status,
        availableSpots: v.availableSpots ?? null,
        isDemo: false,
      } as TrainingSession;
    });
  return { venues, sessions };
}
export async function fetchTraining(
  config: GalleryConfig,
  request: typeof fetch = fetch,
) {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
  );
  url.searchParams.set("query", TRAINING_QUERY);
  url.searchParams.set("perspective", "published");
  let response: Response;
  try {
    response = await request(url, {
      headers: config.token
        ? { Authorization: `Bearer ${config.token}` }
        : undefined,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    throw new Error(
      "Training CMS request failed; no local fallback published.",
    );
  }
  if (!response.ok)
    throw new Error(`Training CMS failed (${response.status}).`);
  return normalizeTraining((await response.json()).result);
}
