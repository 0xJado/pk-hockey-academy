import type { APIRoute } from "astro";
import { pages } from "../data/pages";
import { getGalleryAlbums } from "../lib/gallery-source";
export const GET: APIRoute = async ({ site }) => {
  const ready = import.meta.env.PUBLIC_LAUNCH_READY === "true" && site;
  const urls = ready
    ? [
        "/",
        ...Object.keys(pages).map((page) => `/${page}`),
        "/galerie",
        "/medienkit",
        ...(await getGalleryAlbums()).map((album) => `/galerie/${album.slug}`),
      ]
    : [];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${new URL(path, site).href.replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
