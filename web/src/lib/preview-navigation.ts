// Coalesce mutation refreshes while giving a document switch priority.
export function createPreviewNavigation(reload: () => void, delay = 650) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let leaving = false;

  function leave() {
    if (leaving) return false;
    leaving = true;
    clearTimeout(timer);
    return true;
  }

  function refresh(source: "manual" | "mutation"): false | Promise<void> {
    if (leaving) return false;
    clearTimeout(timer);
    if (source === "manual") {
      if (leave()) reload();
      return Promise.resolve();
    }
    timer = setTimeout(() => {
      if (leave()) reload();
    }, delay);
    // The reload itself reconnects the frame. Keep Studio's mutation
    // refresh indicator idle while the editor is still typing.
    return false;
  }

  return { leave, refresh };
}
