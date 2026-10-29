import type {
  GalleryAlbum,
  GalleryImage,
  GalleryMedia,
  GallerySection,
} from "../types/gallery.ts";
import {
  galleryText,
  parseGalleryAlbumFields,
  validateGalleryImageFields,
  validateGalleryPublication,
} from "../../../shared/gallery-content.ts";
import { validateAsset } from "../../../shared/media-validation.ts";

export interface GalleryConfig {
  projectId: string;
  dataset: string;
  token?: string;
}

export function getGalleryConfig(
  env: Record<string, string | undefined>,
): GalleryConfig | undefined {
  const projectId = env.SANITY_PROJECT_ID?.trim();
  const dataset = env.SANITY_DATASET?.trim();
  const token = env.SANITY_READ_TOKEN?.trim();
  if (!projectId && !dataset && !token) return;
  if (
    !projectId ||
    !/^[a-z0-9]+$/.test(projectId) ||
    !dataset ||
    !/^[a-z0-9_-]+$/.test(dataset)
  ) {
    throw new Error(
      "Gallery CMS configuration incomplete: set SANITY_PROJECT_ID and SANITY_DATASET. A public dataset needs no read token.",
    );
  }
  return { projectId, dataset, ...(token ? { token } : {}) };
}

// Explicitly published perspective AND document filters: no drafts or releases.
export const GALLERY_QUERY = `*[
  _type == "galleryCamp" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  visibility == "public" && rightsConfirmed == true
] | order(occurredOn desc, _id asc) {
  _id, title, "slug": slug.current, occurredOn, city, description, visibility, rightsConfirmed,
  media[]{_key, _type, section, spotlight, alt, caption, credit, title, transcript,
    asset->{url, mimeType, size, metadata{dimensions{width,height}}},
    file{asset->{url,mimeType,size}},
    poster{alt,credit,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
  }
}`;

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, max: number) => galleryText(value, 0, max) ?? "";

const section = (value: unknown): GallerySection =>
  value === "on-ice" || value === "off-ice" ? value : "other";

export function groupGalleryMedia(media: GalleryMedia[]) {
  return [
    { id: "on-ice" as const, title: "On-Ice" },
    { id: "off-ice" as const, title: "Off-Ice" },
    { id: "other" as const, title: "Weitere Camp-Momente" },
  ]
    .map((group) => ({
      ...group,
      media: media.filter((item) => section(item.section) === group.id),
    }))
    .filter((group) => group.media.length > 0);
}

function assetUrl(
  value: unknown,
  folder: "images" | "files",
  config: Pick<GalleryConfig, "projectId" | "dataset">,
): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (
      url.origin !== "https://cdn.sanity.io" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return;
    if (
      !url.pathname.startsWith(
        `/${folder}/${config.projectId}/${config.dataset}/`,
      )
    )
      return;
    const file = url.pathname.split("/").at(-1) ?? "";
    if (!/^[a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp|mp4|webm)$/.test(file)) return;
    return url.href;
  } catch {
    return;
  }
}

