import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Prepare editorial imagery ahead of entry, then fade it with its associated copy. */
export function createImageReveals(root: HTMLElement): () => void {
  const cleanups = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-venue-reveal], [data-image-reveal]",
    ),
  ).map((group) => {
    const visual = group.querySelector<HTMLElement>(
      "[data-venue-visual], [data-image-visual]",
    );
    const copy = group.querySelector<HTMLElement>(
      "[data-venue-copy], [data-image-copy]",
    );
    const image = visual?.querySelector<HTMLImageElement>("img");
    if (!visual || !copy || !image) return () => {};
    let live = true;
    let entered = false;
    let ready = false;
    let preparing = false;
    let started = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const imageFade = gsap.fromTo(
      image,
      { opacity: 0 },
      { opacity: 1, duration: 0.55, paused: true },
    );
    const reveal = gsap.fromTo(
      [visual, copy],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.75, ease: "power2.out", paused: true },
    );
    const show = () => {
      if (live && entered && !started) {
        started = true;
        clearTimeout(timeout);
        reveal.play();
      }
    };
    const prepare = () => {
      if (preparing) return;
      preparing = true;
      image.loading = "eager";
      image
        .decode()
        .catch(() => {})
        .then(() => {
          if (!live) return;
          ready = true;
          imageFade.play();
          if (entered) show();
        });
    };
    const ahead = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          ahead.disconnect();
          prepare();
        }
      },
      { rootMargin: "600px" },
    );
    ahead.observe(group);
    ScrollTrigger.create({
      trigger: group,
      start: "top 90%",
      once: true,
      onEnter: () => {
        entered = true;
        if (ready) show();
        else {
          prepare();
          timeout = setTimeout(show, 1400);
        }
      },
    });
    return () => {
      live = false;
      clearTimeout(timeout);
      ahead.disconnect();
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
