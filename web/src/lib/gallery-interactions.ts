import { layoutGalleryTiles } from "./gallery-layout";
import { enhanceVideoPlayer } from "./video-player";

export function installGallery() {
  if (customElements.get("camp-gallery")) return;
  customElements.define(
    "camp-gallery",
    class extends HTMLElement {
      private cleanup?: () => void;
      connectedCallback() {
        // Astro replaces inert video nodes immediately after connecting the new body.
        // Bind after that synchronous swap so playback references stay attached.
        queueMicrotask(() => {
          if (this.isConnected) this.initialize();
        });
      }
      private initialize() {
        this.cleanup?.();
        const events = new AbortController();
        const options = { signal: events.signal };
        const dialog = this.querySelector<HTMLDialogElement>(
          "[data-gallery-dialog]",
        );
        const image = this.querySelector<HTMLImageElement>(
          "[data-dialog-image]",
        );
        const viewerVideo = this.querySelector<HTMLVideoElement>(
          "[data-dialog-video]",
        );
        const viewerPlayer = this.querySelector<HTMLElement>(
          "[data-dialog-player]",
        );
        for (const player of this.querySelectorAll<HTMLElement>(
          "[data-video-player]",
        ))
          enhanceVideoPlayer(player, events.signal);
        let media = Array.from(
          this.querySelectorAll<HTMLElement>(
            ".camp-media-grid > [data-media-type]",
          ),
        );
        const viewerNav = Array.from(
          this.querySelectorAll<HTMLButtonElement>(
            "[data-gallery-prev], [data-gallery-next]",
          ),
        );
        const videos = Array.from(
          this.querySelectorAll<HTMLVideoElement>(".camp-media-grid video"),
        );
        const pauseVideos = () => {
          for (const video of videos) video.pause();
          viewerVideo?.pause();
        };
        let current = 0;
        let displayed: HTMLElement | undefined;
        let opener: HTMLElement | undefined;
        let overflow = "";
        const clearViewer = () => {
          if (image) {
            image.hidden = true;
            image.removeAttribute("src");
            image.alt = "";
          }
          if (viewerVideo) {
            viewerVideo.pause();
            viewerVideo.hidden = true;
            if (viewerVideo.hasAttribute("src")) {
              viewerVideo.removeAttribute("src");
              viewerVideo.load();
            }
            viewerVideo.removeAttribute("poster");
          }
          if (viewerPlayer) viewerPlayer.hidden = true;
          if (dialog) delete dialog.dataset.viewerType;
          displayed = undefined;
        };
        const show = (index: number) => {
          if (!media.length || !image || !viewerVideo) return;
          current = (index + media.length) % media.length;
          const tile = media[current]!;
          const isVideo = tile.dataset.mediaType === "video";
          const position = this.querySelector("[data-media-position]");
          if (position)
            position.textContent = `${isVideo ? "Video" : "Foto"} ${current + 1} von ${media.length}`;
          for (const button of viewerNav) button.hidden = media.length < 2;
          // A responsive repack must not restart the currently viewed video.
          if (displayed === tile) return;
          clearViewer();
          displayed = tile;
          const description = this.querySelector("[data-media-description]");
          if (description)
            description.textContent = Array.from(
              tile.querySelector("figcaption")?.children ?? [],
            )
              .map((element) => element.textContent)
              .join("\n");
          if (isVideo) {
            const inline = tile.querySelector("video")!;
            const source = inline.querySelector("source")!;
            viewerVideo.src = source.src;
            viewerVideo.poster = inline.poster;
            viewerVideo.width = inline.width;
            viewerVideo.height = inline.height;
            viewerVideo.setAttribute(
              "aria-label",
              inline.getAttribute("aria-label") ?? "Camp-Video",
            );
            const fallback = viewerVideo.querySelector<HTMLAnchorElement>(
              "[data-dialog-video-link]",
            );
            if (fallback) fallback.href = source.src;
            viewerVideo.hidden = false;
            if (viewerPlayer) viewerPlayer.hidden = false;
            if (dialog) dialog.dataset.viewerType = "video";
          } else {
            const link = tile.querySelector<HTMLAnchorElement>(
              "[data-gallery-photo]",
            )!;
            image.src = link.href;
            image.alt = link.querySelector("img")!.alt;
            image.hidden = false;
          }
        };
        const refreshLayout = () => {
          const selected = media[current];
          for (const grid of this.querySelectorAll<HTMLElement>(
            ".camp-media-grid",
          )) {
            const elements = Array.from(
              grid.querySelectorAll<HTMLElement>("[data-media-type]"),
            )
              .filter((element) => !element.hidden)
              .sort(
                (a, b) =>
                  Number(a.dataset.galleryOrder) -
                  Number(b.dataset.galleryOrder),
              );
            const items = elements.map((element) => ({
              id: element.dataset.mediaId!,
              type:
                element.dataset.mediaType === "image"
                  ? ("image" as const)
                  : ("video" as const),
              spotlight:
                element.dataset.spotlight === "left"
                  ? ("left" as const)
                  : element.dataset.spotlight === "right"
                    ? ("right" as const)
                    : undefined,
            }));
            const nodes = new Map(
              elements.map((element) => [element.dataset.mediaId!, element]),
            );
            const desktop = layoutGalleryTiles(items, 5);
            const tablet = layoutGalleryTiles(items, 3);
            for (const tile of desktop) {
              const element = nodes.get(tile.item.id)!;
              element.style.setProperty("--tile-column", String(tile.column));
              element.style.setProperty("--tile-row", String(tile.row));
              element.style.setProperty("--tile-span", String(tile.span));
            }
            for (const tile of tablet) {
              const element = nodes.get(tile.item.id)!;
              element.style.setProperty("--tablet-column", String(tile.column));
              element.style.setProperty("--tablet-row", String(tile.row));
            }
            const columns = Number(
              getComputedStyle(grid).getPropertyValue("--gallery-columns"),
            );
            const visibleOrder =
              columns === 1
                ? layoutGalleryTiles(items, 1)
                : columns === 3
                  ? tablet
                  : desktop;
            const desired = visibleOrder.map((tile) =>
              nodes.get(tile.item.id)!,
            );
            const existing = Array.from(grid.children).filter(
              (element) => !(element as HTMLElement).hidden,
            );
            if (desired.some((element, index) => element !== existing[index])) {
              for (const element of desired)
                element.querySelector("video")?.pause();
              grid.append(...desired);
            }
          }
          media = Array.from(
            this.querySelectorAll<HTMLElement>(
              "[data-gallery-section]:not([hidden]) .camp-media-grid > [data-media-type]",
            ),
          ).filter((tile) => !tile.hidden);
          current = selected ? Math.max(0, media.indexOf(selected)) : 0;
          if (dialog?.open) show(current);
        };
        for (const query of ["(max-width: 1000px)", "(max-width: 700px)"]) {
          window
            .matchMedia(query)
            .addEventListener("change", refreshLayout, options);
        }
        if (
          dialog &&
          image &&
          viewerVideo &&
          typeof dialog.showModal === "function"
        ) {
          for (const link of this.querySelectorAll<HTMLElement>(
            "[data-gallery-open]",
          )) {
            link.hidden = false;
            link.addEventListener(
              "click",
              (event) => {
                if (
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                )
                  return;
                const tile = link.closest<HTMLElement>("[data-media-type]");
                const index = tile ? media.indexOf(tile) : -1;
                if (index < 0) return;
                event.preventDefault();
                opener = link;
                pauseVideos();
                show(index);
                overflow = document.documentElement.style.overflow;
                document.documentElement.style.overflow = "hidden";
                dialog.showModal();
              },
              options,
            );
          }
          this.querySelector("[data-gallery-close]")?.addEventListener(
            "click",
            () => dialog.close(),
            options,
          );
          this.querySelector("[data-gallery-prev]")?.addEventListener(
            "click",
            () => show(current - 1),
            options,
          );
          this.querySelector("[data-gallery-next]")?.addEventListener(
            "click",
            () => show(current + 1),
            options,
          );
          dialog.addEventListener(
            "keydown",
            (event) => {
              // Preserve the native video's arrow-key seek/volume controls.
              if (
                event.target instanceof Element &&
                event.target.closest("[data-video-player]")
              )
                return;
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                show(current + (event.key === "ArrowLeft" ? -1 : 1));
              }
            },
            options,
          );
          dialog.addEventListener(
            "click",
            (event) => {
              if (event.target === dialog) {
                const bounds = dialog.getBoundingClientRect();
                if (
                  event.clientX < bounds.left ||
                  event.clientX > bounds.right ||
                  event.clientY < bounds.top ||
                  event.clientY > bounds.bottom
                )
                  dialog.close();
              }
            },
            options,
          );
          dialog.addEventListener(
            "close",
            () => {
              document.documentElement.style.overflow = overflow;
              opener?.focus({ preventScroll: true });
              clearViewer();
            },
            options,
          );
        }
        const tabList = this.querySelector<HTMLElement>("[data-gallery-tabs]");
        const tabs = Array.from(
          this.querySelectorAll<HTMLAnchorElement>("[data-gallery-tab]"),
        );
        const panels = Array.from(
          this.querySelectorAll<HTMLElement>("[data-gallery-section]"),
        );
        const goalie = this.querySelector<HTMLElement>("[data-gallery-goalie]");
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        const positionGoalie = (animate = false) => {
          const active = tabs.find(
            (tab) => tab.getAttribute("aria-selected") === "true",
          );
          if (!goalie || !tabList || !active) return;
          const label =
            active.querySelector<HTMLElement>("[data-gallery-tab-label]") ??
            active;
          goalie.hidden = false;
          goalie.dataset.animate = String(animate && !reducedMotion.matches);
          const target = label.getBoundingClientRect();
          const left =
            target.left +
            target.width / 2 -
            tabList.getBoundingClientRect().left -
            goalie.offsetWidth / 2;
          goalie.style.setProperty("--goalie-x", `${left}px`);
        };
        const goalieResize =
          typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => positionGoalie())
            : undefined;
        if (tabList) goalieResize?.observe(tabList);
        for (const tab of tabs)
          goalieResize?.observe(
            tab.querySelector("[data-gallery-tab-label]") ?? tab,
          );
        reducedMotion.addEventListener(
          "change",
          () => positionGoalie(),
          options,
        );
        const activateTab = (
          tab: HTMLAnchorElement,
          focus = false,
          updateHash = true,
        ) => {
          for (const candidate of tabs) {
            const active = candidate === tab;
            candidate.setAttribute("aria-selected", String(active));
            candidate.tabIndex = active ? 0 : -1;
          }
          for (const panel of panels) {
            panel.hidden =
              panel.dataset.gallerySection !== tab.dataset.galleryTab;
            if (panel.hidden)
              for (const video of panel.querySelectorAll("video"))
                video.pause();
          }
          refreshLayout();
          positionGoalie(updateHash);
          if (focus) tab.focus({ preventScroll: true });
          if (updateHash && location.hash !== tab.hash)
            history.replaceState(history.state, "", tab.hash);
        };
        if (tabList && tabs.length) {
          tabList.setAttribute("role", "tablist");
          for (const tab of tabs) {
            const panel = panels.find(
              (item) => item.dataset.gallerySection === tab.dataset.galleryTab,
            );
            if (!panel) continue;
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-controls", panel.id);
            tab.removeAttribute("aria-current");
            panel.setAttribute("role", "tabpanel");
            panel.setAttribute("aria-labelledby", tab.id);
            panel.tabIndex = 0;
            tab.addEventListener(
              "click",
              (event) => {
                if (
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                )
                  return;
                event.preventDefault();
                activateTab(tab);
              },
              options,
            );
            tab.addEventListener(
              "keydown",
              (event) => {
                let index = tabs.indexOf(tab);
                if (event.key === "ArrowRight")
                  index = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft")
                  index = (index - 1 + tabs.length) % tabs.length;
                else if (event.key === "Home") index = 0;
                else if (event.key === "End") index = tabs.length - 1;
                else if (event.key !== " ") return;
                event.preventDefault();
                activateTab(tabs[index]!, true);
              },
              options,
            );
          }
          this.dataset.tabsReady = "true";
          activateTab(
            tabs.find((tab) => tab.hash === location.hash) ?? tabs[0]!,
            false,
            false,
          );
        } else {
          refreshLayout();
        }
        const observer =
          "IntersectionObserver" in window
            ? new IntersectionObserver(
                (entries) => {
                  for (const entry of entries)
                    if (!entry.isIntersecting)
                      (entry.target as HTMLVideoElement).pause();
                },
                { threshold: 0.02 },
              )
            : undefined;
        for (const video of videos) {
          observer?.observe(video);
          video.addEventListener(
            "play",
            () => {
              for (const other of videos) if (other !== video) other.pause();
              viewerVideo?.pause();
            },
            options,
          );
        }
        viewerVideo?.addEventListener(
          "play",
          () => {
            for (const video of videos) video.pause();
          },
          options,
        );
        document.addEventListener(
          "visibilitychange",
          () => {
            if (document.hidden) pauseVideos();
          },
          options,
        );
        this.cleanup = () => {
          if (dialog?.open) {
            dialog.close();
            document.documentElement.style.overflow = overflow;
          }
          clearViewer();
          events.abort();
          goalieResize?.disconnect();
          observer?.disconnect();
          pauseVideos();
        };
      }
      disconnectedCallback() {
        this.cleanup?.();
        this.cleanup = undefined;
      }
    },
  );
}
