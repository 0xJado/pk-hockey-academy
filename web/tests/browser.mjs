import { runInterviewJourneys } from "./journeys.mjs";
import { runFooterNavigation } from "./footer-navigation.mjs";
import { runRinkRouteChecks } from "./rink-routes.mjs";
// Runs against compiled static public output. No live CMS, accounts or deployment.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
const webRoot = fileURLToPath(new URL("..", import.meta.url));
const training =
  process.argv.includes("--training") ||
  process.env.PK_TRAINING_FIXTURE === "true";
let root;
if (process.env.PK_BROWSER_ROOT)
  root = resolve(webRoot, process.env.PK_BROWSER_ROOT);
else {
  let manifest;
  try {
    manifest = JSON.parse(
      await readFile(
        resolve(webRoot, "../output/cms-integration-manifest.json"),
        "utf8",
      ),
    );
  } catch {
    throw new Error(
      "Run npm run test:cms before browser checks, or supply PK_BROWSER_ROOT.",
    );
  }
  if (manifest.schemaVersion !== 1 || manifest.complete !== true)
    throw new Error("CMS checks did not complete. Run npm run test:cms again.");
  root = resolve(webRoot, training ? manifest.training : manifest.starter);
}
await stat(resolve(root, "index.html"));
const output = process.env.PK_BROWSER_OUTPUT
  ? resolve(process.env.PK_BROWSER_OUTPUT)
  : resolve(webRoot, "../output/playwright", training ? "training" : "starter");
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
let browser, context, page;
const errors = [],
  checks = [];
