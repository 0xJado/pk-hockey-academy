import { validateAsset } from "./media-validation.ts";

export const DOWNLOAD_TYPES: Record<
  string,
  { format: string; extensions: string[] }
> = {
  "image/png": { format: "PNG", extensions: ["png"] },
  "image/jpeg": { format: "JPEG", extensions: ["jpg", "jpeg"] },
  "image/webp": { format: "WebP", extensions: ["webp"] },
  "application/pdf": { format: "PDF", extensions: ["pdf"] },
  "application/zip": { format: "ZIP", extensions: ["zip"] },
  "application/x-zip-compressed": { format: "ZIP", extensions: ["zip"] },
};
export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, min: number, max: number) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
    ? value.trim()
    : undefined;

export function parseMediaKitFields(value: unknown) {
  const raw = record(value);
  const title = text(raw.title, 2, 120),
    description = text(raw.description, 1, 600);
  const downloadName = text(raw.downloadName, 1, 120);
  const usageGuidance =
    raw.usageGuidance == null ? undefined : text(raw.usageGuidance, 0, 2000);
  if (
    !title ||
    !description ||
    !downloadName ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp|pdf|zip)$/i.test(
      downloadName,
    ) ||
    downloadName.includes("..") ||
    (raw.usageGuidance != null && usageGuidance === undefined) ||
    typeof raw.displayOrder !== "number" ||
    !Number.isInteger(raw.displayOrder) ||
    raw.displayOrder < 0 ||
    raw.displayOrder > 9999
  )
    return;
  return {
    title,
    description,
    downloadName,
    usageGuidance: usageGuidance || undefined,
    displayOrder: raw.displayOrder,
  };
}

export function validateDownloadAsset(
  value: unknown,
  downloadName: unknown,
): true | string {
  const raw = record(value);
  const type =
    typeof raw.mimeType === "string" &&
    Object.hasOwn(DOWNLOAD_TYPES, raw.mimeType)
      ? DOWNLOAD_TYPES[raw.mimeType]
      : undefined;
  if (!type) return "Bitte PNG, JPEG, WebP, PDF oder ZIP verwenden.";
  const max = type.format === "ZIP" ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
  if (
    typeof raw.size !== "number" ||
    !Number.isSafeInteger(raw.size) ||
    raw.size <= 0 ||
    raw.size > max
  )
    return "Dateigröße ungültig: höchstens 20 MB, bei ZIP höchstens 50 MB.";
  if (
    typeof raw.extension !== "string" ||
    !type.extensions.includes(raw.extension.toLowerCase()) ||
    typeof downloadName !== "string" ||
    !type.extensions.includes(
      downloadName.split(".").at(-1)?.toLowerCase() || "",
    )
  )
    return "Dateiendung und Download-Dateiname müssen zum tatsächlichen Dateiformat passen.";
  return true;
}

export function validateMediaKitPublication(value: unknown): true | string {
  const raw = record(value);
  if (!parseMediaKitFields(raw))
    return "Titel, Beschreibung, sicheren Download-Dateinamen und Reihenfolge (0–9999) ergänzen. Leerzeichen allein sind nicht gültig.";
  if (raw.visibility !== "public" && raw.visibility !== "hidden")
    return "Website-Freigabe wählen.";
  if (raw.visibility === "public" && raw.contentApproved !== true)
    return "Vor der Website-Freigabe Datei, Rechte und Angaben bestätigen.";
  return true;
}

export function validateMediaKitPreview(value: unknown): true | string {
  if (value == null) return true;
  const raw = record(value);
  if (!text(raw.alt, 8, 240) || !text(raw.credit, 1, 160))
    return "Vorschaubild beschreiben (8–240 Zeichen) und Urhebernachweis ergänzen.";
  return true;
}
export { validateAsset };
