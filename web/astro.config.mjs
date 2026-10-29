import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import localGalleryPlugin from "./local-gallery-plugin.mjs";
import vercel from "@astrojs/vercel";
import node from "@astrojs/node";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const configuredUrl = env.SITE_URL?.trim();
let site;
if (configuredUrl) {
  const url = new URL(configuredUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".invalid") ||
    url.hostname.endsWith(".example") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "SITE_URL must be a real HTTPS origin without credentials, path, query or hash.",
    );
  }
  site = url.origin;
}

export default defineConfig({
  site,
  output: "static",
  session: false,
  // Public pages remain prerendered. Only the protected editor routes need a
  // runtime. Node keeps local `astro preview` usable and hosting portable.
  adapter: env.VERCEL === "1" ? vercel() : node({ mode: "standalone" }),
  trailingSlash: "never",
  vite: { plugins: [tailwindcss(), localGalleryPlugin()] },
  devToolbar: { enabled: false },
});
