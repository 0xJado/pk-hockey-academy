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

// Opt-in PHP handoff: fragments never reach the host's access-log request URL.
// The iframe exchanges the native Sanity secret through a same-origin POST.
export function getPhpTrainerPreviewResolver(origin: string) {
  const approved = getPreviewUrl(origin);
  if (!approved || !approved.startsWith('https://'))
    throw new Error('PHP preview requires an approved HTTPS origin.');
  return async (context: {
    previewUrlSecret: string;
    studioPreviewPerspective: string;
    previewSearchParam?: string | null;
  }) => {
    const url = new URL('/redaktion/verbinden', approved);
    url.hash = new URLSearchParams({
      'sanity-preview-secret': context.previewUrlSecret,
      'sanity-preview-pathname': context.previewSearchParam || '/redaktion/trainerpool',
      'sanity-preview-perspective': context.studioPreviewPerspective,
    }).toString();
    return url.href;
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
