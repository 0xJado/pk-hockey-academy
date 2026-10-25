export type UpdatesNoticeState = "empty" | "unavailable";

// Local presentation copy; a future feed adapter selects the appropriate state.
export const updatesNotices = {
  empty: {
    label: "NOCH KEINE BEITRÄGE",
    title: "Neue Einblicke folgen.",
    description:
      "Hier findest du künftig ausgewählte Momente aus der PK Hockey Academy. Aktuell sind noch keine Beiträge veröffentlicht.",
  },
  unavailable: {
    label: "AKTUELL NICHT VERFÜGBAR",
    title: "Eine kurze Pause.",
    description:
      "Unsere Neuigkeiten können gerade nicht angezeigt werden. Die Camp-Galerie und die Trainingstermine erreichst du weiterhin wie gewohnt.",
  },
} satisfies Record<
  UpdatesNoticeState,
  { label: string; title: string; description: string }
>;
