import { defineField, defineType } from "sanity";
import { websitePhotoField } from "./trainingImages";
import { validateHeroVideoAsset } from "../../shared/media-validation.ts";

const copyField = (name: string, title: string, max: number) =>
  defineField({
    name,
    title,
    type: "string",
    validation: (rule) => rule.max(max),
  });

export const homepageHero = defineType({
  name: "homepageHero",
  title: "Startseiten-Hero",
  type: "document",
  description: "Leere Textfelder verwenden den Standardtext. Bild und Video werden hier hochgeladen.",
  initialValue: { imageApproved: false },
  fields: [
    copyField("eyebrow", "Text über der Überschrift", 70),
    copyField("headlineFirst", "Überschrift · Zeile 1", 12),
    copyField("headlineSecond", "Überschrift · Zeile 2", 12),
    copyField("headlineAccent", "Überschrift · Akzentzeile", 12),
    copyField("taglineFirst", "Leitsatz · Zeile 1", 65),
    copyField("taglineSecond", "Leitsatz · Zeile 2", 65),
    copyField("description", "Kurzbeschreibung", 180),
    websitePhotoField("photo", "Hero-Bild / Video-Standbild", "Eigenes Hero-Bild hochladen. Für ein Video ist dieses Standbild erforderlich. Ohne Bild bleibt die Medienfläche dunkel."),
    defineField({
      name: "video",
      title: "Hero-Video",
      type: "file",
      description: "Optional. Kurzer stummer Clip als MP4 (H.264) oder WebM, höchstens 12 MB. Das Hero-Bild bleibt als Standbild verfügbar. Upload-URLs sind öffentlich erreichbar.",
      options: { accept: "video/mp4,video/webm", storeOriginalFilename: false },
      validation: (rule) =>
        rule.custom(async (value, context) => {
          if (!value) return true;
          if (!context.document?.photo) return "Bitte ein Hero-Bild als Standbild für das Video hochladen.";
          if (!value.asset?._ref) return "Bitte ein Video hochladen oder das Feld leeren.";
          try {
            const asset = await context
              .getClient({ apiVersion: "2026-10-01" })
              .fetch("*[_id == $id][0]{mimeType,size}", { id: value.asset._ref });
            return validateHeroVideoAsset(asset);
          } catch {
            return "Die Videodatei konnte nicht geprüft werden.";
          }
        }),
    }),
    defineField({
      name: "videoApproved",
      title: "Video für die Website freigegeben",
      type: "boolean",
      description: "Bestätige die Videorechte und erforderlichen Einwilligungen.",
      validation: (rule) =>
        rule.custom((value, { document }) =>
          !document?.video || value === true
            ? true
            : "Bitte die Videorechte und Einwilligungen bestätigen.",
        ),
    }),
    defineField({
      name: "imageApproved",
      title: "Bild für die Website freigegeben",
      type: "boolean",
      description: "Bestätige die Bildrechte und erforderlichen Einwilligungen.",
      validation: (rule) =>
        rule.custom((value, { document }) =>
          !document?.photo || value === true
            ? true
            : "Bitte die Bildrechte und Einwilligungen bestätigen.",
        ),
    }),
  ],
});
