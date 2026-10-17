import type { APIRoute } from "astro";
import { pages } from "../data/pages";
export const GET: APIRoute = ({ site }) => {
  const ready = import.meta.env.PUBLIC_LAUNCH_READY === "true" && site;
  const urls = ready
    ? ["/", ...Object.keys(pages).map((page) => `/${page}`)]
    : [];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${new URL(path, site).href.replaceAll("&", "&amp;")}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
