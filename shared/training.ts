type Row = Record<string, unknown>;
const text = (v: unknown, max = 240): v is string =>
  typeof v === "string" && !!v.trim() && v.length <= max;
const time = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    v,
  )
    ? (() => {
        const [y, m, d] = v.slice(0, 10).split("-").map(Number);
        const check = new Date(Date.UTC(y, m - 1, d));
        return check.getUTCFullYear() === y &&
          check.getUTCMonth() === m - 1 &&
          check.getUTCDate() === d
          ? Date.parse(v)
          : NaN;
      })()
    : NaN;
export function validateVenue(v: Row): true | string {
  if (!text(v.city, 100) || !text(v.details, 2000))
    return "Stadt und Beschreibung fehlen oder sind zu lang.";
  if (!["active_city", "planned_city"].includes(String(v.status)))
    return "Standortstatus ungültig.";
  for (const key of ["rinkName", "address"])
    if (v[key] != null && v[key] !== "" && !text(v[key], 300))
      return "Hallenangaben ungültig.";
  return true;
}
export function validateSession(v: Row): true | string {
  if (!text(v.title, 160) || !text(v.group, 160))
    return "Titel und Gruppe fehlen oder sind zu lang.";
  const start = time(v.startAt),
    end = time(v.endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return "Gültige Zeitstempel mit Zeitzone erforderlich; Ende muss nach Beginn liegen.";
  if (!["open", "full", "cancelled", "draft"].includes(String(v.status)))
    return "Terminstatus ungültig.";
  if (
    v.availableSpots != null &&
    (!Number.isSafeInteger(v.availableSpots) ||
      (v.availableSpots as number) < 0)
  )
    return "Freie Plätze müssen leer oder eine nichtnegative ganze Zahl sein.";
  const ref = v.venue as Row | undefined;
  if (!ref || !text(ref._ref, 160)) return "Trainingsstätte fehlt.";
  if (v.isDemo !== false)
    return "Beispieltermine dürfen nicht veröffentlicht werden.";
  return true;
}
export const isPublishedTraining = (v: Row) =>
  typeof v._id === "string" &&
  !/^(drafts|versions)\./.test(v._id) &&
  v.visibility === "public" &&
  v.contentApproved === true;
