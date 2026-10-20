import { fetchGallery, getGalleryConfig } from "./gallery";
import type { GalleryAlbum } from "../types/gallery";

// Build-time boundary only. Never import this module into a browser script.
let pending: Promise<GalleryAlbum[]> | undefined;
export function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  const config = getGalleryConfig(import.meta.env);
  if (!config) return Promise.resolve([]);
  return (pending ??= fetchGallery(config));
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
