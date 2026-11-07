import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import localGalleryPlugin from "./local-gallery-plugin.mjs";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "");
const target = env.DEPLOY_TARGET || "review";
if (!["review", "strato"].includes(target)) {
  throw new Error("DEPLOY_TARGET must be review or strato.");
}
const strato = target === "strato";
const adapter = strato
  ? undefined
  : env.VERCEL === "1"
    ? (await import("@astrojs/vercel")).default()
    : (await import("@astrojs/node")).default({ mode: "standalone" });
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
  adapter,
  // Runtime source is outside pages/: STRATO must never build or export drafts.
  integrations: strato ? [] : [{
    name: "review-runtime",
    hooks: {
      "astro:config:setup": ({ injectRoute }) => {
        for (const [pattern, entrypoint] of [
          ["/api/registration", "./src/runtime/api/registration.ts"],
          ["/api/preview/enable", "./src/runtime/api/preview/enable.ts"],
          ["/redaktion/trainerpool", "./src/runtime/redaktion/trainerpool.astro"],
          ["/redaktion/abmelden", "./src/runtime/redaktion/abmelden.ts"],
        ]) injectRoute({ pattern, entrypoint, prerender: false });
      },
    },
  }],
  trailingSlash: "never",
  vite: { plugins: [tailwindcss(), localGalleryPlugin()] },
  devToolbar: { enabled: false },
});
