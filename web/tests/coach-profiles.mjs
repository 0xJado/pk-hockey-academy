// Isolated CMS fixture output only. Never reads or changes live coach content.
import assert from "node:assert/strict";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const webRoot = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(
  await readFile(
    resolve(webRoot, "../output/cms-integration-manifest.json"),
    "utf8",
  ),
);
assert.equal(manifest.complete, true, "Run test:cms first");
const root = resolve(webRoot, manifest.training);
const output = resolve(webRoot, "../output/playwright/coach-profiles");
await mkdir(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    let file = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (file !== root && !file.startsWith(root + sep))
      return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    res.setHeader(
      "Content-Type",
      mime[extname(file)] ?? "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    channel: process.env.PK_BROWSER_CHANNEL ?? "msedge",
    headless: true,
  });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const errors = [];
  const fixture = await readFile(
    resolve(webRoot, "src/assets/brand/pk-hockey-crest.png"),
  );
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (
      url.origin === "https://cdn.sanity.io" &&
      url.pathname.startsWith("/images/cmsqa123/qa/")
    )
      return route.fulfill({ contentType: "image/png", body: fixture });
    errors.push(`Unexpected external request: ${url.origin}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 974, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + "/trainerpool/fixture-coach");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page.locator("h1").evaluate((el) => getComputedStyle(el).color),
      "rgb(221, 236, 248)",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.match(
      await page.locator("h1").innerText(),
      /TECHNISCHES TESTPROFIL A/,
    );
    assert.match(
      await page.locator(".coach-career").innerText(),
      /Technische Testliga/,
    );
    assert.match(
      await page.locator(".coach-stats").innerText(),
      /Jahre als Trainer\s+0/,
    );
    assert.equal(await page.locator(".coach-gallery-track img").count(), 5);
    assert.equal(await page.evaluate(() => window.__careerXss), undefined);
    const track = page.locator(".coach-gallery-track");
    await track.scrollIntoViewIfNeeded();
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () => document.querySelector(".coach-gallery-track").scrollLeft > 0,
    );
    await track.evaluate((el) => (el.scrollLeft = 0));
    await page
      .locator(".coach-gallery")
      .screenshot({ path: resolve(output, `gallery-${width}.png`) });
    await track.evaluate((el) => el.blur());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".coach-hero")
      .screenshot({ path: resolve(output, `hero-${width}.png`) });
  }
  await page.goto(origin);
  await page.locator('a[href="/trainerpool/fixture-coach"]').first().click();
  await page.waitForURL("**/trainerpool/fixture-coach");
  await page.goBack();
  await page.waitForURL(origin + "/");
  await page.goto(origin + "/trainerpool/fixture-second");
  assert.match(
    await page.locator("h1").innerText(),
    /TECHNISCHES TESTPROFIL B/,
  );
  // Profile route existence and hidden/withdrawn routes are asserted by test:cms.
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  await noJs.route("https://cdn.sanity.io/**", (route) =>
    route.fulfill({ contentType: "image/png", body: fixture }),
  );
  const fallback = await noJs.newPage();
  await fallback.goto(origin + "/trainerpool/fixture-coach");
  assert.equal(await fallback.locator(".coach-gallery-track img").count(), 5);
  assert.match(
    await fallback.locator(".coach-career").innerText(),
    /Testverein A/,
  );
  await noJs.close();
  assert.deepEqual(errors, []);
  console.log(
    "Coach profiles passed: four widths, career facts including zero, five gallery images, keyboard scrolling, homepage navigation, Back and no-JS fallback.",
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
