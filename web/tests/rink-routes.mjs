import assert from "node:assert/strict";

export async function runRinkRouteChecks(page, origin) {
  await page.goto(origin);
  await page.waitForFunction(
    () => document.documentElement.dataset.motion === "ready",
  );
  const route = page.locator(".hero-rink [data-rink-route]");
  await page.waitForFunction(() => {
    const path = document.querySelector(".hero-rink [data-rink-route]");
    const offset = Number.parseFloat(getComputedStyle(path).strokeDashoffset);
    return (
      offset > path.getTotalLength() * 0.25 &&
      offset < path.getTotalLength() * 0.75
    );
  });
  const partial = await route.evaluate(async (path) => {
    const style = getComputedStyle(path);
    const length = path.getTotalLength();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1000 640");
    svg.setAttribute("width", "1000");
    svg.setAttribute("height", "640");
    const copy = path.cloneNode();
    copy.removeAttribute("style");
    copy.setAttribute("fill", "none");
    copy.setAttribute("stroke", "white");
    copy.setAttribute("stroke-width", "6");
    copy.setAttribute("stroke-dasharray", style.strokeDasharray);
    copy.setAttribute("stroke-dashoffset", style.strokeDashoffset);
    svg.append(copy);
    const image = new Image();
    image.src =
      "data:image/svg+xml," +
      encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const alphaAt = (fraction) => {
      const point = path.getPointAtLength(length * fraction);
      const pixels = context.getImageData(
        Math.round(point.x) - 4,
        Math.round(point.y) - 4,
        9,
        9,
      ).data;
      return Math.max(
        ...Array.from(pixels).filter((_, index) => index % 4 === 3),
      );
    };
    return {
      length,
      dash: Number.parseFloat(style.strokeDasharray),
      offset: Number.parseFloat(style.strokeDashoffset),
      normalized: path.hasAttribute("pathLength"),
      startAlpha: alphaAt(0.06),
      endAlpha: alphaAt(0.95),
      arrowOpacity: Number(
        getComputedStyle(path.parentElement.querySelector(".rink-route-arrow"))
          .opacity,
      ),
    };
  });
  assert.equal(partial.normalized, false);
  assert.ok(
    Math.abs(partial.dash - partial.length) < 0.1,
    "Route dash uses a different unit system from its geometry",
  );
  assert.ok(
    partial.startAlpha > 100,
    "Route start is not actually painted during the trace",
  );
  assert.equal(
    partial.endAlpha,
    0,
    "Route endpoint is painted before the pen reaches it",
  );
  assert.equal(
    partial.arrowOpacity,
    0,
    "Arrowhead appears before the route finishes",
  );
  await page.waitForFunction(() => {
    const path = document.querySelector(".hero-rink [data-rink-route]");
    return (
      Number.parseFloat(getComputedStyle(path).strokeDashoffset) < 0.001 &&
      Number(
        getComputedStyle(path.parentElement.querySelector(".rink-route-arrow"))
          .opacity,
      ) > 0.99
    );
  });
  assert.equal(
    await page
      .locator("[data-rink-loop] [data-rink-route][pathLength]")
      .count(),
    0,
  );
  console.log(
    "Rink routes: partial SVG raster paints the start but not the endpoint; arrow appears after completion.",
  );
}
