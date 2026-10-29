import { defineField, defineType } from "sanity";
import {
  validateAsset,
  validateDownloadAsset,
  validateMediaKitPublication,
  validateMediaKitPreview,
} from "../../shared/media-kit.ts";

export const mediaKitDownload = defineType({
  name: "mediaKitDownload",
  title: "Medienkit-Download",
  type: "document",
  description:
    "Nur bereits freigegebene öffentliche Academy-Dateien hochladen. CDN-Dateien sind auch in Entwürfen über ihre URL abrufbar.",
  initialValue: {
    displayOrder: 100,
    visibility: "hidden",
    contentApproved: false,
  },
  groups: [
    { name: "content", title: "Download", default: true },
    { name: "publication", title: "Freigabe" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titel",
      type: "string",
      group: "content",
      validation: (R) => R.required().min(2).max(120),
    }),
    defineField({
      name: "description",
      title: "Beschreibung",
      type: "text",
      rows: 3,
      group: "content",
      validation: (R) => R.required().max(600),
    }),
    defineField({
      name: "file",
      title: "Download-Datei",
      type: "file",
      group: "content",
      description:
        "PNG, JPEG, WebP oder PDF bis 20 MB; optional ein geprüftes ZIP bis 50 MB. Über das Dateimenü ersetzen oder entfernen. Keine vertraulichen Dokumente, Kinderdaten oder Einwilligungen hochladen.",
      options: {
        accept:
          "image/png,image/jpeg,image/webp,application/pdf,application/zip,application/x-zip-compressed",
        storeOriginalFilename: false,
      },
      validation: (R) =>
        R.required()
          .custom(async (value, context) => {
            if (!value?.asset?._ref) return "Download-Datei hochladen.";
            try {
              const asset = await context
                .getClient({ apiVersion: "2026-10-01" })
                .fetch("*[_id == $id][0]{mimeType,size,extension}", {
                  id: value.asset._ref,
                });
              return validateDownloadAsset(
                asset,
                context.document?.downloadName,
              );
            } catch {
              return "Download-Datei konnte nicht geprüft werden. Verbindung und Berechtigung prüfen.";
            }
          })
          .error(),
    }),
    defineField({
      name: "downloadName",
      title: "Download-Dateiname",
      type: "string",
      group: "content",
      description:
        "Öffentlicher Dateiname mit passender Endung, z. B. PK-Hockey-Academy-Logo.png. Nur Buchstaben ohne Umlaute, Ziffern, Punkte, Bindestriche und Unterstriche; keine privaten Namen.",
      validation: (R) => R.required().max(120),
    }),
    defineField({
      name: "usageGuidance",
      title: "Hinweise zur Verwendung",
      type: "text",
      rows: 4,
      group: "content",
      description:
        "Nur bestätigte Nutzungshinweise oder freigegebene Lizenzangaben. Leer lassen, solange keine abgestimmte Formulierung vorliegt. Die Website weist dann auf fehlende Nutzungshinweise hin.",
      validation: (R) => R.max(2000),
    }),
    defineField({
      name: "preview",
      title: "Vorschaubild (optional)",
      type: "image",
      group: "content",
      options: {
        accept: "image/png,image/jpeg,image/webp",
        storeOriginalFilename: false,
        metadata: ["lqip"],
      },
      fields: [
        defineField({
          name: "alt",
          title: "Bildbeschreibung",
          type: "string",
          validation: (R) => R.required().min(8).max(240),
        }),
        defineField({
          name: "credit",
          title: "Urheber / Bildnachweis",
          type: "string",
          validation: (R) => R.required().max(160),
        }),
      ],
      validation: (R) =>
        R.custom(async (value, context) => {
          if (!value) return true;
          const result = validateMediaKitPreview(value);
          if (result !== true) return result;
          if (!value.asset?._ref)
            return "Vorschaubild hochladen oder das leere Bildfeld entfernen.";
          try {
            const asset = await context
              .getClient({ apiVersion: "2026-10-01" })
              .fetch("*[_id == $id][0]{mimeType,size}", {
                id: value.asset._ref,
              });
            return validateAsset("image", asset);
          } catch {
            return "Vorschaubild konnte nicht geprüft werden.";
          }
        }).error(),
    }),
    defineField({
      name: "displayOrder",
      title: "Reihenfolge",
      type: "number",
      group: "publication",
      description: "Kleinere Zahlen zuerst.",
      validation: (R) => R.required().integer().min(0).max(9999),
    }),
    defineField({
      name: "contentApproved",
      title: "Datei, Angaben und Rechte geprüft",
      type: "boolean",
      group: "publication",
      description:
        "Die Datei ist zur öffentlichen Weitergabe freigegeben. Beschreibung und vorhandene Nutzungshinweise sind geprüft. Keine vertraulichen Inhalte enthalten.",
    }),
    defineField({
      name: "visibility",
      title: "Website-Freigabe",
      type: "string",
      group: "publication",
      options: {
        list: [
          { title: "Zurückhalten", value: "hidden" },
          { title: "Auf der Website zeigen", value: "public" },
        ],
        layout: "radio",
      },
      description:
        "Veröffentlichen und erfolgreichen Website-Build abwarten. Zurückhalten entfernt den Download von der Website, sperrt aber keine bestehende CDN-URL.",
      validation: (R) => R.required(),
    }),
  ],
  validation: (R) => R.custom(validateMediaKitPublication).error(),
  orderings: [
    {
      title: "Website-Reihenfolge",
      name: "displayOrder",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      filename: "downloadName",
      visibility: "visibility",
      media: "preview",
    },
    prepare: ({ title, filename, visibility, media }) => ({
      title: title || "Neuer Download",
      subtitle: `${filename || "Datei ergänzen"} · ${visibility === "public" ? "Website-Freigabe" : "Zurückgehalten"}`,
      media,
    }),
  },
});
