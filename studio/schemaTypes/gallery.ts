import { defineArrayMember, defineField, defineType } from "sanity";
import { validateAsset } from "./validation";

const credit = defineField({
  name: "credit",
  title: "Urheber / Bildnachweis",
  type: "string",
  description:
    "Nur den freigegebenen Urhebernachweis eintragen, keine Namen abgebildeter Kinder.",
  validation: (Rule) => Rule.required().max(160),
});
const alt = defineField({
  name: "alt",
  title: "Bildbeschreibung",
  type: "string",
  description:
    "Kurz beschreiben, was zu sehen ist. Keine Namen oder persönlichen Daten der Kinder.",
  validation: (Rule) => Rule.required().min(8).max(240),
});
const caption = defineField({
  name: "caption",
  title: "Bildunterschrift",
  type: "string",
  validation: (Rule) => Rule.max(240),
});

const section = defineField({
  name: "section",
  title: "Galerie-Bereich",
  type: "string",
  initialValue: "other",
  description:
    "Dieses Foto oder Video einem Bereich im Camp-Album zuordnen. Die Reihenfolge innerhalb des Bereichs folgt der Medienliste.",
  options: {
    list: [
      { title: "On-Ice", value: "on-ice" },
      { title: "Off-Ice", value: "off-ice" },
      { title: "Weitere Camp-Momente", value: "other" },
    ],
    layout: "radio",
  },
  // Album media are array members; a video's named poster has no _key and inherits its video section.
  hidden: ({ parent }) => !parent?._key,
});

export const galleryPhoto = defineType({
  name: "galleryPhoto",
  title: "Foto",
  type: "image",
  description:
    "Vor dem Upload: Rechte und Einwilligungen klären, GPS-/EXIF-Daten entfernen. Dateien auf Sanitys CDN sind über ihre URL öffentlich erreichbar – auch in Entwürfen.",
  options: {
    accept: "image/jpeg,image/png,image/webp",
    storeOriginalFilename: false,
    metadata: ["lqip"],
  },
  fields: [
    section,
    defineField({
      name: "spotlight",
      title: "Darstellung im Raster",
      type: "string",
      initialValue: "none",
      description:
        "Spotlights belegen zwei Spalten und zwei Reihen. Links: Spalten 1–2. Rechts: Spalten 4–5. Eine Platzierung in der Mitte ist nicht möglich. Auf kleinen Bildschirmen wird das Raster angepasst. Die Randplatzierung hat Vorrang vor der Listenposition; Lücken werden mit normalen Kacheln gefüllt.",
      hidden: ({ parent }) => !parent?._key,
      options: {
        layout: "radio",
        list: [
          { title: "Normale Kachel", value: "none" },
          { title: "Spotlight · linker Rand", value: "left" },
          { title: "Spotlight · rechter Rand", value: "right" },
        ],
      },
      validation: (Rule) =>
        Rule.custom(
          (value) =>
            value === undefined ||
            ["none", "left", "right"].includes(value) ||
            "Bitte normale Kachel, linken oder rechten Rand wählen.",
        ),
    }),
    alt,
    caption,
    credit,
  ],
  validation: (Rule) =>
    Rule.required().custom(async (value, context) => {
      if (!value?.asset?._ref) return "Bitte ein Foto hochladen.";
      const asset = await context
        .getClient({ apiVersion: "2026-10-01" })
        .fetch("*[_id == $id][0]{mimeType,size}", { id: value.asset._ref });
      return validateAsset("image", asset);
    }),
  preview: { select: { title: "alt", subtitle: "credit", media: "asset" } },
});

export const galleryVideo = defineType({
  name: "galleryVideo",
  title: "Video",
  type: "object",
  fields: [
    section,
    defineField({
      name: "title",
      title: "Videotitel",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "file",
      title: "Video hochladen",
      type: "file",
      description:
        "MP4 (H.264) oder WebM, höchstens 100 MB. Vor dem Upload Einwilligungen klären, Metadaten entfernen und Video komprimieren. Upload-URLs sind öffentlich erreichbar. Keine privaten Rohaufnahmen hochladen.",
      options: { accept: "video/mp4,video/webm", storeOriginalFilename: false },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (!value?.asset?._ref) return "Bitte ein Video hochladen.";
          const asset = await context
            .getClient({ apiVersion: "2026-10-01" })
            .fetch("*[_id == $id][0]{mimeType,size}", { id: value.asset._ref });
          return validateAsset("video", asset);
        }),
    }),
    defineField({
      name: "poster",
      title: "Vorschaubild",
      type: "galleryPhoto",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "transcript",
      title: "Inhalt und gesprochener Text",
      type: "text",
      rows: 5,
      description:
        "Barrierefreie Textalternative: wichtige sichtbare Handlungen und den vollständigen gesprochenen Inhalt wiedergeben. Keine Namen der Kinder nennen.",
      validation: (Rule) => Rule.required().min(20).max(6000),
    }),
    caption,
    credit,
  ],
  preview: { select: { title: "title", subtitle: "credit", media: "poster" } },
});

