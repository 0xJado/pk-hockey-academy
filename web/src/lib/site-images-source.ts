import { getGalleryConfig, normalizeGalleryImage } from "./gallery";
import type { GalleryImage } from "../types/gallery";
import { siteImageFields, type SiteImageKey } from "../../../shared/site-images.ts";

type SiteImages = Partial<Record<SiteImageKey, GalleryImage>>;
let pending: Promise<SiteImages> | undefined;

export async function getSiteImages(): Promise<SiteImages> {
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
      `*[_type == "siteImages" && _id == "siteImages" && contentApproved == true][0]{
        ${siteImageFields.map(({ name }) =>
          `${name}{alt,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}`,
        ).join(",")}
      }`,
    );
    const response = await fetch(url, {
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok)
      throw new Error(`Website image CMS request failed (${response.status}).`);
    const { result } = await response.json();
    const images: SiteImages = {};
    for (const { name } of siteImageFields) {
      if (result?.[name] == null) continue;
      const image = normalizeGalleryImage(result[name], name, config);
      if (!image)
        throw new Error(`Invalid approved website image: ${name}. Check the asset and description in Sanity.`);
      images[name] = image;
    }
    return images;
  })());
}
