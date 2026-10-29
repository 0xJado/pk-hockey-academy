import type { APIRoute } from "astro";
import { previewCookie, previewHeaders } from "../../lib/preview-auth";
export const prerender = false;
export const GET: APIRoute = ({ cookies }) => {
  cookies.delete(previewCookie, {
    path: "/redaktion",
    secure: true,
    sameSite: "none",
    partitioned: true,
  });
  return new Response(null, {
    status: 303,
    headers: { ...previewHeaders, Location: "/trainerpool" },
  });
};
