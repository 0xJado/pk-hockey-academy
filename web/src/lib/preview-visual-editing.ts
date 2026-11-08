import {createPreviewNavigation} from './preview-navigation';
export async function installPreviewEditing(preview: HTMLElement) {
    const { enableVisualEditing } =
      await import("@sanity/visual-editing/enable-visual-editing");
    const navigation = createPreviewNavigation(() => location.reload());
    const disable = enableVisualEditing({
      refresh(payload) {
        if (payload.source === "mutation") {
          const selected = preview.dataset.profileId;
          if (
            payload.document._type !== "trainer" ||
            (selected &&
              payload.document._id.replace(/^drafts\./, "") !== selected)
          )
            return false;
        }
        return navigation.refresh(payload.source);
      },
      history: {
        subscribe(navigate) {
          const update = () => navigate({ type: "pop", url: location.href });
          update();
          addEventListener("popstate", update);
          addEventListener("hashchange", update);
          return () => {
            removeEventListener("popstate", update);
            removeEventListener("hashchange", update);
          };
        },
        update(update) {
          const url = new URL(update.url, location.origin);
          if (
            url.origin !== location.origin ||
            url.pathname !== "/redaktion/trainerpool"
          )
            return;
          const current = new URL(location.href);
          if (
            !url.searchParams.has("perspective") &&
            current.searchParams.get("perspective") === "published"
          )
            url.searchParams.set("perspective", "published");
          if (url.href === current.href) return;
          // Hash jumps stay in this document and keep the editing connection.
          if (url.search !== current.search && !navigation.leave()) return;
          if (update.type === "replace") location.replace(url.href);
          else location.assign(url.href);
        },
      },
      onPerspectiveChange(perspective) {
        const url = new URL(location.href);
        const isPublished =
          perspective === "published" ||
          (Array.isArray(perspective) &&
            perspective.length === 1 &&
            perspective[0] === "published");
        const value = isPublished ? "published" : "drafts";
        if ((url.searchParams.get("perspective") || "drafts") === value) return;
        url.searchParams.set("perspective", value);
        if (navigation.leave()) location.replace(url.href);
      },
    });
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      "[data-preview-leave]",
    )) {
      link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (link.href === location.href || !navigation.leave())
          event.preventDefault();
      });
    }
    addEventListener(
      "pagehide",
      () => {
        navigation.leave();
        disable();
      },
      { once: true },
    );
    addEventListener("pageshow", (event) => {
      if (event.persisted) location.reload();
    });

}
