import { parseSocialPost, type SocialPostFields } from "../../../shared/social-post.ts";
import { getGalleryConfig, type GalleryConfig } from "./gallery.ts";

export interface SocialPost extends SocialPostFields { id: string }
export const SOCIAL_POST_QUERY = `*[
  _type == "socialPost" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  visibility == "public" && contentApproved == true
] | order(displayOrder asc, _id asc) [0...6] {
  _id, _type, title, summary, platform, sourceUrl, fallbackUrl, sourceStatus,
  displayOrder, visibility, contentApproved
}`;

export function getSocialConfig(env: Record<string, string | undefined>): GalleryConfig | undefined {
  const enabled = env.SANITY_SOCIAL_ENABLED?.trim();
  if (enabled && enabled !== "true" && enabled !== "false") throw new Error("SANITY_SOCIAL_ENABLED must be true or false.");
  if (enabled !== "true") return;
  const config = getGalleryConfig(env);
  if (!config) throw new Error("Social posts require SANITY_PROJECT_ID and SANITY_DATASET.");
  return config;
}

export function parseSocialPosts(value: unknown): SocialPost[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Invalid social-post CMS response.");
  const result: SocialPost[] = [];
  const ids = new Set<string>(), sources = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || typeof raw._id !== "string" ||
      !/^[A-Za-z0-9_.-]+$/.test(raw._id) || raw._id.startsWith("drafts.") ||
      raw._id.startsWith("versions.") || raw._type !== "socialPost" ||
      raw.visibility !== "public" || raw.contentApproved !== true) continue;
    const fields = parseSocialPost(raw);
    if (!fields || ids.has(raw._id) || sources.has(fields.sourceUrl)) throw new Error("Invalid or duplicate approved social post. Correct the content before rebuilding.");
    ids.add(raw._id); sources.add(fields.sourceUrl);
    result.push({ id: raw._id, ...fields });
  }
  return result.sort((a,b) => a.displayOrder-b.displayOrder || a.id.localeCompare(b.id, "en")).slice(0,6);
}

export async function fetchSocialPosts(config: GalleryConfig, request: typeof fetch = fetch) {
  const url = new URL(`https://${config.projectId}.api.sanity.io/v2025-02-19/data/query/${config.dataset}`);
  url.searchParams.set("query", SOCIAL_POST_QUERY);
  url.searchParams.set("perspective", "published");
  const response = await request(url, {
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
    signal: AbortSignal.timeout(15000), redirect: "error",
  });
  if (!response.ok) throw new Error(`Social-post CMS request failed (${response.status}).`);
  const body: unknown = await response.json();
  return parseSocialPosts(body && typeof body === "object" && "result" in body ? body.result : undefined);
}

export async function getSocialPosts() {
  const config = getSocialConfig({
    SANITY_SOCIAL_ENABLED: import.meta.env.SANITY_SOCIAL_ENABLED,
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  return config ? fetchSocialPosts(config) : [];
}
