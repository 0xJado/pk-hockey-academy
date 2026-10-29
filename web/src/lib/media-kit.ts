import {
  DOWNLOAD_TYPES,
  record,
  parseMediaKitFields,
  validateDownloadAsset,
  validateMediaKitPublication,
  validateMediaKitPreview,
  validateAsset,
} from "../../../shared/media-kit.ts";
import { getGalleryConfig, type GalleryConfig } from "./gallery.ts";
import type { MediaKitDownload } from "../types/media-kit.ts";

export const MEDIA_KIT_QUERY = `*[
  _type == "mediaKitDownload" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  visibility == "public" && contentApproved == true
] | order(displayOrder asc, _id asc) {
  _id, _type, title, description, downloadName, usageGuidance, displayOrder, visibility, contentApproved,
  file{asset->{url,mimeType,size,extension}},
  preview{alt,credit,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
}`;

function assetUrl(
  value: unknown,
  folder: "images" | "files",
  config: GalleryConfig,
) {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    const prefix = `/${folder}/${config.projectId}/${config.dataset}/`;
    if (
      url.origin !== "https://cdn.sanity.io" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !url.pathname.startsWith(prefix) ||
      !(
        folder === "images"
          ? /^[A-Za-z0-9-]+\.(?:png|jpe?g|webp)$/
          : /^[A-Za-z0-9-]+\.(?:png|jpe?g|webp|pdf|zip)$/
      ).test(url.pathname.slice(prefix.length))
    )
      return;
    return url;
  } catch {
    return;
  }
}

export function normalizeMediaKit(
  value: unknown,
  config: GalleryConfig,
): MediaKitDownload[] {
  if (!Array.isArray(value))
    throw new Error("Invalid media-kit CMS response: expected an array.");
  const ids = new Set<string>();
  const entries: { order: number; download: MediaKitDownload }[] = [];
  for (const item of value) {
    const raw = record(item);
    if (
      (typeof raw._id === "string" &&
        (raw._id.startsWith("drafts.") || raw._id.startsWith("versions."))) ||
      raw.visibility !== "public" ||
      raw.contentApproved !== true
    )
      continue;
    function invalid(reason: string): never {
      throw new Error(
        `An approved media-kit download is invalid: ${reason} Correct it in Sanity before rebuilding.`,
      );
    }
    if (
      typeof raw._id !== "string" ||
      !/^[A-Za-z0-9_.-]{1,200}$/.test(raw._id) ||
      ids.has(raw._id) ||
      raw._type !== "mediaKitDownload"
    )
      invalid("missing or duplicate document ID/type.");
    ids.add(raw._id);
    const fields = parseMediaKitFields(raw);
    if (!fields || validateMediaKitPublication(raw) !== true)
      invalid("required metadata.");
    const asset = record(record(raw.file).asset);
    // A removed/unresolved asset must disappear from the next build, not leave a broken link.
    if (!Object.keys(asset).length) continue;
    const validation = validateDownloadAsset(asset, fields.downloadName);
    const url = assetUrl(asset.url, "files", config);
    if (
      validation !== true ||
      !url ||
      url.pathname.split(".").at(-1) !== asset.extension
    )
      invalid("file format, size or asset URL.");
    let preview: MediaKitDownload["preview"];
    if (raw.preview != null) {
      const image = record(raw.preview),
        imageAsset = record(image.asset);
      if (Object.keys(imageAsset).length) {
        const imageUrl = assetUrl(imageAsset.url, "images", config);
        const dimensions = record(record(imageAsset.metadata).dimensions);
        const width = dimensions.width,
          height = dimensions.height;
        if (
          !imageUrl ||
          validateMediaKitPreview(image) !== true ||
          validateAsset("image", imageAsset) !== true ||
          typeof width !== "number" ||
          typeof height !== "number" ||
          !Number.isSafeInteger(width) ||
          !Number.isSafeInteger(height) ||
          width <= 0 ||
          height <= 0
        )
          invalid("preview image.");
        imageUrl.searchParams.set("w", String(Math.min(720, width)));
        imageUrl.searchParams.set("auto", "format");
        preview = {
          image: imageUrl.href,
          alt: String(image.alt).trim(),
          credit: String(image.credit).trim(),
          width,
          height,
        };
      }
    }
    url.searchParams.set("dl", fields.downloadName);
    entries.push({
      order: fields.displayOrder,
      download: {
        id: raw._id,
        title: fields.title,
        description: fields.description,
        downloadName: fields.downloadName,
        usageGuidance: fields.usageGuidance,
        format: DOWNLOAD_TYPES[String(asset.mimeType)].format,
        sizeBytes: asset.size as number,
        url: url.href,
        preview,
      },
    });
  }
  return entries
    .sort(
      (a, b) =>
        a.order - b.order || a.download.id.localeCompare(b.download.id, "en"),
    )
    .map((entry) => entry.download);
}

export async function fetchMediaKit(
  config: GalleryConfig,
  request: typeof fetch = fetch,
): Promise<MediaKitDownload[]> {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2026-10-01/data/query/${config.dataset}`,
  );
  url.searchParams.set("query", MEDIA_KIT_QUERY);
  url.searchParams.set("perspective", "published");
  const response = await request(url, {
    headers: config.token
      ? { Authorization: `Bearer ${config.token}` }
      : undefined,
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`Media-kit CMS request failed (${response.status}).`);
  const downloads = normalizeMediaKit(
    record(await response.json()).result,
    config,
  );
  const available: MediaKitDownload[] = [];
  for (let index = 0; index < downloads.length; index += 8) {
    const batch = await Promise.all(
      downloads.slice(index, index + 8).map(async (download) => {
        // CDN checks never receive the dataset read token.
        const result = await request(download.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(15000),
          redirect: "error",
        });
        if (result.status === 404 || result.status === 410) return;
        if (!result.ok)
          throw new Error(
            `Media-kit file availability check failed (${result.status}).`,
          );
        return download;
      }),
    );
    available.push(
      ...batch.filter((download): download is MediaKitDownload => !!download),
    );
  }
  return available;
}

export { getGalleryConfig as getMediaKitConfig };

export function formatDownloadSize(bytes: number): string {
  const divisor = bytes < 1000 ? 1 : bytes < 1_000_000 ? 1000 : 1_000_000;
  const unit = divisor === 1 ? "B" : divisor === 1000 ? "kB" : "MB";
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(bytes / divisor)} ${unit}`;
}
