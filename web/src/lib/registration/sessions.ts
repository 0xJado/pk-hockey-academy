import type { TrainingSession, Venue } from "../../types/content.ts";

/** Input must come from the existing published training retrieval boundary.
 * Build-time availability is a display hint; PHP rechecks the current CMS record.
 */
export function requestableSessionOptions(sessions: TrainingSession[], venues: Venue[], now = Date.now()) {
  const active = new Map(venues.filter(venue => venue.status === "active_city").map(venue => [venue.id, venue]));
  const date = new Intl.DateTimeFormat("de-DE", {timeZone:"Europe/Berlin",dateStyle:"medium",timeStyle:"short"});
  return sessions.filter(session => {
    const start = Date.parse(session.startAt), end = Date.parse(session.endAt);
    return !session.isDemo && !/^(drafts|versions)\./.test(session.id) && session.status === "open"
      && active.has(session.venueId) && /(?:Z|[+-]\d{2}:\d{2})$/.test(session.startAt)
      && /(?:Z|[+-]\d{2}:\d{2})$/.test(session.endAt) && start > now && end > start
      && (session.availableSpots === null || (Number.isInteger(session.availableSpots) && session.availableSpots > 0));
  }).sort((a,b)=>Date.parse(a.startAt)-Date.parse(b.startAt)).map(session => ({
    id:session.id,label:`${date.format(new Date(session.startAt))} · ${active.get(session.venueId)!.city} · ${session.group}`,
  }));
}
