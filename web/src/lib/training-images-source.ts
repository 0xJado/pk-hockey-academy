import { getGalleryConfig, normalizeGalleryImage } from "./gallery";
import type { GalleryImage } from "../types/gallery";

type TrainingImages = Partial<Record<"on-ice" | "off-ice", GalleryImage>>;
let pending: Promise<TrainingImages> | undefined;

export async function getTrainingImages(): Promise<TrainingImages> {
  const config = getGalleryConfig({
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  if (!config) return {};

  return (pending ??= (async () => {
    const url = new URL(
      `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
    );
    url.searchParams.set("perspective", "published");
    url.searchParams.set(
      "query",
      `*[_type == "trainingImages" && _id == "trainingImages" && contentApproved == true][0]{
      onIce{alt,asset->{url,mimeType,size,metadata{dimensions{width,height}}}},
      offIce{alt,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
    }`,
    );
    const response = await fetch(url, {
      headers: config.token
        ? { Authorization: `Bearer ${config.token}` }
        : undefined,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(
        `Training image CMS request failed (${response.status}).`,
      );
    const { result } = await response.json();
    const images: TrainingImages = {};
    for (const [phase, field] of [
      ["on-ice", "onIce"],
      ["off-ice", "offIce"],
    ] as const) {
      if (result?.[field] == null) continue;
      const image = normalizeGalleryImage(result[field], phase, config);
      if (!image)
        throw new Error(
          `Invalid approved training image: ${phase}. Check the asset and description in Sanity.`,
        );
      images[phase] = image;
    }
    return images;
  })());
}
