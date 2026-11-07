import { defineArrayMember, defineField, defineType } from "sanity";
import {
  TRAINER_LIMITS,
  validateTrainerPublication,
} from "../../shared/trainer-profile.ts";
import { validateAsset } from "./validation.ts";

const textList = (
  name: "verifiedBackground" | "qualifications" | "specialties",
  title: string,
  description: string,
) =>
  defineField({
    name,
    title,
    description,
    type: "array",
    group: "profile",
    of: [
      defineArrayMember({
        type: "string",
        validation: (Rule) => Rule.min(2).max(TRAINER_LIMITS.listItem),
      }),
    ],
    validation: (Rule) =>
      name === "verifiedBackground"
        ? Rule.required().min(1).max(TRAINER_LIMITS.listItems)
        : Rule.max(TRAINER_LIMITS.listItems),
  });

export const trainer = defineType({
  name: "trainer",
  title: "Trainerprofil",
  type: "document",
  description:
    "Nur bestätigte Angaben und freigegebene Porträts verwenden. Die Website wird nach einem erfolgreichen Website-Build aktualisiert.",
  initialValue: {
    active: true,
    visibility: "hidden",
    contentApproved: false,
    displayOrder: 100,
  },
  groups: [
    { name: "profile", title: "Profil", default: true },
    { name: "portrait", title: "Trainerfoto" },
    { name: "career", title: "Laufbahn" },
    { name: "publication", title: "Freigabe" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().min(2).max(TRAINER_LIMITS.name),
    }),
    defineField({
      name: "role",
      title: "Rolle",
      type: "string",
      group: "profile",
      validation: (Rule) => Rule.required().min(2).max(TRAINER_LIMITS.role),
    }),
    defineField({
      name: "biography",
      title: "Biografie",
      type: "text",
      rows: 7,
      group: "profile",
      description:
        "Freigegebener Klartext. Absätze durch eine Leerzeile trennen; keine HTML-Formatierung oder privaten Kontaktdaten.",
      validation: (Rule) =>
        Rule.required().min(20).max(TRAINER_LIMITS.biography),
    }),
    textList(
      "verifiedBackground",
      "Bestätigter Hintergrund",
      "Nur belegte biografische Angaben. Inlinehockey ist biografischer Hintergrund und kein Trainingsangebot der Academy.",
    ),
    textList(
      "qualifications",
      "Bestätigte Qualifikationen",
      "Nur nachgewiesene Qualifikationen. Leer lassen, solange keine Freigabe vorliegt; keine Nachweisdokumente hochladen.",
    ),
    textList(
      "specialties",
      "Trainingsschwerpunkte",
      "Nur bestätigte Eishockey-Schwerpunkte. Keine Leistungen erfinden.",
    ),
    ...(["playingYears", "coachingYears"] as const).map((name) =>
      defineField({
        name,
        title:
          name === "playingYears"
            ? "Spielerfahrung in Jahren"
            : "Trainererfahrung in Jahren",
        type: "number",
        group: "career",
        description:
          "Optional. Bestätigte Gesamtdauer in vollen Jahren zum Zeitpunkt der Freigabe; wird nicht automatisch hochgezählt. Null ist ein gültiger Wert.",
        validation: (Rule) => Rule.integer().min(0).max(100),
      }),
    ),
    defineField({
      name: "highestDivision",
      title: "Höchste Spielklasse",
      type: "string",
      group: "career",
      description:
        "Optional. Sportart und Land bei Bedarf mit angeben, z. B. zur eindeutigen Einordnung. Nur bestätigte Angaben.",
      validation: (Rule) => Rule.min(2).max(120),
    }),
    defineField({
      name: "notableTeams",
      title: "Stationen / Vereine",
      type: "array",
      group: "career",
      description:
        "Ausgewählte bestätigte Stationen als Spieler. Sportart und Zeitraum können im Eintrag ergänzt werden. Keine aktuelle Vereinszugehörigkeit oder Partnerschaft ableiten.",
      of: [
        defineArrayMember({
          type: "string",
          validation: (Rule) => Rule.min(2).max(200),
        }),
      ],
      validation: (Rule) => Rule.max(12),
    }),
    defineField({
      name: "playerGallery",
      title: "Bilder aus der Spielerlaufbahn",
      type: "array",
      group: "career",
      description:
        "Bis zu acht freigegebene Bilder in gewünschter Reihenfolge. Nur bereits geklärte Bildrechte und Einwilligungen; CDN-Dateien sind öffentlich erreichbar. Keine Nachweisdokumente hochladen. GPS/EXIF vorher entfernen.",
      validation: (Rule) => Rule.max(TRAINER_LIMITS.galleryImages),
      of: [
        defineArrayMember({
          type: "image",
          options: {
            accept: "image/jpeg,image/png,image/webp",
            storeOriginalFilename: false,
            metadata: ["lqip"],
          },
          fields: [
            defineField({
              name: "alt",
              title: "Bildbeschreibung",
              type: "string",
              validation: (Rule) => Rule.required().min(8).max(240),
            }),
            defineField({
              name: "caption",
              title: "Bildunterschrift / Saison",
              type: "string",
              validation: (Rule) => Rule.max(240),
            }),
            defineField({
              name: "credit",
              title: "Urheber / Bildnachweis",
              type: "string",
              validation: (Rule) => Rule.max(160),
            }),
          ],
          validation: (Rule) =>
            Rule.custom(async (value, context) => {
              if (!value?.asset?._ref)
                return "Eine Bilddatei hochladen oder den Eintrag entfernen.";
              try {
                const asset = await context
                  .getClient({ apiVersion: "2026-10-01" })
                  .fetch("*[_id == $id][0]{mimeType,size}", {
                    id: value.asset._ref,
                  });
                return validateAsset("image", asset);
              } catch {
                return "Die Bilddatei konnte nicht geprüft werden.";
              }
            }).error(),
        }),
      ],
    }),
    defineField({
      name: "portrait",
      title: "Trainerfoto",
      type: "image",
      group: "portrait",
      description:
        "Optional. Ohne Foto zeigt die Website das Academy-Wappen. Nur freigegebene Porträts hochladen: CDN-URLs sind auch bei Entwürfen öffentlich erreichbar. Vorher GPS/EXIF entfernen.",
      options: {
        accept: "image/jpeg,image/png,image/webp",
        storeOriginalFilename: false,
        metadata: ["lqip"],
      },
      fields: [
        defineField({
          name: "alt",
          title: "Bildbeschreibung",
          type: "string",
          validation: (Rule) => Rule.required().min(8).max(240),
        }),
        defineField({
          name: "credit",
          title: "Urheber / Bildnachweis",
          type: "string",
          validation: (Rule) => Rule.max(160),
        }),
      ],
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          if (value === undefined || value === null) return true;
          if (!value.asset?._ref)
            return "Bitte ein Trainerfoto hochladen oder das leere Bildfeld entfernen.";
          try {
            const asset = await context
              .getClient({ apiVersion: "2026-10-01" })
              .fetch("*[_id == $id][0]{mimeType,size}", {
                id: value.asset._ref,
              });
            return validateAsset("image", asset);
          } catch {
            return "Die Bilddatei konnte nicht geprüft werden. Verbindung und Berechtigung prüfen.";
          }
        }).error(),
    }),
    defineField({
      name: "displayOrder",
      title: "Reihenfolge",
      type: "number",
      group: "publication",
      description:
        "Kleinere Zahlen zuerst. Das erste aktive, freigegebene Profil erscheint auch auf der Startseite. Bei gleicher Zahl entscheidet die Dokument-ID.",
      validation: (Rule) =>
        Rule.required().integer().min(0).max(TRAINER_LIMITS.displayOrder),
    }),
    defineField({
      name: "active",
      title: "Aktiver Trainer",
      type: "boolean",
      group: "publication",
      description:
        "Inaktive Profile erscheinen nach dem nächsten erfolgreichen Website-Build nicht mehr auf der Website. Veröffentlichte Dokumente bleiben über die öffentliche API lesbar.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "contentApproved",
      title: "Profilangaben und Bildrechte geprüft",
      type: "boolean",
      group: "publication",
      description:
        "Biografie, Laufbahn, Hintergrund, Qualifikationen und Schwerpunkte sind bestätigt; für Porträt und Galeriebilder sind Rechte und erforderliche Einwilligungen geklärt. Keine Nachweis- oder Einwilligungsdokumente hier speichern.",
      validation: (Rule) =>
        Rule.custom(
          (value, context) =>
            context.document?.visibility !== "public" ||
            value === true ||
            "Freigegebene Profile benötigen diese Bestätigung.",
        ).error(),
    }),
    defineField({
      name: "visibility",
      title: "Website-Freigabe",
      type: "string",
      group: "publication",
      options: {
        layout: "radio",
        list: [
          { title: "Zurückhalten", value: "hidden" },
          { title: "Auf der Website zeigen", value: "public" },
        ],
      },
      description:
        "Freigabe wählen, veröffentlichen und anschließend die Website neu bauen. Zurückhalten steuert nur die Website; veröffentlichte Dokumente bleiben über die öffentliche API lesbar. Für unveröffentlichte Texte den Entwurf verwenden.",
      validation: (Rule) =>
        Rule.required().custom(
          (value) =>
            value === "hidden" ||
            value === "public" ||
            "Bitte eine gültige Website-Freigabe wählen.",
        ),
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => validateTrainerPublication(value)).error(),
  orderings: [
    {
      title: "Website-Reihenfolge",
      name: "websiteOrder",
      by: [
        { field: "displayOrder", direction: "asc" },
        { field: "_id", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "name",
      role: "role",
      active: "active",
      visibility: "visibility",
      media: "portrait",
    },
    prepare({ title, role, active, visibility, media }) {
      return {
        title: title || "Neues Trainerprofil",
        subtitle: `${role || "Rolle fehlt"} · ${active === true && visibility === "public" ? "Website-Freigabe" : "Zurückgehalten"}`,
        media,
      };
    },
  },
});
