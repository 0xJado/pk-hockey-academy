import type { APIRoute } from "astro";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { getPreviewClient } from "../../../lib/trainer-preview-source";
import {
  previewCookie,
  previewHeaders,
  safePreviewRedirect,
  signPreviewSession,
} from "../../../lib/preview-auth";

export const prerender = false;
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const result = await validatePreviewUrl(getPreviewClient(), request.url);
    if (!result.isValid)
      return new Response(
        "Vorschau-Link ungültig oder abgelaufen. Bitte die Website-Vorschau im Studio neu öffnen.",
        { status: 401, headers: previewHeaders },
      );
    cookies.set(
      previewCookie,
      signPreviewSession(import.meta.env.SANITY_PREVIEW_READ_TOKEN),
      {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        path: "/redaktion",
        maxAge: 3600,
      },
    );
    return new Response(null, {
      status: 303,
      headers: {
        ...previewHeaders,
        Location: safePreviewRedirect(result.redirectTo),
      },
    });
  } catch {
    return new Response(
      "Website-Vorschau nicht verfügbar. Bitte die Vorschau-Konfiguration prüfen.",
      { status: 503, headers: previewHeaders },
    );
  }
};
