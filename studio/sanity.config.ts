import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { deDELocale } from "@sanity/locale-de-de";
import { getStudioConfig } from "./config";
import { galleryCamp, galleryPhoto, galleryVideo } from "./schemaTypes/gallery";
import { trainer } from "./schemaTypes/trainer";
import { TrainerPreview } from "./components/TrainerPreview";
import { EditorialGuide } from "./components/EditorialGuide";
import { getStudioAuthProvider, selectAuthProviders } from "./auth-policy";
import { pierreProfile } from "../shared/pierre-profile.ts";

const authProvider = getStudioAuthProvider({
  SANITY_STUDIO_AUTH_PROVIDER: process.env.SANITY_STUDIO_AUTH_PROVIDER,
});

export default defineConfig({
  name: "pk-hockey-academy",
  title: "PK Hockey Academy · Redaktion",
  ...getStudioConfig(),
  auth: {
    providers: (previous) => selectAuthProviders(previous, authProvider),
  },
  tools: (previous) => [
    ...previous,
    {
      name: "redaktionshilfe",
      title: "Redaktionshilfe",
      component: EditorialGuide,
    },
  ],
  plugins: [
    deDELocale(),
    structureTool({
      title: "Inhalte",
      defaultDocumentNode: (S, { schemaType }) =>
        schemaType === "trainer"
          ? S.document().views([
              S.view.form().title("Bearbeiten"),
              S.view.component(TrainerPreview).title("Profilvorschau"),
            ])
          : S.document().views([S.view.form()]),
      structure: (S) =>
        S.list()
          .title("PK Hockey Academy · Inhalte")
          .items([
            S.documentTypeListItem("trainer").title("Alle Trainerprofile"),
            S.listItem()
              .id("public-trainers")
              .title("Trainer mit Website-Freigabe")
              .child(
                S.documentList()
                  .title("Freigegebene Trainer")
                  .filter(
                    '_type == "trainer" && visibility == "public" && contentApproved == true && active == true',
                  )
                  .defaultOrdering([
                    { field: "displayOrder", direction: "asc" },
                    { field: "_id", direction: "asc" },
                  ]),
              ),
            S.divider(),
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
  schema: {
    types: [galleryCamp, galleryPhoto, galleryVideo, trainer],
    templates: (previous) => [
      ...previous,
      {
        id: "trainer-pierre-klein",
        title: "Pierre Klein · geprüftes Startprofil",
        schemaType: "trainer",
        value: {
          ...pierreProfile,
          active: true,
          visibility: "hidden",
          contentApproved: false,
        },
      },
    ],
  },
});
