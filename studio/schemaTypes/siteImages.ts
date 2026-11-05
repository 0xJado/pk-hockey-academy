import { defineField, defineType } from "sanity";
import { websitePhotoField } from "./trainingImages.ts";
import { siteImageFields } from "../../shared/site-images.ts";

export const siteImages = defineType({
  name: "siteImages",
  title: "Website-Bilder",
  type: "document",
  initialValue: { contentApproved: false },
  fields: [
    ...siteImageFields.map(({ name, title }) =>
      websitePhotoField(
        name,
        title,
        name === "crest"
          ? "Optional. Ersetzt das Wappen in Navigation, Footer, Trainer-Platzhaltern, Browser-Symbol und Link-Vorschauen. Möglichst quadratisch, mit transparentem Hintergrund."
          : name === "galleryGoalie"
            ? "Optional. Ersetzt die Torwart-Dekoration in Camp-Galerien. PNG oder WebP mit transparentem Hintergrund empfohlen."
            : "Optional. Ersetzt die Illustration auf der Startseite. Ohne eigenes Bild bleibt die bisherige Illustration sichtbar.",
      ),
    ),
    defineField({
      name: "contentApproved",
      title: "Bilder für die Website freigegeben",
      type: "boolean",
      description: "Bestätige die Bildrechte und erforderlichen Einwilligungen.",
      validation: (rule) =>
        rule.custom((value, { document }) =>
          !siteImageFields.some(({ name }) => document?.[name]) || value === true
            ? true
            : "Bitte die Bildrechte und Einwilligungen bestätigen.",
        ),
    }),
  ],
});
