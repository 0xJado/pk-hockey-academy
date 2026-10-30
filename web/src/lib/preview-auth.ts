import { createHmac, timingSafeEqual } from "node:crypto";
import { getStudioUrl } from "./admin.ts";

export const previewCookie = "pk-editor-preview";
export const previewPath = "/redaktion/trainerpool";
const lifetime = 60 * 60;

// A signed, short-lived server session; neither a cookie flag nor a perspective
// supplied by the browser grants access to native drafts.
export function signPreviewSession(key: string, now = Date.now()): string {
  if (!key) throw new Error("Preview read token is required.");
  const expiry = String(Math.floor(now / 1000) + lifetime);
  return `${expiry}.${createHmac("sha256", key).update(`pk-preview:${expiry}`).digest("hex")}`;
}

export function verifyPreviewSession(
  value: string | undefined,
  key: string | undefined,
  now = Date.now(),
): boolean {
  if (!value || !key || !/^\d{10}\.[a-f0-9]{64}$/.test(value)) return false;
  const [expiry, signature] = value.split(".");
  const remaining = Number(expiry) - Math.floor(now / 1000);
  if (remaining <= 0 || remaining > lifetime) return false;
  const expected = createHmac("sha256", key)
    .update(`pk-preview:${expiry}`)
    .digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function safePreviewRedirect(value: string | undefined): string {
  if (!value) return previewPath;
  try {
    const base = "https://preview.invalid";
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname !== previewPath) return previewPath;
    // Only a selected document and perspective may survive the redirect.
    const result = new URL(previewPath, base);
    const id = url.searchParams.get("id");
    if (id && /^[a-zA-Z0-9_.-]{1,200}$/.test(id))
      result.searchParams.set("id", id.replace(/^drafts\./, ""));
    if (url.searchParams.get("perspective") === "published")
      result.searchParams.set("perspective", "published");
    return result.pathname + result.search;
  } catch {
    return previewPath;
  }
}

export const previewHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};

export function previewFrameAncestors(
  studioUrl: string | undefined,
  development = false,
): string {
  const studio = getStudioUrl({ PUBLIC_SANITY_STUDIO_URL: studioUrl });
  const origins = new Set(["'self'"]);
  if (studio) {
    origins.add(new URL(studio).origin);
    // Hosted Studio is itself framed by Sanity Dashboard. CSP checks every
    // ancestor, not only the direct Studio iframe parent.
    origins.add("https://www.sanity.io");
  }
  if (development) origins.add("http://localhost:3333");
  return `frame-ancestors ${[...origins].join(" ")}`;
}
