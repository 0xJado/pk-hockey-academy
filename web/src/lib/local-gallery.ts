import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type {
  GalleryAlbum,
  GalleryImage,
  GalleryMedia,
} from "../types/gallery";

type Fields = Record<string, unknown>;
const fields = (value: unknown): Fields => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Local gallery: expected an object.");
  return value as Fields;
};
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Local gallery: required text is missing.");
  return value.trim();
}
function dimension(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1)
    throw new Error("Local gallery: invalid image dimensions.");
  return value;
}

// Explicitly gated before any filesystem access. Production never reads this folder.
export async function loadLocalGallery(
  enabled: boolean,
  directory: string,
): Promise<GalleryAlbum[]> {
  if (!enabled) return [];
  let raw: string;
  try {
    raw = await readFile(join(directory, "album.json"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const album = fields(JSON.parse(raw));
  const slug = text(album.slug);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error("Local gallery: invalid album slug.");
  async function asset(file: unknown, kind: "image" | "video") {
    const name = text(file);
    const pattern =
      kind === "image"
        ? /^[a-z0-9-]+\.(?:webp|png|jpg|jpeg)$/
        : /^[a-z0-9-]+\.(?:mp4|webm)$/;
    if (!pattern.test(name))
      throw new Error("Local gallery: invalid media filename.");
    if (!(await stat(join(directory, "media", name))).isFile())
      throw new Error("Local gallery: media file is missing.");
    return `/__local-gallery/${name}`;
  }
  function section(value: unknown) {
    if (
      value === undefined ||
      value === "on-ice" ||
      value === "off-ice" ||
      value === "other"
    )
      return value;
    throw new Error("Local gallery: invalid section.");
  }
  async function image(value: unknown): Promise<GalleryImage> {
    const item = fields(value);
    if (
      item.spotlight !== undefined &&
      item.spotlight !== "left" &&
      item.spotlight !== "right"
    )
      throw new Error("Local gallery: spotlight must be left or right.");
    return {
      type: "image",
      id: text(item.id),
      url: await asset(item.file, "image"),
      alt: text(item.alt),
      credit: text(item.credit),
      width: dimension(item.width),
      height: dimension(item.height),
      section: section(item.section),
      spotlight: item.spotlight,
      caption: item.caption === undefined ? undefined : text(item.caption),
    };
  }
  if (!Array.isArray(album.media) || !album.media.length)
    throw new Error("Local gallery: media must be a nonempty array.");
  const media: GalleryMedia[] = await Promise.all(
    album.media.map(async (value) => {
      const item = fields(value);
      if (item.type === "image") return image(item);
      if (item.type !== "video")
        throw new Error("Local gallery: unsupported media type.");
      const url = await asset(item.file, "video");
      return {
        type: "video" as const,
        id: text(item.id),
        title: text(item.title),
        url,
        mimeType: url.endsWith(".webm")
          ? ("video/webm" as const)
          : ("video/mp4" as const),
        section: section(item.section),
        poster: await image(item.poster),
        transcript: text(item.transcript),
        credit: text(item.credit),
        caption: item.caption === undefined ? undefined : text(item.caption),
      };
    }),
  );
  if (new Set(media.map((item) => item.id)).size !== media.length)
    throw new Error("Local gallery: media IDs must be unique.");
  const cover = media.find(
    (item) => item.type === "image" && item.id === album.cover,
  );
  if (!cover || cover.type !== "image")
    throw new Error("Local gallery: choose a photo cover.");
  return [
    {
      id: `local-${slug}`,
      slug,
      isLocalPreview: true,
      title: text(album.title),
      description: text(album.description),
      // No dates or venues are inferred from placeholder files.
      city: "",
      occurredOn: "",
      cover,
      media,
    },
  ];
}
