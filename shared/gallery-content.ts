// The Studio and public CMS boundary must agree on publishable gallery content.
export const GALLERY_LIMITS = {
  title: 100,
  slug: 80,
  city: 80,
  description: 600,
  alt: 240,
  credit: 160,
  caption: 240,
  videoTitle: 120,
  transcript: 6000,
  media: 60,
} as const;

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export function galleryText(
  value: unknown,
  min: number,
  max: number,
): string | undefined {
  if (typeof value !== "string") return;
  const text = value.trim();
  if (
    text.length < min ||
    text.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)
  )
    return;
  return text;
}

export function galleryDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const date = new Date(`${value}T12:00:00Z`);
  if (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
    return value;
}

export function parseGalleryAlbumFields(value: unknown) {
  const raw = record(value);
  const title = galleryText(raw.title, 3, GALLERY_LIMITS.title);
  const slug =
    typeof raw.slug === "string" ? raw.slug : record(raw.slug).current;
  const city = galleryText(raw.city, 1, GALLERY_LIMITS.city);
  const description = galleryText(
    raw.description,
    1,
    GALLERY_LIMITS.description,
  );
  const occurredOn = galleryDate(raw.occurredOn);
  if (
    !title ||
    typeof slug !== "string" ||
    slug.length > GALLERY_LIMITS.slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !city ||
    !description ||
    !occurredOn
  )
    return;
  return { title, slug, city, description, occurredOn };
}

function captionValid(raw: Record<string, unknown>) {
  return (
    raw.caption == null ||
    galleryText(raw.caption, 0, GALLERY_LIMITS.caption) !== undefined
  );
}

export function validateGalleryImageFields(value: unknown): true | string {
  const raw = record(value);
  if (!galleryText(raw.alt, 8, GALLERY_LIMITS.alt))
    return "Bildbeschreibung mit 8–240 Zeichen ergänzen; Leerzeichen allein reichen nicht.";
  if (!galleryText(raw.credit, 1, GALLERY_LIMITS.credit))
    return "Urhebernachweis mit 1–160 Zeichen ergänzen; Leerzeichen allein reichen nicht.";
  if (!captionValid(raw))
    return "Die optionale Bildunterschrift darf höchstens 240 Zeichen enthalten.";
  return true;
}

export function validateGalleryVideoFields(value: unknown): true | string {
  const raw = record(value);
  if (!galleryText(raw.title, 1, GALLERY_LIMITS.videoTitle))
    return "Videotitel mit 1–120 Zeichen ergänzen.";
  if (!galleryText(raw.transcript, 20, GALLERY_LIMITS.transcript))
    return "Textalternative mit 20–6000 Zeichen ergänzen; Leerzeichen allein reichen nicht.";
  if (!galleryText(raw.credit, 1, GALLERY_LIMITS.credit))
    return "Urhebernachweis mit 1–160 Zeichen ergänzen; Leerzeichen allein reichen nicht.";
  if (!captionValid(raw))
    return "Die optionale Bildunterschrift darf höchstens 240 Zeichen enthalten.";
  return validateGalleryImageFields(raw.poster);
}

export function validateGalleryPublication(value: unknown): true | string {
  const raw = record(value);
  if (!parseGalleryAlbumFields(raw))
    return "Albumtitel (3–100 Zeichen), gültige Seitenadresse (höchstens 80 Zeichen), reales Datum, Stadt und Rückblick ergänzen. Leere Angaben oder Leerzeichen allein sind nicht gültig.";
  if (raw.visibility !== "public" && raw.visibility !== "hidden")
    return "Eine gültige Website-Freigabe wählen.";
  if (raw.visibility === "public" && raw.rightsConfirmed !== true)
    return "Vor der Website-Freigabe Rechte und Einwilligungen bestätigen.";
  if (
    !Array.isArray(raw.media) ||
    raw.media.length < 1 ||
    raw.media.length > GALLERY_LIMITS.media
  )
    return "Ein Album benötigt 1–60 vollständig ausgefüllte Fotos oder Videos.";
  const keys = new Set<string>();
  for (let index = 0; index < raw.media.length; index++) {
    const item = record(raw.media[index]);
    const prefix = `Medium ${index + 1}: `;
    if (
      typeof item._key !== "string" ||
      !/^[a-zA-Z0-9_-]{1,200}$/.test(item._key) ||
      keys.has(item._key)
    )
      return (
        prefix + "Medienkennung fehlt oder ist doppelt. Medium neu hinzufügen."
      );
    keys.add(item._key);
    if (
      item.section != null &&
      (typeof item.section !== "string" ||
        !["on-ice", "off-ice", "other"].includes(item.section))
    )
      return prefix + "Einen gültigen Galerie-Bereich wählen.";
    if (
      item._type === "galleryPhoto" &&
      item.spotlight != null &&
      (typeof item.spotlight !== "string" ||
        !["none", "left", "right"].includes(item.spotlight))
    )
      return prefix + "Eine gültige Randplatzierung wählen.";
    const result =
      item._type === "galleryPhoto"
        ? validateGalleryImageFields(item)
        : item._type === "galleryVideo"
          ? validateGalleryVideoFields(item)
          : "Nur Fotos und Videos sind zulässig.";
    if (result !== true) return prefix + result;
  }
  return true;
}
