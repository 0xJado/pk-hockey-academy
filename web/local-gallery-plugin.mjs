import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const mediaDirectory = fileURLToPath(
  new URL("./.local-gallery/media/", import.meta.url),
);
const types = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// No build hook and no public/ assets: this endpoint exists only in astro dev.
export default function localGalleryPlugin() {
  return {
    name: "local-gallery-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = (request.url || "").split("?")[0];
        if (!pathname.startsWith("/__local-gallery/")) return next();
        const name = pathname.slice("/__local-gallery/".length);
        if (!/^[a-z0-9-]+\.(webp|png|jpe?g|mp4|webm)$/.test(name)) {
          response.writeHead(404).end();
          return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.writeHead(405, { Allow: "GET, HEAD" }).end();
          return;
        }
        try {
          const [root, path] = await Promise.all([
            realpath(mediaDirectory),
            realpath(join(mediaDirectory, name)),
          ]);
          if (dirname(path) !== root) {
            response.writeHead(404).end();
            return;
          }
          const info = await stat(path);
          if (!info.isFile()) {
            response.writeHead(404).end();
            return;
          }
          response.setHeader("Content-Type", types[extname(name)]);
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("X-Robots-Tag", "noindex, nofollow");
          response.setHeader("X-Content-Type-Options", "nosniff");
          response.setHeader("Accept-Ranges", "bytes");
          let start = 0,
            end = info.size - 1;
          if (request.headers.range) {
            const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
            if (range && (range[1] || range[2])) {
              start = range[1]
                ? Number(range[1])
                : Math.max(0, info.size - Number(range[2]));
              end =
                range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
            } else start = info.size;
            if (
              !Number.isSafeInteger(start) ||
              !Number.isSafeInteger(end) ||
              start > end ||
              start >= info.size
            ) {
              response
                .writeHead(416, { "Content-Range": `bytes */${info.size}` })
                .end();
              return;
            }
            response.statusCode = 206;
            response.setHeader(
              "Content-Range",
              `bytes ${start}-${end}/${info.size}`,
            );
          }
          response.setHeader("Content-Length", end - start + 1);
          if (request.method === "HEAD") {
            response.end();
            return;
          }
          await pipeline(createReadStream(path, { start, end }), response);
        } catch (error) {
          if (response.headersSent) response.destroy();
          else response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
        }
      });
    },
  };
}
