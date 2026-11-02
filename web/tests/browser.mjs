// Runs against compiled static public output. No live CMS, accounts or deployment.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    process.env.PK_PLAYWRIGHT_MODULE ||
      "../../.tools/browser/node_modules/playwright",
  ));
}
const root = resolve(process.env.PK_BROWSER_ROOT || "dist/client");
const output = resolve("../output/playwright/local-acceptance");
await mkdir(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
const server = createServer(async (req, res) => {
  try {
    let path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    res.setHeader(
      "Content-Type",
      mime[extname(path)] || "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [],
  checks = [];
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const external = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const routes = process.env.PK_TRAINING_FIXTURE
    ? ["/trainingstermine", "/trainingsstaetten"]
    : [
        "/",
        "/philosophie",
        "/training",
        "/trainerpool",
        "/trainingsstaetten",
        "/trainingstermine",
        "/organisation",
        "/kontakt",
        "/anmeldung",
        "/galerie",
        "/medienkit",
        "/verwaltung",
        "/impressum",
        "/datenschutz",
        "/interviews",
        "/spieler-interview",
        "/trainer-interview",
      ];
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(origin + route);
      assert.equal(response.status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        lang: document.documentElement.lang,
        description: document.querySelector('meta[name="description"]')
          ?.content,
        missing: [...document.images]
          .filter((i) => i.complete && !i.naturalWidth)
          .map((i) => i.src),
        editor: document.querySelectorAll("[data-sanity]").length,
        unnamed: [...document.querySelectorAll("a,button,summary")].filter(
          (e) =>
            e.getClientRects().length &&
            !e.textContent.trim() &&
            !e.getAttribute("aria-label") &&
            !e.querySelector("img[alt]") &&
            !e.getAttribute("aria-labelledby"),
        ).length,
        mains: document.querySelectorAll("main").length,
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
      }));
      assert.equal(state.h1, 1, route);
      assert.equal(state.unnamed, 0, `Unnamed control: ${route}`);
      assert.equal(state.mains, 1);
      assert.equal(state.overflow, false, `${route} at ${width}`);
      assert.equal(state.lang, "de");
      assert.ok(state.description);
      assert.deepEqual(state.missing, []);
      assert.equal(state.editor, 0);
      assert.equal(state.scroll, "auto");
      checks.push({ route, width, ...state });
      console.log(`Checked ${route} at ${width}`);
      if (["/", "/trainingstermine", "/trainingsstaetten"].includes(route)) {
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 25));
          }
          scrollTo(0, 0);
        });
        await page.waitForFunction(() =>
          [...document.images].every((i) => i.complete && i.naturalWidth > 0),
        );
        await page.screenshot({
          path: resolve(
            output,
            `${route === "/" ? "home" : route.slice(1)}-${width}.png`,
          ),
          fullPage: true,
        });
      }
    }
  }
  if (process.env.PK_TRAINING_FIXTURE) {
    await page.goto(origin + "/trainingstermine");
    assert.equal(
      await page.getByText("Technischer Testtermin", { exact: true }).count(),
      1,
    );
    assert.equal(
      await page.getByText("Technische Testhalle", { exact: true }).count(),
      1,
    );
    assert.ok(await page.locator(".session-card button").isDisabled());
    assert.equal(await page.locator(".session-card a").count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      JSON.stringify({
        fixtureChecks: checks.length,
        bookingDisabled: true,
        errors,
        external,
      }),
    );
  } else {
    await page.goto(origin);
    const summary = page.locator("[data-mobile-menu] summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    assert.ok(await page.locator("[data-mobile-menu]").evaluate((e) => e.open));
    await page.keyboard.press("Escape");
    assert.equal(
      await summary.evaluate((e) => document.activeElement === e),
      true,
    );
    await page.keyboard.press("Tab");
    await page.goto(origin);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.classList.contains("skip-link"),
      ),
      true,
    );
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "inhalt",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(origin);
    await page.waitForFunction(
      () => document.documentElement.dataset.motion === "ready",
    );
    const resources = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((r) => r.initiatorType === "script")
        .map((r) => ({ name: r.name, bytes: r.decodedBodySize })),
    );
    assert.ok(
      resources.reduce((sum, r) => sum + r.bytes, 0) < 400000,
      "Public JS exceeds 400 kB decoded budget",
    );
    assert.ok(
      resources.every((r) => !/(sanity|visual-editing|framer)/i.test(r.name)),
      "Editor runtime loaded on public homepage",
    );
    const counts = [];
    for (let i = 0; i < 3; i++) {
      await page.locator(".header-cta").click();
      await page.waitForURL(origin + "/trainingstermine");
      await page.locator(".schedule-empty").waitFor({ state: "visible" });
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.motion === "ready" &&
          !document.querySelector("[data-hero]"),
      );
      await page.goBack();
      await page.waitForURL(origin + "/");
      await page.locator("[data-hero]").waitFor({ state: "visible" });
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.motion === "ready" &&
          Number(document.documentElement.dataset.motionTriggers) > 0,
      );
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      await page.waitForFunction(
        () => Number(document.documentElement.dataset.motionTriggers) > 0,
      );
      counts.push(
        await page.evaluate(
          () => document.documentElement.dataset.motionTriggers,
        ),
      );
    }
    assert.ok(counts.every((x) => Number(x) > 0));
    assert.equal(
      new Set(counts).size,
      1,
      `Animation listeners accumulated: ${counts}`,
    );
    await page.goForward();
    await page.waitForURL(origin + "/trainingstermine");
    await page.locator(".schedule-empty").waitFor({ state: "visible" });
    await page.goBack();
    await page.waitForURL(origin + "/");
    await page.locator("[data-hero]").waitFor({ state: "visible" });
    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    const plain = await noJS.newPage();
    await plain.goto(origin);
    assert.ok(await plain.locator("h1").isVisible());
    await plain.locator("[data-mobile-menu] summary").click();
    await plain
      .locator('[data-mobile-menu] a[href="/trainingstermine"]')
      .click();
    await plain.waitForURL(origin + "/trainingstermine");
    assert.equal(await plain.locator("h1").count(), 1);
    await noJS.close();
    assert.deepEqual(
      external,
      [],
      "Public routes requested external resources",
    );
    assert.deepEqual(errors, [], "Browser runtime errors");
    console.log(
      JSON.stringify(
        {
          passed: checks.length,
          keyboard: true,
          noJS: true,
          history: true,
          triggerCounts: counts,
          publicScripts: resources,
          errors,
          external,
          output,
        },
        null,
        2,
      ),
    );
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