export const galleryCamp = defineType({
  name: "galleryCamp",
  title: "Camp-Album",
  type: "document",
  description:
    "Nur freigegebene Camp-Aufnahmen hochladen. Veröffentlichung auf der statischen Website erfolgt nach dem nächsten Website-Build.",
  initialValue: { visibility: "hidden", rightsConfirmed: false },
  groups: [
    { name: "camp", title: "Camp", default: true },
    { name: "media", title: "Fotos & Videos" },
    { name: "publication", title: "Freigabe" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Albumtitel",
      type: "string",
      group: "camp",
      validation: (Rule) => Rule.required().min(3).max(100),
    }),
    defineField({
      name: "slug",
      title: "Seitenadresse",
      type: "slug",
      group: "camp",
      options: { source: "title", maxLength: 80 },
      description:
        "Nach Veröffentlichung möglichst beibehalten, damit gespeicherte Links funktionieren.",
      validation: (Rule) =>
        Rule.required().custom(
          (value) =>
            !value?.current ||
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) ||
            "Bitte Kleinbuchstaben, Ziffern und Bindestriche verwenden.",
        ),
    }),
    defineField({
      name: "occurredOn",
      title: "Camp-Datum",
      type: "date",
      group: "camp",
      description: "Nur ein tatsächlich bestätigtes Datum eintragen.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "Stadt",
      type: "string",
      group: "camp",
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: "description",
      title: "Kurzer Rückblick",
      type: "text",
      rows: 3,
      group: "camp",
      validation: (Rule) => Rule.required().max(600),
    }),
    defineField({
      name: "media",
      title: "Fotos & Videos",
      type: "array",
      group: "media",
      description:
        "Dateien hinzufügen, On-Ice oder Off-Ice zuordnen und per Ziehen innerhalb der Bereiche sortieren. Das erste gültige Medium der Liste liefert das Titelbild. Keine personenbezogenen Angaben zu Kindern eintragen.",
      of: [
        defineArrayMember({ type: "galleryPhoto" }),
        defineArrayMember({ type: "galleryVideo" }),
      ],
      validation: (Rule) => Rule.required().min(1).max(60),
    }),
    defineField({
      name: "rightsConfirmed",
      title: "Rechte und Einwilligungen geprüft",
      type: "boolean",
      group: "publication",
      description:
        "Ich habe die Rechte und erforderlichen Einwilligungen für sämtliche Medien und Vorschaubilder geprüft. Keine Einwilligungsdokumente oder Kinderdaten hier speichern. Diese Bestätigung ist keine rechtliche Prüfung.",
      validation: (Rule) =>
        Rule.custom(
          (value, context) =>
            context.document?.visibility !== "public" ||
            value === true ||
            "Für die Website-Freigabe müssen Rechte und Einwilligungen bestätigt sein.",
        ),
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
        "Freigabe wählen und „Veröffentlichen“ klicken. Änderungen und Rücknahmen erscheinen nach einem erfolgreichen Website-Build. Zurückhalten steuert nur die Website; veröffentlichte Dokumente bleiben über die öffentliche API lesbar. Hochgeladene Dateien bleiben über ihre CDN-URL erreichbar.",
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Neueste Camps zuerst",
      name: "dateDesc",
      by: [{ field: "occurredOn", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      city: "city",
      date: "occurredOn",
      visibility: "visibility",
      media: "media.0",
    },
    prepare({ title, city, date, visibility, media }) {
      return {
        title,
        subtitle: `${city || "Stadt fehlt"} · ${date || "Datum fehlt"} · ${visibility === "public" ? "Freigegeben" : "Zurückgehalten"}`,
        media: media?._type === "galleryVideo" ? media.poster : media,
      };
    },
  },
});
