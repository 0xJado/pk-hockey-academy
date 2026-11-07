import assert from "node:assert/strict";

export async function runFooterNavigation(page, origin) {
  await page.setViewportSize({ width: 974, height: 884 });
  await page.goto(origin);
  const destinations = await page
    .locator('.site-footer a[href^="/"]')
    .evaluateAll((links) =>
      [...new Set(links.map((link) => link.getAttribute("href")))].filter(
        (href) => href !== "/",
      ),
    );
  for (const [index, path] of destinations.entries()) {
    await page.goto(origin);
    await page.waitForFunction(
      () => document.documentElement.dataset.motion === "ready",
    );
    await page.evaluate(() =>
      scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    const oldY = await page.evaluate(() => {
      const source = document.querySelector("main");
      window.__footerPositions = [];
      const sample = () => {
        if (document.querySelector("main") === source) {
          window.__footerPositions.push(scrollY);
          requestAnimationFrame(sample);
        }
      };
      sample();
      return scrollY;
    });
    await page.locator(`.site-footer a[href="${path}"]`).click();
    await page.waitForURL(origin + path);
    await page.waitForFunction(
      () => document.documentElement.dataset.motion === "ready",
    );
    const target = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const incoming = [];
          const start = performance.now();
          const sample = () => {
            incoming.push(scrollY);
            if (performance.now() - start < 400) requestAnimationFrame(sample);
            else
              resolve({
                outgoing: window.__footerPositions,
                incoming,
                transition: getComputedStyle(document.querySelector("main"))
                  .viewTransitionName,
              });
          };
          sample();
        }),
    );
    assert.ok(
      target.outgoing.every((y) => y > oldY - 100),
      `Footer navigation moved the outgoing page: ${path}`,
    );
    assert.ok(
      target.incoming.every((y) => y < 2),
      `Footer destination inherited an old scroll position: ${path}`,
    );
    assert.equal(
      target.transition,
      "none",
      "Tall main element has its own morphing transition",
    );
    if (index === 0) {
      await page.goBack();
      await page.waitForURL(origin + "/");
      await page.waitForFunction(
        () => document.documentElement.dataset.motion === "ready",
      );
      await page.waitForFunction((expected) => scrollY > expected - 100, oldY);
    }
  }
  console.log(
    `Footer: ${destinations.length} destinations preserve the outgoing viewport and open at the top; Back restores the footer.`,
  );
}
