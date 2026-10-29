import {
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";

export function getPreviewUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return;
  const url = new URL(value.trim());
  const local = url.hostname === "localhost" && url.protocol === "http:";
  if (
    (!local && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "SANITY_STUDIO_PREVIEW_URL must be an HTTPS origin (or http://localhost for development).",
    );
  return url.origin;
}

export function getTrainerPreviewOptions(origin: string) {
  // Presentation resolves its enable endpoint against `initial`. A relative
  // initial URL embeds Studio itself when the frontend uses another origin.
  return {
    initial: new URL("/redaktion/trainerpool", origin).href,
    previewMode: { enable: "/api/preview/enable" },
  };
}

export const trainerLocations: PresentationPluginOptions["resolve"] = {
  locations: {
    trainer: defineLocations({
      select: { name: "name", id: "_id" },
      resolve: (document) => ({
        locations: [
          {
            title: document?.name || "Neues Trainerprofil",
            href: `/redaktion/trainerpool?id=${encodeURIComponent(String(document?.id || "").replace(/^drafts\./, ""))}`,
          },
          { title: "Alle Trainerprofile", href: "/redaktion/trainerpool" },
        ],
      }),
    }),
  },
};
