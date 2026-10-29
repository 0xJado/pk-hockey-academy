import { mediaKitAssets } from "../data/media-kit.ts";
import { fetchMediaKit, getMediaKitConfig } from "./media-kit.ts";
import type { MediaKitDownload } from "../types/media-kit.ts";

let pending: Promise<MediaKitDownload[]> | undefined;
export async function getMediaKitDownloads(): Promise<
  readonly MediaKitDownload[]
> {
  const config = getMediaKitConfig({
    SANITY_PROJECT_ID: import.meta.env.SANITY_PROJECT_ID,
    SANITY_DATASET: import.meta.env.SANITY_DATASET,
    SANITY_READ_TOKEN: import.meta.env.SANITY_READ_TOKEN,
  });
  // Once a CMS is configured it is authoritative, including an empty collection.
  return config ? (pending ??= fetchMediaKit(config)) : mediaKitAssets;
}
