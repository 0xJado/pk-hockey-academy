export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export function validateAsset(kind: "image" | "video", value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return "Die Datei wird noch hochgeladen oder fehlt.";
  const asset = value as Record<string, unknown>;
  const allowed =
    kind === "image"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["video/mp4", "video/webm"];
  if (typeof asset.mimeType !== "string" || !allowed.includes(asset.mimeType))
    return kind === "image"
      ? "Bitte JPEG, PNG oder WebP verwenden."
      : "Bitte ein browserfähiges MP4- oder WebM-Video verwenden.";
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (
    typeof asset.size !== "number" ||
    !Number.isSafeInteger(asset.size) ||
    asset.size <= 0 ||
    asset.size > max
  )
    return kind === "image"
      ? "Bilder dürfen höchstens 12 MB groß sein."
      : "Videos dürfen höchstens 100 MB groß sein. Bitte vor dem Upload komprimieren.";
  return true;
}
