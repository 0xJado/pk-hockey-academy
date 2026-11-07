// Shared by Studio validation and the website's untrusted CMS boundary.
export const TRAINER_LIMITS = {
  name: 100,
  role: 120,
  biography: 4000,
  listItems: 12,
  listItem: 200,
  displayOrder: 9999,
  galleryImages: 8,
} as const;

export interface TrainerProfileFields {
  name: string;
  role: string;
  biography: string;
  verifiedBackground: string[];
  qualifications: string[];
  specialties: string[];
  displayOrder: number;
  playingYears?: number;
  coachingYears?: number;
  highestDivision?: string;
  notableTeams?: string[];
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function plainText(
  value: unknown,
  min: number,
  max: number,
): string | undefined {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (
    trimmed.length < min ||
    trimmed.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(trimmed)
  )
    return;
  return trimmed;
}

export function parseTrainerFields(
  value: unknown,
): TrainerProfileFields | undefined {
  const raw = asRecord(value);
  const name = plainText(raw.name, 2, TRAINER_LIMITS.name);
  const role = plainText(raw.role, 2, TRAINER_LIMITS.role);
  const biography = plainText(raw.biography, 20, TRAINER_LIMITS.biography);
  const list = (input: unknown, required: boolean): string[] | undefined => {
    if (input === undefined || input === null) return required ? undefined : [];
    if (!Array.isArray(input) || input.length > TRAINER_LIMITS.listItems)
      return;
    const values = input.map((item) =>
      plainText(item, 2, TRAINER_LIMITS.listItem),
    );
    if (
      values.some((item) => item === undefined) ||
      (required && values.length === 0)
    )
      return;
    return [...new Set(values as string[])];
  };
  const verifiedBackground = list(raw.verifiedBackground, true);
  const qualifications = list(raw.qualifications, false);
  const specialties = list(raw.specialties, false);
  const displayOrder = raw.displayOrder;
  const career: Pick<
    TrainerProfileFields,
    "playingYears" | "coachingYears" | "highestDivision" | "notableTeams"
  > = {};
  for (const key of ["playingYears", "coachingYears"] as const) {
    if (raw[key] == null) continue;
    if (
      typeof raw[key] !== "number" ||
      !Number.isSafeInteger(raw[key]) ||
      raw[key] < 0 ||
      raw[key] > 100
    )
      return;
    career[key] = raw[key];
  }
  if (raw.highestDivision != null && raw.highestDivision !== "") {
    const division = plainText(raw.highestDivision, 2, 120);
    if (!division) return;
    career.highestDivision = division;
  }
  if (raw.notableTeams != null) {
    const teams = list(raw.notableTeams, false);
    if (!teams) return;
    career.notableTeams = teams;
  }
  if (
    !name ||
    !role ||
    !biography ||
    !verifiedBackground ||
    !qualifications ||
    !specialties ||
    typeof displayOrder !== "number" ||
    !Number.isSafeInteger(displayOrder) ||
    displayOrder < 0 ||
    displayOrder > TRAINER_LIMITS.displayOrder
  )
    return;
  return {
    name,
    role,
    biography,
    verifiedBackground,
    qualifications,
    specialties,
    displayOrder,
    ...career,
  };
}

export function validateTrainerPublication(value: unknown): true | string {
  const raw = asRecord(value);
  if (!parseTrainerFields(raw)) {
    return "Name, Rolle, Biografie (20–4000 Zeichen), bestätigten Hintergrund und eine ganze Sortiernummer von 0 bis 9999 ergänzen. Listen dürfen jeweils höchstens 12 Einträge mit 2–200 Zeichen enthalten.";
  }
  if (raw.visibility === "public" && raw.contentApproved !== true) {
    return "Vor der Website-Freigabe müssen Profilangaben und gegebenenfalls Bildrechte bestätigt sein.";
  }
  if (raw.playerGallery != null) {
    if (
      !Array.isArray(raw.playerGallery) ||
      raw.playerGallery.length > TRAINER_LIMITS.galleryImages
    )
      return "Die Spielerlaufbahn-Galerie darf höchstens acht Bilder enthalten.";
    for (const value of raw.playerGallery) {
      const image = asRecord(value);
      if (
        typeof asRecord(image.asset)._ref !== "string" ||
        !plainText(image.alt, 8, 240) ||
        (image.credit != null &&
          plainText(image.credit, 0, 160) === undefined) ||
        (image.caption != null &&
          plainText(image.caption, 0, 240) === undefined)
      )
        return "Galeriebilder benötigen eine Datei und Bildbeschreibung (8–240 Zeichen); Bildnachweis maximal 160, Bildunterschrift maximal 240 Zeichen.";
    }
  }
  if (raw.portrait !== undefined && raw.portrait !== null) {
    const portrait = asRecord(raw.portrait);
    if (
      portrait.credit != null &&
      plainText(portrait.credit, 0, 160) === undefined
    )
      return "Der optionale Bildnachweis darf höchstens 160 Zeichen enthalten.";
    if (
      typeof asRecord(portrait.asset)._ref !== "string" ||
      !plainText(portrait.alt, 8, 240)
    ) {
      return "Trainerfoto vollständig hochladen und Bildbeschreibung (8–240 Zeichen) ergänzen; alternativ das Bildfeld entfernen.";
    }
  }
  return true;
}
