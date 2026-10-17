import type { APIRoute } from "astro";
export const GET: APIRoute = ({ site }) => {
  const ready = import.meta.env.PUBLIC_LAUNCH_READY === "true" && site;
  return new Response(
    ready
      ? `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", site)}\n`
      : "User-agent: *\nDisallow: /\n",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
