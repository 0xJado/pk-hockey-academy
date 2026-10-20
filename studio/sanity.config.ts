import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { deDELocale } from "@sanity/locale-de-de";
import { getStudioConfig } from "./config";
import { galleryCamp, galleryPhoto, galleryVideo } from "./schemaTypes/gallery";

export default defineConfig({
  name: "pk-hockey-academy",
  title: "PK Hockey Academy · Redaktion",
  ...getStudioConfig(),
  plugins: [
    deDELocale(),
    structureTool({
      title: "Camp-Galerie",
      structure: (S) =>
        S.list()
          .title("Camp-Galerie")
          .items([
            S.documentTypeListItem("galleryCamp").title("Alle Camp-Alben"),
            S.listItem()
              .id("public-albums")
              .title("Für die Website freigegeben")
              .child(
                S.documentList()
                  .title("Freigegebene Alben")
                  .filter(
                    '_type == "galleryCamp" && visibility == "public" && rightsConfirmed == true',
                  ),
              ),
          ]),
    }),
  ],
  schema: { types: [galleryCamp, galleryPhoto, galleryVideo] },
});