try {
  const channel = process.env.PK_BROWSER_CHANNEL;
  if (channel && !["chromium", "msedge", "chrome"].includes(channel))
    throw new Error("Unsupported PK_BROWSER_CHANNEL.");
  browser = await chromium.launch({
    ...(channel && channel !== "chromium" ? { channel } : {}),
    headless: true,
  });
  context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    window.__pendingTransitions = 0;
    const start = document.startViewTransition?.bind(document);
    if (start)
      document.startViewTransition = (...args) => {
        const transition = start(...args);
        window.__pendingTransitions++;
        transition.finished.then(
          () => window.__pendingTransitions--,
          () => window.__pendingTransitions--,
        );
        return transition;
      };
  });
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: false,
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const external = [];
  const fixtureCrest = training
    ? await readFile(resolve(webRoot, "src/assets/brand/pk-hockey-crest.png"))
    : undefined;
  const applicationPosts = [];
  context.on("request", (request) => {
    if (
      request.method() !== "GET" &&
      request.method() !== "HEAD" &&
      new URL(request.url()).origin === origin
    )
      applicationPosts.push(request.url());
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      fixtureCrest &&
      route.request().method() === "GET" &&
      url.origin === "https://cdn.sanity.io" &&
      url.pathname === "/images/cmsqa123/qa/abc-800x1000.webp"
    )
      return route.fulfill({ body: fixtureCrest, contentType: "image/png" });
    if (url.origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const routes = training
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
      if (route === "/" && width <= 900) {
        const hero = await page.evaluate(() => ({
          actions: document
            .querySelector(".hero-actions")
            .getBoundingClientRect().bottom,
          photo: document.querySelector(".hero-art").getBoundingClientRect()
            .top,
        }));
        assert.ok(
          hero.actions <= hero.photo,
          `Hero photo covers/precedes CTAs at ${width}`,
        );
      }
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
        for (const image of await page.locator('img[loading="lazy"]').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((element) => element.decode());
        }
        await page.evaluate(() => scrollTo(0, 0));
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
  if (training) {
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
    for (const width of [1440, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      const track = page.locator("[data-carousel-track]");
      const status = page.locator("[data-carousel-status]");
      assert.equal(await page.locator(".trainer-slide").count(), 3);
      assert.equal(await page.locator("[data-trainer-template]").count(), 2);
      assert.equal(await page.locator("[data-trainer-template] a").count(), 0);
      await track.focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-carousel-status]")
            ?.textContent?.trim() === "02 / 03",
      );
      await page.keyboard.press("End");
      await page.waitForFunction(
        () => document.querySelector("[data-carousel-next]")?.disabled,
      );
      assert.equal((await status.textContent()).trim(), "03 / 03");
      await page.locator("[data-carousel-prev]").click();
      await page.waitForFunction(
        () =>
          document
            .querySelector("[data-carousel-status]")
            ?.textContent?.trim() === "02 / 03",
      );
      await track.focus();
      await page.keyboard.press("Home");
      await page.waitForFunction(
        () => document.querySelector("[data-carousel-prev]")?.disabled,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
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
      resources.length > 0 && resources.every((r) => r.bytes > 0),
      "Missing public JavaScript resource measurements",
    );
    assert.ok(
      resources.reduce((sum, r) => sum + r.bytes, 0) < 400000,
      "Public JS exceeds 400 kB decoded budget",
    );
    assert.ok(
      resources.every((r) => !/(sanity|visual-editing|framer)/i.test(r.name)),
      "Editor runtime loaded on public homepage",
    );
    await runRinkRouteChecks(page, origin);
    // Spray replays on homepage navigation, but never on preference changes.
    const spray = page.locator("[data-ice-spray]");
    assert.equal(await page.locator("[data-ice-replay]").count(), 0);
    await page.goto(origin);
    await page.waitForFunction(
      () => !document.querySelector("[data-ice-spray]")?.hidden,
    );
    await page.keyboard.press("Escape");
    assert.equal(await spray.evaluate((element) => element.hidden), true);
    await page.goto(origin);
    await page.waitForFunction(
      () => !document.querySelector("[data-ice-spray]")?.hidden,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.querySelector("[data-ice-spray]")?.hidden,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(await spray.evaluate((element) => element.hidden), true);
    await page.goto(origin);
    await page.waitForFunction(
      () => document.querySelector("[data-ice-spray]")?.hidden,
      undefined,
      { timeout: 3000 },
    );
    // Sample the actual logo-return animation, not only its final screenshot.
    // The hero's chamfered frame must never morph or pan during navigation.
    for (const width of [1440, 768, 375]) {
      await page.setViewportSize({ width, height: 900 });
      const frameShape = await page
        .locator("[data-hero-art]")
        .evaluate((element) => getComputedStyle(element).clipPath);
      await page.evaluate(() => {
        window.__heroReturn = null;
        document.addEventListener(
          "astro:page-load",
          () => {
            const samples = [];
            const started = performance.now();
            const sample = () => {
              const art = document.querySelector("[data-hero-art]");
              const line = document.querySelector("[data-hero-line]");
              samples.push({
                clip: getComputedStyle(art).clipPath,
                transform: getComputedStyle(art).transform,
                headlineOpacity: getComputedStyle(line).opacity,
                sprayHidden: document.querySelector("[data-ice-spray]").hidden,
              });
              if (performance.now() - started < 800)
                requestAnimationFrame(sample);
              else window.__heroReturn = samples;
            };
            requestAnimationFrame(sample);
          },
          { once: true },
        );
      });
      await page.locator(".site-header .wordmark").click();
      await page.waitForFunction(() => window.__heroReturn?.length > 0);
      const frames = await page.evaluate(() => window.__heroReturn);
      assert.ok(
        frames.every((frame) => frame.clip === frameShape),
        `Hero frame morphed on logo return at ${width}`,
      );
      assert.ok(
        frames.every((frame) => frame.transform === "none"),
        `Hero frame panned at ${width}`,
      );
      assert.ok(
        frames.every((frame) => frame.headlineOpacity === "1"),
        `Headline entrance replayed at ${width}`,
      );
      assert.ok(
        frames.some((frame) => !frame.sprayHidden),
        "Logo return did not play spray",
      );
      await page.waitForFunction(
        () => document.querySelector("[data-ice-spray]")?.hidden,
      );
    }
    await page.setViewportSize({ width: 1440, height: 900 });
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
      await page.waitForFunction(() => window.__pendingTransitions === 0);
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
      await page.waitForFunction(() => window.__pendingTransitions === 0);
      await page.waitForFunction(
        () => document.querySelector("[data-ice-spray]")?.hidden,
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
    await page.waitForFunction(() => window.__pendingTransitions === 0);
    await page.goForward();
    await page.waitForURL(origin + "/trainingstermine");
    await page.locator(".schedule-empty").waitFor({ state: "visible" });
    await page.waitForFunction(() => window.__pendingTransitions === 0);
    await page.goBack();
    await page.waitForURL(origin + "/");
    await page.locator("[data-hero]").waitFor({ state: "visible" });
    await runFooterNavigation(page, origin);
    const noJS = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 375, height: 812 },
    });
    const plain = await noJS.newPage();
    await plain.goto(origin);
    assert.ok(await plain.locator("h1").isVisible());
    assert.equal(await plain.locator("[data-ice-spray]").isVisible(), false);
    assert.equal(await plain.locator("[data-ice-replay]").isVisible(), false);
    await plain.locator('[data-carousel-jump="1"]').click();
    await plain.waitForFunction(
      () => document.querySelector("[data-carousel-track]").scrollLeft > 0,
    );
    await plain.locator("[data-mobile-menu] summary").click();
    await plain
      .locator('[data-mobile-menu] a[href="/trainingstermine"]')
      .click();
    await plain.waitForURL(origin + "/trainingstermine");
    assert.equal(await plain.locator("h1").count(), 1);
    await plain.goto(origin + "/kontakt");
    const email = plain.getByRole("link", {
      name: "info@pkhockeyacademy.de",
      exact: true,
    });
    assert.equal(
      await email.getAttribute("href"),
      "mailto:info@pkhockeyacademy.de",
    );
    assert.equal(await plain.locator("main form").count(), 0);
    assert.equal(
      await plain
        .locator('main a[href*="wa.me"], main a[href^="tel:"]')
        .count(),
      0,
    );
    await noJS.close();
    await runInterviewJourneys(page, context, origin, output);
    assert.deepEqual(
      applicationPosts,
      [],
      "Prototype/interview sent an application request",
    );
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
  await writeFile(
    resolve(output, "result.json"),
    JSON.stringify(
      {
        passed: true,
        routeChecks: checks.length,
        journeys: training ? [] : ["player", "trainer"],
        errors,
      },
      null,
      2,
    ),
  );
  await context.tracing.stop();
} catch (error) {
  const images = await page
    ?.evaluate(() =>
      [...document.images].map((image) => ({
        src: image.currentSrc || image.src,
        complete: image.complete,
        width: image.naturalWidth,
      })),
    )
    .catch(() => []);
  await page
    ?.screenshot({ path: resolve(output, "failure.png"), fullPage: true })
    .catch(() => {});
  await context?.tracing
    .stop({ path: resolve(output, "trace.zip") })
    .catch(() => {});
  await writeFile(
    resolve(output, "result.json"),
    JSON.stringify(
      {
        passed: false,
        message: error.message,
        images,
        routeChecks: checks.length,
        errors,
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
