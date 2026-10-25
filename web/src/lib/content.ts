import {
  demoSessions,
  pricing,
  sessions,
  settings,
  venues,
} from "../data/academy.ts";
import type { TrainingSession } from "../types/content.ts";

// Replace this repository boundary with Sanity queries in a later milestone.
export const getAcademy = () => ({ settings, venues, pricing });
const timestamp = (value: string) =>
  /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN;
export function getPublishedSessions(
  source: TrainingSession[] = sessions,
): TrainingSession[] {
  return source
    .filter(
      (session) =>
        !session.isDemo &&
        session.status !== "draft" &&
        Number.isFinite(timestamp(session.startAt)) &&
        timestamp(session.endAt) > timestamp(session.startAt),
    )
    .sort((a, b) => timestamp(a.startAt) - timestamp(b.startAt));
}
export const getDemoSessions = () =>
  demoSessions.filter((session) => session.isDemo);
export function getRegistrationUrl(
  session: TrainingSession,
): string | undefined {
  if (
    session.isDemo ||
    session.status !== "open" ||
    session.availableSpots === 0 ||
    !session.spielerPlusUrl
  )
    return;
  try {
    const url = new URL(session.spielerPlusUrl);
    // SpielerPlus applies only to participants with multiple-session bookings.
    // Activate only after that participant-specific workflow is verified.
    // The entire integration stays disabled for this milestone.
    if (url.protocol !== "https:") return;
    return undefined;
  } catch {
    return;
  }
}
export const formatPrice = (price: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
