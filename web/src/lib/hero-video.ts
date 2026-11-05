let reduceVideoMotion = false;
let dispose: (() => void) | undefined;

const dwellMs = 2000;
const mobilePreviewMs = 5000;

function initialize() {
  dispose?.();
  dispose = undefined;
  const bar = document.querySelector<HTMLElement>("[data-hero-motion-bar]");
  const button = bar?.querySelector<HTMLButtonElement>("[data-hero-motion]");
  const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
  const art = video?.parentElement;
  const blackout = art?.querySelector<HTMLElement>("[data-hero-video-fade]");
  const hero = art?.closest<HTMLElement>("[data-hero]");
  const url = video?.dataset.heroVideo;
  if (!bar || !button || !video || !art || !hero || !blackout || !url) return;

  const desktop = matchMedia("(width > 900px) and (hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const options = { signal: events.signal };
  let inView = false;
  let mostlyVisible = false;
  let hovered = false;
  let failed = false;
  let previewFinished = false;
  let dwellTimer: ReturnType<typeof setTimeout> | undefined;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;
  let fade: Animation | undefined;
  let revealId = 0;
  let revealing = false;

  const eligible = () =>
    inView && (mostlyVisible || (desktop.matches && hovered)) && !reducedMotion.matches &&
    !reduceVideoMotion && !document.hidden && !failed &&
    (desktop.matches || !previewFinished) && !events.signal.aborted;

  const stop = () => {
    clearTimeout(dwellTimer);
    clearTimeout(previewTimer);
    dwellTimer = previewTimer = undefined;
    revealId++;
    revealing = false;
    fade?.cancel();
    fade = undefined;
    blackout.hidden = true;
    video.pause();
    video.hidden = true;
  };

  const finishPreview = () => {
    previewFinished = true;
    stop();
  };

  const limitPreview = () => {
    if (desktop.matches) {
      clearTimeout(previewTimer);
      previewTimer = undefined;
    } else if (!video.hidden && previewTimer === undefined) {
      previewTimer = setTimeout(finishPreview, mobilePreviewMs);
    }
  };

  const start = () => {
    dwellTimer = undefined;
    if (!eligible()) return;
    if (!video.hasAttribute("src")) video.src = url;
    void video.play().catch(() => {
      // Autoplay can be blocked. Keep the image visible.
    });
  };

  const update = () => {
    bar.hidden = !desktop.matches || reducedMotion.matches || failed;
    button.setAttribute("aria-pressed", String(reduceVideoMotion));
    video.loop = desktop.matches;
    if (!eligible()) {
      stop();
      return;
    }
    limitPreview();
    if (desktop.matches && hovered && video.paused) {
      clearTimeout(dwellTimer);
      start();
      return;
    }
    if (video.paused && dwellTimer === undefined) {
      dwellTimer = setTimeout(start, dwellMs);
    }
  };

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    mostlyVisible = entry.intersectionRatio >= 0.5;
    if (!inView) previewFinished = false;
    update();
  }, { threshold: [0, 0.5] });
  observer.observe(art);
  hero.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    update();
  }, options);
  hero.addEventListener("pointerleave", () => {
    hovered = false;
    update();
  }, options);
  desktop.addEventListener("change", update, options);
  reducedMotion.addEventListener("change", update, options);
  document.addEventListener("visibilitychange", update, options);
  button.addEventListener("click", () => {
    reduceVideoMotion = !reduceVideoMotion;
    update();
  }, options);
  video.addEventListener("playing", async () => {
    if (!eligible() || video.paused || !video.hidden || revealing) return;
    revealing = true;
    const id = ++revealId;
    blackout.hidden = false;
    try {
      fade = blackout.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 250, easing: "ease-in", fill: "forwards",
      });
      await fade.finished;
      if (id !== revealId || !eligible() || video.paused) return;
      video.hidden = false;
      fade.cancel();
      fade = blackout.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 250, easing: "ease-out", fill: "forwards",
      });
      await fade.finished;
      if (id !== revealId) return;
      limitPreview();
    } catch {
      // Navigation, motion preferences or scrolling can cancel the fade.
    } finally {
      if (id === revealId) {
        blackout.hidden = true;
        fade?.cancel();
        fade = undefined;
        revealing = false;
        if (!eligible() || video.paused) video.hidden = true;
      }
    }
  }, options);
  video.addEventListener("ended", finishPreview, options);
  video.addEventListener("error", () => {
    failed = true;
    update();
  }, options);
  update();
  dispose = () => {
    events.abort();
    observer.disconnect();
    stop();
  };
}

export function installHeroVideo() {
  document.addEventListener("astro:page-load", initialize);
  document.addEventListener("astro:before-swap", () => dispose?.());
}
