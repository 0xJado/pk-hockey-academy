import { fetchGallery, getGalleryConfig } from "./gallery";
import type { GalleryAlbum } from "../types/gallery";
import { loadLocalGallery } from "./local-gallery";
import { join } from "node:path";

// Build-time boundary only. Never import this module into a browser script.
let pending: Promise<GalleryAlbum[]> | undefined;
export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  const local = await loadLocalGallery(
    import.meta.env.DEV,
    join(process.cwd(), ".local-gallery"),
  );
  const config = getGalleryConfig(import.meta.env);
  if (!config) return local;
  const published = await (pending ??= fetchGallery(config));
  return [
    ...local,
    ...published.filter(
      (album) => !local.some((sample) => sample.slug === album.slug),
    ),
  ];
}

export function getStudioUrl(): string | undefined {
  const value = import.meta.env.PUBLIC_SANITY_STUDIO_URL?.trim();
  if (!value) return;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".example") ||
      url.hostname.endsWith(".invalid")
    )
      return;
    return url.href;
  } catch {
    return;
  }
}
