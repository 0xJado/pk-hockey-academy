type MobileVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—:—";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const tail = `${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(total % 60).padStart(2, "0")}`;
  return hours ? `${hours}:${tail}` : tail;
}

// Enhance only after the gallery's Astro swap has finished. Native controls are the fallback.
export function enhanceVideoPlayer(root: HTMLElement, signal: AbortSignal) {
  const video = root.querySelector<MobileVideo>("video");
  const controls = root.querySelector<HTMLElement>("[data-player-controls]");
  const start = root.querySelector<HTMLButtonElement>("[data-player-start]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-player-toggle]");
  const seek = root.querySelector<HTMLInputElement>("[data-player-seek]");
  const time = root.querySelector<HTMLElement>("[data-player-time]");
  const mute = root.querySelector<HTMLButtonElement>("[data-player-mute]");
  const fullscreen = root.querySelector<HTMLButtonElement>(
    "[data-player-fullscreen]",
  );
  const error = root.querySelector<HTMLElement>("[data-player-error]");
  const direct = root.querySelector<HTMLAnchorElement>("[data-player-direct]");
  if (
    !video ||
    !controls ||
    !start ||
    !toggle ||
    !seek ||
    !time ||
    !mute ||
    !fullscreen ||
    !error ||
    !direct
  )
    return;
  const options = { signal };
  const update = () => {
    const duration = video.duration;
    const loaded = Number.isFinite(duration) && duration > 0;
    root.dataset.playing = String(!video.paused && !video.ended);
    root.dataset.muted = String(video.muted || video.volume === 0);
    toggle.setAttribute(
      "aria-label",
      video.paused ? "Video abspielen" : "Video pausieren",
    );
    mute.setAttribute(
      "aria-label",
      video.muted || video.volume === 0 ? "Ton einschalten" : "Ton ausschalten",
    );
    time.textContent = `${clock(video.currentTime)} / ${clock(duration)}`;
    seek.disabled = !loaded;
    seek.value = loaded
      ? String(Math.round((video.currentTime / duration) * 1000))
      : "0";
    seek.style.setProperty("--player-progress", `${Number(seek.value) / 10}%`);
    seek.setAttribute(
      "aria-valuetext",
      loaded
        ? `${clock(video.currentTime)} von ${clock(duration)}`
        : "Noch nicht geladen",
    );
  };
  const fallback = () => {
    video.controls = true;
    controls.hidden = true;
    start.hidden = true;
    const source =
      video.currentSrc ||
      video.getAttribute("src") ||
      video.querySelector("source")?.src;
    if (source) {
      direct.href = source;
      error.hidden = false;
    }
  };
  const playPause = async () => {
    try {
      if (video.paused) await video.play();
      else video.pause();
    } catch (reason) {
      if (
        signal.aborted ||
        (reason instanceof DOMException && reason.name === "AbortError")
      )
        return;
      fallback();
    }
  };
  start.addEventListener(
    "click",
    async () => {
      await playPause();
      if (!video.paused && !signal.aborted)
        toggle.focus({ preventScroll: true });
    },
    options,
  );
  toggle.addEventListener("click", playPause, options);
  mute.addEventListener(
    "click",
    () => {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 1;
      } else video.muted = true;
    },
    options,
  );
  seek.addEventListener(
    "input",
    () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = (Number(seek.value) / 1000) * video.duration;
        update();
      }
    },
    options,
  );
  const supportsFullscreen = Boolean(
    typeof root.requestFullscreen === "function" && document.fullscreenEnabled,
  );
  fullscreen.hidden = !supportsFullscreen && !video.webkitEnterFullscreen;
  fullscreen.addEventListener(
    "click",
    async () => {
      try {
        if (document.fullscreenElement === root)
          await document.exitFullscreen();
        else if (supportsFullscreen) await root.requestFullscreen();
        else video.webkitEnterFullscreen?.();
      } catch {
        // Restore the browser's own controls when this device rejects custom fullscreen.
        video.controls = true;
        controls.hidden = true;
        start.hidden = true;
      }
    },
    options,
  );
  document.addEventListener(
    "fullscreenchange",
    () => {
      fullscreen.setAttribute(
        "aria-label",
        document.fullscreenElement === root
          ? "Vollbild schließen"
          : "Vollbild öffnen",
      );
    },
    options,
  );
  for (const event of [
    "timeupdate",
    "loadedmetadata",
    "durationchange",
    "pause",
    "ended",
    "volumechange",
  ]) {
    video.addEventListener(event, update, options);
  }
  video.addEventListener(
    "play",
    () => {
      root.dataset.started = "true";
      update();
    },
    options,
  );
  video.addEventListener(
    "emptied",
    () => {
      root.dataset.started = "false";
      error.hidden = true;
      controls.hidden = false;
      start.hidden = false;
      video.controls = false;
      update();
    },
    options,
  );
  // A failed <source> dispatches a non-bubbling error on that child.
  video.addEventListener("error", fallback, { ...options, capture: true });
  signal.addEventListener(
    "abort",
    () => {
      video.controls = true;
      controls.hidden = true;
      start.hidden = true;
      delete root.dataset.playerReady;
    },
    { once: true },
  );
  root.dataset.playerReady = "true";
  root.dataset.started = "false";
  update();
  controls.hidden = false;
  start.hidden = false;
  video.controls = false;
}
