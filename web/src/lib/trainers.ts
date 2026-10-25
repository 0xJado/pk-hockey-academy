import {
  asRecord,
  parseTrainerFields,
} from "../../../shared/trainer-profile.ts";
import type { Trainer } from "../types/content.ts";
import { getGalleryConfig, type GalleryConfig } from "./gallery.ts";

export function getTrainerConfig(
  env: Record<string, string | undefined>,
): GalleryConfig | undefined {
  const enabled = env.SANITY_TRAINERS_ENABLED?.trim();
  if (!enabled || enabled === "false") return;
  if (enabled !== "true")
    throw new Error("SANITY_TRAINERS_ENABLED must be true or false.");
  const config = getGalleryConfig(env);
  if (!config)
    throw new Error(
      "Trainer CMS requires SANITY_PROJECT_ID and SANITY_DATASET. A public dataset needs no read token.",
    );
  return config;
}

export const TRAINERS_QUERY = `*[
  _type == "trainer" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  visibility == "public" && contentApproved == true && active == true
] | order(displayOrder asc, _id asc) {
  _id, _type, name, role, biography, verifiedBackground, qualifications, specialties,
  displayOrder, active, visibility, contentApproved,
  portrait{alt,credit,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
}`;

function portrait(
  value: unknown,
  config: Pick<GalleryConfig, "projectId" | "dataset">,
): Trainer["portrait"] {
  const raw = asRecord(value);
  const asset = asRecord(raw.asset);
  const dimensions = asRecord(asRecord(asset.metadata).dimensions);
  if (typeof asset.url !== "string") return;
  let url: URL;
  try {
    url = new URL(asset.url);
  } catch {
    return;
  }
  const path = `/images/${config.projectId}/${config.dataset}/`;
  if (
    url.origin !== "https://cdn.sanity.io" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(path) ||
    !/^[a-zA-Z0-9-]+\.(?:jpg|jpeg|png|webp)$/.test(
      url.pathname.slice(path.length),
    ) ||
    !["image/jpeg", "image/png", "image/webp"].includes(
      String(asset.mimeType),
    ) ||
    typeof asset.size !== "number" ||
    !Number.isSafeInteger(asset.size) ||
    asset.size <= 0 ||
    asset.size > 12 * 1024 * 1024 ||
    typeof dimensions.width !== "number" ||
    !Number.isSafeInteger(dimensions.width) ||
    dimensions.width <= 0 ||
    dimensions.width > 30000 ||
    typeof dimensions.height !== "number" ||
    !Number.isSafeInteger(dimensions.height) ||
    dimensions.height <= 0 ||
    dimensions.height > 30000 ||
    typeof raw.alt !== "string" ||
    raw.alt.trim().length < 8 ||
    raw.alt.trim().length > 240 ||
    typeof raw.credit !== "string" ||
    !raw.credit.trim() ||
    raw.credit.trim().length > 160
  )
    return;
  return {
    url: url.href,
    alt: raw.alt.trim(),
    credit: raw.credit.trim(),
    width: dimensions.width,
    height: dimensions.height,
  };
}

export function normalizeTrainers(
  source: unknown,
  config: Pick<GalleryConfig, "projectId" | "dataset">,
): Trainer[] {
  if (!Array.isArray(source))
    throw new Error("Invalid trainer CMS response: expected an array.");
  const trainers: Trainer[] = [];
  const ids = new Set<string>();
  for (const value of source) {
    const raw = asRecord(value);
    if (
      typeof raw._id !== "string" ||
      !/^[a-zA-Z0-9_.-]{1,200}$/.test(raw._id) ||
      raw._id.startsWith("drafts.") ||
      raw._id.startsWith("versions.") ||
      ids.has(raw._id) ||
      raw._type !== "trainer" ||
      raw.visibility !== "public" ||
      raw.contentApproved !== true ||
      raw.active !== true
    )
      continue;
    const fields = parseTrainerFields(raw);
    if (!fields)
      throw new Error(
        "An approved trainer profile has invalid required fields. Correct the profile before rebuilding.",
      );
    const image =
      raw.portrait === undefined || raw.portrait === null
        ? undefined
        : portrait(raw.portrait, config);
    if (raw.portrait != null && !image)
      throw new Error(
        "An approved trainer portrait has invalid metadata or an untrusted asset URL.",
      );
    ids.add(raw._id);
    trainers.push({ id: raw._id, ...fields, active: true, portrait: image });
  }
  return trainers.sort(
    (a, b) =>
      a.displayOrder - b.displayOrder ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}

export async function fetchTrainers(
  config: GalleryConfig,
  request: typeof fetch = fetch,
): Promise<Trainer[]> {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
  );
  url.searchParams.set("query", TRAINERS_QUERY);
  url.searchParams.set("perspective", "published");
  let response: Response;
  try {
    response = await request(url, {
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    throw new Error(
      "Trainer CMS request failed. Check configuration and network access; no local fallback was published.",
    );
  }
  if (!response.ok)
    throw new Error(
      `Trainer CMS request failed (${response.status}). Check the server-only read token and dataset access.`,
    );
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Trainer CMS returned invalid JSON.");
  }
  return normalizeTrainers(asRecord(payload).result, config);
}

export function trainerImageUrl(
  image: NonNullable<Trainer["portrait"]>,
  width: number,
): string {
  const url = new URL(image.url);
  url.searchParams.set("w", String(Math.min(width, image.width)));
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", "82");
  url.searchParams.set("fit", "max");
  return url.href;
}
