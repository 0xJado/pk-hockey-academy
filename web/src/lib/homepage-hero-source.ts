import { assetUrl, getGalleryConfig, normalizeGalleryImage } from "./gallery";
import { validateHeroVideoAsset } from "../../../shared/media-validation.ts";

const defaults = {
  eyebrow: "INDIVIDUELLES EISHOCKEYTRAINING · BIS U13",
  headlineFirst: "SKILLS.",
  headlineSecond: "MINDSET.",
  headlineAccent: "ZUKUNFT.",
  taglineFirst: "Gemeinsam besser werden –",
  taglineSecond: "auf und neben dem Eis.",
  description:
    "Kleine Gruppen. Persönliche Betreuung. Gezielte Entwicklung als Ergänzung zum Vereinstraining.",
};

export async function getHomepageHero() {
  const config = getGalleryConfig({
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  const copy = { ...defaults };
  if (!config) return { copy, photo: null, videoUrl: undefined };

  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
  );
  url.searchParams.set("perspective", "published");
  url.searchParams.set(
    "query",
    `*[_type == "homepageHero" && _id == "homepageHero"][0]{
      ${Object.keys(defaults).join(",")},imageApproved,videoApproved,
      video{asset->{url,mimeType,size}},
      photo{alt,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
    }`,
  );
  const response = await fetch(url, {
    headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Homepage hero CMS request failed (${response.status}).`);

  const { result } = await response.json();
  for (const field of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const value = result?.[field];
    if (typeof value === "string" && value.trim()) copy[field] = value.trim();
  }
  const photo =
    result?.imageApproved === true && result.photo != null
      ? normalizeGalleryImage(result.photo, "homepage-hero", config)
      : null;
  const videoAsset = result?.videoApproved === true ? result.video?.asset : null;
  const urlCandidate = assetUrl(videoAsset?.url, "files", config);
  const extension = videoAsset?.mimeType === "video/mp4" ? ".mp4" : ".webm";
  const videoUrl =
    photo && urlCandidate?.endsWith(extension) && validateHeroVideoAsset(videoAsset) === true
      ? urlCandidate
      : undefined;
  return { copy, photo, videoUrl };
}
