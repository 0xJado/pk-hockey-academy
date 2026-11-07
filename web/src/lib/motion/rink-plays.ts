import gsap from "gsap";

let userPaused = false;

/** Five-second whiteboard trace, five-second hold, then erase. Never runs offscreen. */
export function createRinkPlays(root: HTMLElement): () => void {
  const diagrams = Array.from(
    root.querySelectorAll<SVGSVGElement>("[data-rink-loop]"),
  );
  if (!diagrams.length) return () => {};
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-rink-toggle]"),
  );
  const events = new AbortController();
  const states = diagrams.map((svg) => {
    const ink = svg.querySelector<SVGGElement>("[data-rink-ink]")!;
    const strokes = Array.from(
      ink.querySelectorAll<SVGGeometryElement>(
        "path:not(.rink-route):not(.rink-route-arrow), rect, circle:not(.rink-dot)",
      ),
    );
    const dot = ink.querySelector(".rink-dot");
    const route = ink.querySelector<SVGPathElement>("[data-rink-route]");
    const arrow = ink.querySelector<SVGPathElement>(".rink-route-arrow");
    const timeline = gsap.timeline({
      paused: true,
      repeat: -1,
      repeatDelay: 0.4,
    });
    timeline.fromTo(ink, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0);
    // Keep every dash in physical SVG units. Mixing normalized pathLength=1
    // with GSAP's CSS pixel values makes the long coaching route pop into view.
    const lengths = strokes.map((stroke) => stroke.getTotalLength());
    timeline.fromTo(
      strokes,
      {
        strokeDasharray: (i: number) => `${lengths[i]} ${lengths[i]}`,
        strokeDashoffset: (i: number) => lengths[i]!,
      },
      {
        strokeDashoffset: 0,
        duration: 2.5,
        stagger: { amount: 1 },
        ease: "power1.inOut",
      },
      0,
    );
    if (route) {
      const length = route.getTotalLength();
      timeline.fromTo(
        route,
        {
          strokeDasharray: `${length} ${length}`,
          strokeDashoffset: length,
        },
        { strokeDashoffset: 0, duration: 3.9, ease: "none" },
        0.9,
      );
    }
    // The arrowhead appears only once the continuous route reaches its endpoint.
    if (arrow)
      timeline.fromTo(
        arrow,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 },
        4.8,
      );
    if (dot)
      timeline.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 4.8);
    timeline.to(ink, { opacity: 0, duration: 0.8, ease: "power1.inOut" }, 10);
    if (userPaused) timeline.seek(5).pause();
    return {
      svg,
      timeline,
      visible: false,
      section: svg.closest("section") ?? svg,
    };
  });
  const sync = () => {
    states.forEach(({ timeline, visible }) => {
      if (visible && !document.hidden && !userPaused) timeline.play();
      else timeline.pause();
    });
    buttons.forEach((button) => {
      button.hidden = false;
      button.setAttribute("aria-pressed", String(userPaused));
      button.textContent = userPaused
        ? "Spielzüge abspielen"
        : "Spielzüge pausieren";
    });
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        for (const state of states)
          if (state.section === entry.target)
            state.visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.05 },
  );
  new Set(states.map((state) => state.section)).forEach((section) =>
    observer.observe(section),
  );
  document.addEventListener("visibilitychange", sync, {
    signal: events.signal,
  });
  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        userPaused = !userPaused;
        sync();
      },
      { signal: events.signal },
    ),
  );
  sync();
  return () => {
    observer.disconnect();
    events.abort();
    states.forEach(({ timeline }) => timeline.pause());
    buttons.forEach((button) => {
      button.hidden = true;
    });
  };
}
