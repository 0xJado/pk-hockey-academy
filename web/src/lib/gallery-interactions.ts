import { layoutGalleryTiles } from "./gallery-layout";

export function installGallery() {
  if (customElements.get("camp-gallery")) return;
  customElements.define(
    "camp-gallery",
    class extends HTMLElement {
      private cleanup?: () => void;
      connectedCallback() {
        this.cleanup?.();
        const events = new AbortController();
        const options = { signal: events.signal };
        const dialog = this.querySelector<HTMLDialogElement>(
          "[data-gallery-dialog]",
        );
        const image = this.querySelector<HTMLImageElement>(
          "[data-dialog-image]",
        );
        let photos = Array.from(
          this.querySelectorAll<HTMLAnchorElement>("[data-gallery-photo]"),
        );
        const videos = Array.from(
          this.querySelectorAll<HTMLVideoElement>("video"),
        );
        let current = 0;
        let opener: HTMLAnchorElement | undefined;
        let overflow = "";
        const show = (index: number) => {
          if (!photos.length || !image) return;
          current = (index + photos.length) % photos.length;
          const link = photos[current]!;
          const thumbnail = link.querySelector("img")!;
          image.src = link.href;
          image.alt = thumbnail.alt;
          const position = this.querySelector("[data-photo-position]");
          if (position)
            position.textContent = `Foto ${current + 1} von ${photos.length}`;
          const description = this.querySelector("[data-photo-description]");
          if (description)
            description.textContent =
              Array.from(
                link.closest("figure")?.querySelector("figcaption")?.children ??
                  [],
              )
                .map((element) => element.textContent)
                .join("\n") || thumbnail.alt;
        };
        const refreshLayout = () => {
          const selected = photos[current];
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
          photos = Array.from(
            this.querySelectorAll<HTMLAnchorElement>(
              "[data-media-type]:not([hidden]) [data-gallery-photo]",
            ),
          );
          current = selected ? Math.max(0, photos.indexOf(selected)) : 0;
          if (dialog?.open) show(current);
        };
        refreshLayout();
        for (const query of ["(max-width: 1000px)", "(max-width: 700px)"]) {
          window
            .matchMedia(query)
            .addEventListener("change", refreshLayout, options);
        }
        if (dialog && image && typeof dialog.showModal === "function") {
          for (const link of this.querySelectorAll<HTMLAnchorElement>(
            "[data-gallery-photo]",
          )) {
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
                const index = photos.indexOf(link);
                if (index < 0) return;
                event.preventDefault();
                opener = link;
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
              image.removeAttribute("src");
            },
            options,
          );
        }
        const filters = this.querySelector<HTMLElement>(
          "[data-gallery-filters]",
        );
        if (filters) filters.hidden = false;
        for (const button of this.querySelectorAll<HTMLButtonElement>(
          "[data-filter]",
        )) {
          button.addEventListener(
            "click",
            () => {
              const filter = button.dataset.filter;
              let count = 0;
              for (const media of this.querySelectorAll<HTMLElement>(
                "[data-media-type]",
              )) {
                media.hidden =
                  filter !== "all" && media.dataset.mediaType !== filter;
                if (!media.hidden) count++;
                else media.querySelector("video")?.pause();
              }
              for (const note of this.querySelectorAll<HTMLElement>(
                "[data-video-note]",
              ))
                note.hidden = filter === "image";
              refreshLayout();
              for (const section of this.querySelectorAll<HTMLElement>(
                "[data-gallery-section]",
              )) {
                const visibleCount = section.querySelectorAll(
                  "[data-media-type]:not([hidden])",
                ).length;
                section.hidden = visibleCount === 0;
                const countLabel = section.querySelector(
                  "[data-section-count]",
                );
                if (countLabel)
                  countLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "Aufnahme" : "Aufnahmen"}`;
                const link = this.querySelector<HTMLElement>(
                  `[data-section-link="${section.dataset.gallerySection}"]`,
                );
                if (link) link.hidden = section.hidden;
              }
              const navigation = this.querySelector<HTMLElement>(
                ".gallery-section-nav",
              );
              if (navigation) navigation.hidden = count === 0;
              for (const sibling of this.querySelectorAll("[data-filter]"))
                sibling.setAttribute(
                  "aria-pressed",
                  String(sibling === button),
                );
              const status = this.querySelector("[data-filter-status]");
              const noun =
                filter === "image"
                  ? count === 1
                    ? "Foto"
                    : "Fotos"
                  : filter === "video"
                    ? count === 1
                      ? "Video"
                      : "Videos"
                    : count === 1
                      ? "Medium"
                      : "Medien";
              if (status)
                status.textContent = count
                  ? `${count} ${noun} angezeigt.`
                  : "Für diesen Filter sind noch keine Aufnahmen vorhanden.";
            },
            options,
          );
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
            },
            options,
          );
        }
        document.addEventListener(
          "visibilitychange",
          () => {
            if (document.hidden) for (const video of videos) video.pause();
          },
          options,
        );
        this.cleanup = () => {
          if (dialog?.open) {
            dialog.close();
            document.documentElement.style.overflow = overflow;
          }
          events.abort();
          observer?.disconnect();
          for (const video of videos) video.pause();
        };
      }
      disconnectedCallback() {
        this.cleanup?.();
        this.cleanup = undefined;
      }
    },
  );
}
