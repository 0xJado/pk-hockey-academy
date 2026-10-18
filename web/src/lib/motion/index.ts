import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
let dispose: (() => void) | undefined;
let installed = false;

function initialize() {
  dispose?.();
  const root = document.querySelector<HTMLElement>("main");
  if (!root) return;
  const events = new AbortController();
  const menu = document.querySelector<HTMLDetailsElement>("[data-mobile-menu]");
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    },
    { signal: events.signal },
  );
  document.addEventListener(
    "click",
    (event) => {
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      )
        menu.open = false;
    },
    { signal: events.signal },
  );
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add(
      {
        desktop: "(min-width: 1024px)",
        mobile: "(max-width: 1023px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (m) => {
        const { desktop, reduce } = m.conditions!;
        if (reduce) return;
        const hero = root.querySelector("[data-hero]");
        if (hero) {
          const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
          timeline
            .from("[data-hero-art]", {
              clipPath: "polygon(100% 0,100% 0,100% 100%,65% 100%)",
              duration: desktop ? 1.05 : 0.65,
            })
            .from(
              "[data-hero-line]",
              {
                yPercent: desktop ? 110 : 55,
                opacity: 0,
                duration: desktop ? 0.75 : 0.5,
                stagger: 0.11,
              },
              0.12,
            )
            .from(
              "[data-hero-copy]",
              { y: 16, opacity: 0, duration: 0.6, stagger: 0.1 },
              0.5,
            );
          if (desktop)
            gsap.to("[data-parallax]", {
              y: -45,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 1,
              },
            });
        }
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.from(element, {
            y: desktop ? 35 : 18,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 94%", once: true },
          });
        });
        gsap.utils
          .toArray<HTMLElement>("[data-venue-mask]")
          .forEach((element) => {
            gsap.from(element, {
              clipPath: "polygon(0 0,0 0,0 100%,0 100%)",
              duration: 0.95,
              ease: "power3.inOut",
              scrollTrigger: { trigger: element, start: "top 90%", once: true },
            });
          });
        const panels = gsap.utils.toArray<HTMLElement>("[data-story-panel]");
        panels.forEach((panel, i) => {
          gsap.from(panel, {
            y: 35,
            opacity: 0,
            duration: 0.75,
            delay: desktop ? i * 0.2 : 0,
            scrollTrigger: { trigger: panel, start: "top 90%", once: true },
          });
          const line = panel.querySelector(".skate-line");
          if (line)
            gsap.from(line, {
              strokeDashoffset: 650,
              duration: 1.6,
              ease: "power2.out",
              scrollTrigger: { trigger: panel, start: "top 80%", once: true },
            });
        });
        if (desktop && panels.length === 2) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: "[data-story]",
                start: "top 65%",
                end: "bottom 65%",
                scrub: 0.6,
              },
            })
            .fromTo(
              panels[0]!,
              { borderTopColor: "#0754db" },
              { borderTopColor: "#adc8e6" },
            )
            .fromTo(
              panels[1]!,
              { borderTopColor: "#adc8e6" },
              { borderTopColor: "#0754db" },
              "<",
            );
        }
      },
    );
  }, root);
  // Observability for route-lifecycle QA, without a production debug UI.
  document.documentElement.dataset.motion = "ready";
  const refresh = requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    document.documentElement.dataset.motionTriggers = String(
      ScrollTrigger.getAll().length,
    );
  });
  dispose = () => {
    cancelAnimationFrame(refresh);
    events.abort();
    media.revert();
    context.revert();
    if (menu) menu.open = false;
    delete document.documentElement.dataset.motion;
    delete document.documentElement.dataset.motionTriggers;
  };
}

export function installMotion() {
  if (installed) return;
  installed = true;
  document.addEventListener("astro:page-load", initialize);
  document.addEventListener("astro:before-swap", () => {
    dispose?.();
    dispose = undefined;
  });
}
