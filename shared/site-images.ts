export const siteImageFields = [
  { name: "philosophy", title: "Startseite · Philosophie / Schlittschuhkufe" },
  { name: "venues", title: "Startseite · Trainingsstädte / Eisfläche" },
  { name: "crest", title: "Academy-Wappen · Navigation, Footer und Platzhalter" },
  { name: "galleryGoalie", title: "Camp-Galerie · Torwart-Dekoration" },
] as const;

export type SiteImageKey = (typeof siteImageFields)[number]["name"];
