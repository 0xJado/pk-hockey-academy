import {
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";
import type { SanityClient } from 'sanity';

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
  let capability: Promise<string> | undefined;
  let capabilityClient: SanityClient | undefined;
  return async (context: {
    client?: SanityClient;
    studioBasePath?: string | null;
    previewUrlSecret: string;
    studioPreviewPerspective: string;
    previewSearchParam?: string | null;
  }) => {
    // Studio 6 resolves legacy callbacks with an empty secret. Mint a native,
    // short-lived draft capability through the signed-in user's existing client.
    // It stays in memory/fragment only and grants no CMS editing permissions.
    let secret = context.previewUrlSecret;
    if (!secret) {
      if (!context.client) throw new Error('Signed-in Studio client required for private preview.');
      if (!capability || capabilityClient !== context.client) {
        capabilityClient = context.client;
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const generated = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        const client = context.client.withConfig({apiVersion: '2025-02-19', useCdn: false});
        capability = client.create({
          _id: `drafts.pk-strato-preview-${crypto.randomUUID()}`,
          _type: 'sanity.previewUrlSecret',
          source: 'pk-strato-presentation',
          studioUrl: typeof location === 'undefined' ? '' : new URL(context.studioBasePath || '/', location.origin).href,
          secret: generated,
        }).then(async () => {
          // Match native secret housekeeping, restricted to our expired drafts.
          await client.delete({query: '*[_type == "sanity.previewUrlSecret" && _id in path("drafts.pk-strato-preview-**") && source == "pk-strato-presentation" && dateTime(_updatedAt) < dateTime(now()) - 3600]'}).catch(() => undefined);
          return generated;
        }).catch(() => {
          capability = undefined;
          throw new Error('Private preview authentication could not be prepared. Reopen it from the signed-in Studio.');
        });
      }
      const pending = capability;
      try { secret = await pending; } finally { if (capability === pending) capability = undefined; }
    }
    const url = new URL('/redaktion/verbinden', approved);
    url.hash = new URLSearchParams({
      'sanity-preview-secret': secret,
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
