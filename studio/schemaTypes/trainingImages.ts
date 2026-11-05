import { defineField, defineType } from "sanity";
import { validateAsset } from "./validation";
import { validateGalleryImageFields } from "../../shared/gallery-content.ts";

export const websitePhotoField = (
  name: string,
  title: string,
  description = "Optional. Ohne eigenes Bild erscheint das Standardbild der Website.",
) =>
  defineField({
    name,
    title,
    type: "image",
    description,
    options: {
      accept: "image/jpeg,image/png,image/webp",
      storeOriginalFilename: false,
    },
    fields: [
      defineField({
        name: "alt",
        title: "Bildbeschreibung",
        type: "string",
        validation: (rule) => rule.required().min(8).max(240),
      }),
    ],
    validation: (rule) =>
      rule.custom(async (value, context) => {
        if (!value) return true;
        const fields = validateGalleryImageFields(value);
        if (fields !== true) return fields;
        if (!value.asset?._ref)
          return "Bitte ein Bild hochladen oder das Feld leeren.";
        try {
          const asset = await context
            .getClient({ apiVersion: "2026-10-01" })
            .fetch("*[_id == $id][0]{mimeType,size}", { id: value.asset._ref });
          return validateAsset("image", asset);
        } catch {
          return "Die Bilddatei konnte nicht geprüft werden.";
        }
      }),
  });

export const trainingImages = defineType({
  name: "trainingImages",
  title: "Trainingsbilder",
  type: "document",
  initialValue: { contentApproved: false },
  fields: [
    websitePhotoField("onIce", "60 Minuten On-Ice"),
    websitePhotoField("offIce", "60 Minuten Off-Ice"),
    defineField({
      name: "contentApproved",
      title: "Bilder für die Website freigegeben",
      type: "boolean",
      description:
        "Bestätige die Bildrechte und erforderlichen Einwilligungen.",
      validation: (rule) =>
        rule.custom((value, { document }) =>
          (!document?.onIce && !document?.offIce) || value === true
            ? true
            : "Bitte die Bildrechte und Einwilligungen bestätigen.",
        ),
    }),
  ],
});
