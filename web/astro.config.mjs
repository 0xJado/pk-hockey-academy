import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

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
  trailingSlash: "never",
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
});