function image(
  value: unknown,
  id: string,
  config: Pick<GalleryConfig, "projectId" | "dataset">,
): GalleryImage | undefined {
  const raw = record(value);
  const asset = record(raw.asset);
  const url = assetUrl(asset.url, "images", config);
  const dimensions = record(record(asset.metadata).dimensions);
  const width = dimensions.width;
  const height = dimensions.height;
  const alt = text(raw.alt, 240);
  const credit = text(raw.credit, 160);
  if (
    !url ||
    !/\.(?:jpe?g|png|webp)$/.test(url) ||
    validateGalleryImageFields(raw) !== true ||
    validateAsset("image", asset) !== true ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    return;
  return {
    type: "image",
    section: section(raw.section),
    spotlight:
      raw.spotlight === "left" || raw.spotlight === "right"
        ? raw.spotlight
        : undefined,
    id,
    url,
    width,
    height,
    alt,
    credit,
    caption: text(raw.caption, 240) || undefined,
  };
}

export function normalizeGallery(
  source: unknown,
  config: Pick<GalleryConfig, "projectId" | "dataset">,
): GalleryAlbum[] {
  if (!Array.isArray(source))
    throw new Error("Invalid gallery CMS response: expected an array.");
  const albums: GalleryAlbum[] = [];
  const slugs = new Set<string>();
  const ids = new Set<string>();
  for (const value of source) {
    const raw = record(value);
    const id = text(raw._id, 200);
    if (
      id.startsWith("drafts.") ||
      id.startsWith("versions.") ||
      raw.visibility !== "public" ||
      raw.rightsConfirmed !== true
    )
      continue;
    function invalid(reason: string): never {
      const label = /^[a-zA-Z0-9_.-]{1,200}$/.test(id) ? ` (${id})` : "";
      throw new Error(
        `An approved gallery album${label} has invalid content: ${reason} Correct it in Sanity before rebuilding.`,
      );
    }
    if (!/^[a-zA-Z0-9_.-]{1,200}$/.test(id) || ids.has(id))
      invalid("missing or duplicate document ID.");
    const validation = validateGalleryPublication(raw);
    if (validation !== true) invalid(validation);
    const fields = parseGalleryAlbumFields(raw);
    if (!fields) invalid("invalid album fields.");
    if (slugs.has(fields.slug)) invalid("duplicate album route.");
    const media: GalleryMedia[] = [];
    for (const entry of raw.media as unknown[]) {
      const item = record(entry);
      const key = text(item._key, 200);
      if (item._type === "galleryPhoto") {
        const photo = image(item, key, config);
        if (!photo) invalid("invalid photo asset or metadata.");
        media.push(photo);
      } else if (item._type === "galleryVideo") {
        const asset = record(record(item.file).asset);
        const url = assetUrl(asset.url, "files", config);
        const poster = image(item.poster, `${key}-poster`, config);
        const videoTitle = text(item.title, 120);
        const transcript = text(item.transcript, 6000);
        const credit = text(item.credit, 160);
        const mimeType = asset.mimeType;
        if (
          url &&
          poster &&
          videoTitle &&
          transcript.length >= 20 &&
          credit &&
          (mimeType === "video/mp4" || mimeType === "video/webm") &&
          url.endsWith(mimeType === "video/mp4" ? ".mp4" : ".webm") &&
          validateAsset("video", asset) === true
        ) {
          media.push({
            type: "video",
            section: section(item.section),
            id: key,
            title: videoTitle,
            url,
            mimeType,
            poster,
            transcript,
            credit,
            caption: text(item.caption, 240) || undefined,
          });
        } else invalid("invalid video file, poster or metadata.");
      }
    }
    const first = media[0];
    if (!first) invalid("no valid media.");
    slugs.add(fields.slug);
    ids.add(id);
    albums.push({
      id,
      ...fields,
      media,
      cover: first.type === "image" ? first : first.poster,
    });
  }
  return albums.sort(
    (a, b) =>
      b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id),
  );
}

export async function fetchGallery(
  config: GalleryConfig,
  request: typeof fetch = fetch,
): Promise<GalleryAlbum[]> {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
  );
  url.searchParams.set("query", GALLERY_QUERY);
  url.searchParams.set("perspective", "published");
  // Fresh build data. Fail a configured build rather than silently deploy an empty gallery.
  const response = await request(url, {
    headers: config.token
      ? { Authorization: `Bearer ${config.token}` }
      : undefined,
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `Gallery CMS request failed (${response.status}). Check the server-only read token and dataset access.`,
    );
  const payload = record(await response.json());
  return normalizeGallery(payload.result, config);
}

export function imageUrl(image: GalleryImage, width: number) {
  // Local samples are already optimized; never send them through a remote CDN.
  if (image.url.startsWith("/__local-gallery/")) return image.url;
  const url = new URL(image.url);
  url.searchParams.set("w", String(Math.min(width, image.width)));
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", "82");
  url.searchParams.set("fit", "max");
  return url.href;
}
export const formatCampDate = (date: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(new Date(`${date}T12:00:00Z`));
