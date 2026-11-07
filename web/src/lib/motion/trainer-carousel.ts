/** Native overflow/snap works without JS; buttons and keyboard are enhancements. */
export function createTrainerCarousels(root: HTMLElement): () => void {
  const cleanups = Array.from(
    root.querySelectorAll<HTMLElement>("[data-trainer-carousel]"),
  ).map((carousel) => {
    const track = carousel.querySelector<HTMLElement>("[data-carousel-track]");
    const previous = carousel.querySelector<HTMLButtonElement>(
      "[data-carousel-prev]",
    );
    const next = carousel.querySelector<HTMLButtonElement>(
      "[data-carousel-next]",
    );
    const status = carousel.querySelector<HTMLElement>(
      "[data-carousel-status]",
    );
    const controls = carousel.querySelector<HTMLElement>(
      "[data-carousel-controls]",
    );
    if (!track || !previous || !next || !status || !controls) return () => {};
    const slides = Array.from(track.children) as HTMLElement[];
    const links = Array.from(
      carousel.querySelectorAll<HTMLAnchorElement>("[data-carousel-jump]"),
    );
    const events = new AbortController();
    let current = 0;
    let frame = 0;
    const update = () => {
      current = slides.reduce(
        (nearest, slide, index) =>
          Math.abs(slide.offsetLeft - track.scrollLeft) <
          Math.abs(slides[nearest]!.offsetLeft - track.scrollLeft)
            ? index
            : nearest,
        0,
      );
      previous.disabled = current === 0;
      next.disabled = current === slides.length - 1;
      links.forEach((link, index) => {
        if (index === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };
    const go = (index: number) => {
      const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
      if (slide)
        track.scrollTo({
          left: slide.offsetLeft,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
    };
    previous.addEventListener("click", () => go(current - 1), {
      signal: events.signal,
    });
    links.forEach((link, index) =>
      link.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          go(index);
        },
        { signal: events.signal },
      ),
    );
    next.addEventListener("click", () => go(current + 1), {
      signal: events.signal,
    });
    track.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      },
      { passive: true, signal: events.signal },
    );
    track.addEventListener(
      "keydown",
      (event) => {
        if (event.target !== track) return;
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          go(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? slides.length - 1
                : current + (event.key === "ArrowRight" ? 1 : -1),
          );
        }
      },
      { signal: events.signal },
    );
    const resize = new ResizeObserver(() => {
      go(current);
      update();
    });
    resize.observe(track);
    controls.hidden = false;
    update();
    return () => {
      events.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
      controls.hidden = true;
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
