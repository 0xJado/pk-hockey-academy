export type SocialPlatform = "instagram" | "facebook";
export interface SocialPostFields {
  title: string;
  summary: string;
  platform: SocialPlatform;
  sourceUrl: string;
  fallbackUrl?: string;
  sourceStatus: "available" | "unavailable";
  displayOrder: number;
}

function sourceUrl(value: unknown, platform: SocialPlatform, profile: boolean) {
  if (typeof value !== "string" || value.length > 1000) return;
  try {
    const url = new URL(value.trim());
    const host = platform === "instagram" ? "instagram.com" : "facebook.com";
    if (url.protocol !== "https:" || url.port || url.username || url.password ||
      ![host, `www.${host}`].includes(url.hostname)) return;
    const route = url.pathname;
    let valid = false;
    if (profile) {
      valid = /^\/[A-Za-z0-9._-]{2,100}\/?$/.test(route) &&
        !/^\/(?:p|reel|reels|share|watch|l\.php|login|permalink\.php|photo\.php|sharer\.php|dialog|oauth)\/?$/i.test(route);
    } else if (platform === "instagram") {
      valid = /^\/(?:p|reel)\/[A-Za-z0-9_-]{3,100}\/?$/.test(route);
    } else {
      valid = /^\/[A-Za-z0-9._-]+\/posts\/[A-Za-z0-9_-]{3,200}\/?$/.test(route) ||
        /^\/reel\/\d{3,100}\/?$/.test(route);
    }
    if (!valid) return;
    url.hostname = `www.${host}`;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch { return; }
}

export function socialSourceUrl(value: unknown, platform: SocialPlatform) {
  return sourceUrl(value, platform, false);
}

const plain = (value: unknown, min: number, max: number) => {
  if (typeof value !== "string") return;
  const text = value.trim();
  if (text.length < min || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) return;
  return text;
};

export function parseSocialPost(value: unknown): SocialPostFields | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const raw = value as Record<string, unknown>;
  const platform = raw.platform;
  if (platform !== "instagram" && platform !== "facebook") return;
  const title = plain(raw.title, 2, 120);
  const summary = raw.summary == null ? "" : plain(raw.summary, 0, 700);
  const source = socialSourceUrl(raw.sourceUrl, platform);
  const fallback = raw.fallbackUrl ? sourceUrl(raw.fallbackUrl, platform, true) : undefined;
  if (!title || summary === undefined || !source || (raw.fallbackUrl && !fallback) ||
    (raw.sourceStatus !== "available" && raw.sourceStatus !== "unavailable") ||
    (raw.sourceStatus === "unavailable" && !fallback) ||
    typeof raw.displayOrder !== "number" || !Number.isSafeInteger(raw.displayOrder) ||
    raw.displayOrder < 0 || raw.displayOrder > 9999) return;
  return {
    title, summary, platform, sourceUrl: source,
    ...(fallback ? { fallbackUrl: fallback } : {}),
    sourceStatus: raw.sourceStatus, displayOrder: raw.displayOrder,
  };
}

export function validateSocialPublication(value: unknown): true | string {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  if (!parseSocialPost(raw)) return "Titel, Plattform, Beitragslink, Status und Reihenfolge prüfen. Bei nicht verfügbaren Beiträgen ist ein Academy-Profillink nötig.";
  if (raw.visibility !== "public" && raw.visibility !== "hidden") return "Website-Freigabe wählen.";
  if (raw.visibility === "public" && raw.contentApproved !== true)
    return "Beitrag, Wortlaut, Rechte und Academy-Zuordnung vor der Website-Freigabe bestätigen.";
  return true;
}
