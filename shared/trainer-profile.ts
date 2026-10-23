// Shared by Studio validation and the website's untrusted CMS boundary.
export const TRAINER_LIMITS = {
  name: 100,
  role: 120,
  biography: 4000,
  listItems: 12,
  listItem: 200,
  displayOrder: 9999,
} as const;

export interface TrainerProfileFields {
  name: string;
  role: string;
  biography: string;
  verifiedBackground: string[];
  qualifications: string[];
  specialties: string[];
  displayOrder: number;
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
  if (raw.portrait !== undefined && raw.portrait !== null) {
    const portrait = asRecord(raw.portrait);
    if (
      typeof asRecord(portrait.asset)._ref !== "string" ||
      !plainText(portrait.alt, 8, 240) ||
      !plainText(portrait.credit, 1, 160)
    ) {
      return "Trainerfoto vollständig hochladen und Bildbeschreibung (8–240 Zeichen) sowie Urhebernachweis (1–160 Zeichen) ergänzen; alternativ das Bildfeld entfernen.";
    }
  }
  return true;
}
