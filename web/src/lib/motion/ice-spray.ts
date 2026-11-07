/** A finite, decorative ice-stop: no video, scroll lock, storage or input capture. */
export function createIceSpray(
  root: HTMLElement,
  entrance: boolean,
): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-ice-spray]");
  const ctx = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !ctx) return () => {};

  const events = new AbortController();
  let frame = 0;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  const stop = () => {
    cancelAnimationFrame(frame);
    clearTimeout(deadline);
    canvas.hidden = true;
    active = false;
    delete canvas.dataset.playing;
  };

  function play() {
    stop();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const width = innerWidth;
    const height = innerHeight;
    const compact = width < 768;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas!.width = Math.round(width * ratio);
    canvas!.height = Math.round(height * ratio);
    ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
    const started = performance.now();
    const duration = compact ? 1100 : 1400;
    const reach = Math.hypot(width, height);
    const originX = width * 0.88;
    const originY = height * 0.94;
    // Stable particles avoid random layout work and make each replay consistent.
    const particles = Array.from({ length: compact ? 90 : 180 }, (_, i) => {
      const seed = ((i * 73) % 181) / 181;
      const angle = -3.08 + seed * 1.4;
      return {
        angle,
        speed: 0.28 + ((i * 37) % 101) / 101,
        size: 1 + ((i * 11) % 6),
        delay: (i % 9) * 0.012,
      };
    });
    canvas!.hidden = false;
    canvas!.dataset.playing = "true";
    active = true;
    // A hard fail-open deadline complements the normal RAF completion.
    deadline = setTimeout(stop, duration + 150);

    const draw = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      ctx!.clearRect(0, 0, width, height);
      if (progress >= 1) {
        stop();
        return;
      }
      const burst = Math.min(progress / 0.46, 1);
      const fade = 1 - Math.max(0, (progress - 0.56) / 0.44);
      const travel = 1 - Math.pow(1 - burst, 3);

      // Two curved blade scores lead the fan of powder across the frame.
      ctx!.globalAlpha = Math.max(0, 1 - progress * 2.2) * 0.6;
      ctx!.strokeStyle = "#a1cae4";
      ctx!.lineWidth = compact ? 2 : 3;
      for (const offset of [0, 12]) {
        ctx!.beginPath();
        ctx!.moveTo(width + 40, height + offset);
        ctx!.quadraticCurveTo(
          width * 0.8,
          height * 0.68 + offset,
          width * (1 - 0.6 * travel),
          height * 0.85 + offset,
        );
        ctx!.stroke();
      }

      // Broad translucent powder plumes resolve into a single whiteout, then clear.
      ctx!.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {
        const x = originX - width * travel * (0.14 + i * 0.2);
        const y = originY - height * travel * (0.3 + (i % 3) * 0.29);
        const radius = Math.max(1, reach * travel * (0.22 + i * 0.025));
        const powder = ctx!.createRadialGradient(x, y, 0, x, y, radius);
        powder.addColorStop(0, `rgba(255,255,255,${0.84 * fade})`);
        powder.addColorStop(0.5, `rgba(239,249,255,${0.62 * fade})`);
        powder.addColorStop(1, "rgba(239,249,255,0)");
        ctx!.fillStyle = powder;
        ctx!.fillRect(0, 0, width, height);
      }
      const veil =
        Math.sin(
          (Math.min(Math.max((progress - 0.2) / 0.32, 0), 1) * Math.PI) / 2,
        ) * fade;
      ctx!.fillStyle = `rgba(255,255,255,${veil * 0.94})`;
      ctx!.fillRect(0, 0, width, height);
      ctx!.fillStyle = "#fff";
      for (const particle of particles) {
        const age = Math.max(0, progress - particle.delay);
        const distance = age * reach * particle.speed * 1.65;
        const x = originX + Math.cos(particle.angle) * distance;
        const y =
          originY +
          Math.sin(particle.angle) * distance +
          age * age * height * 0.3;
        ctx!.globalAlpha = Math.min(age * 12, 1) * fade;
        ctx!.beginPath();
        ctx!.ellipse(
          x,
          y,
          particle.size * 1.8,
          particle.size * 0.55,
          particle.angle,
          0,
          Math.PI * 2,
        );
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
  }

  // Interaction always wins: even the opening animation can be dismissed immediately.
  for (const type of [
    "keydown",
    "pointerdown",
    "wheel",
    "touchstart",
    "resize",
    "blur",
  ])
    window.addEventListener(
      type,
      () => {
        if (active) stop();
      },
      { passive: true, signal: events.signal },
    );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stop();
    },
    { signal: events.signal },
  );
  if (entrance && !document.hidden) play();
  return () => {
    stop();
    events.abort();
  };
}
