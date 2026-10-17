import type {
  Pricing,
  SiteSettings,
  Trainer,
  TrainingSession,
  Venue,
} from "../types/content.ts";

export const settings: SiteSettings = {
  brandName: "PK Hockey Academy",
  globalCTAs: {
    schedule: "Trainingstermine ansehen",
    contact: "Training anfragen",
  },
  seoConfig: {
    defaultDescription:
      "Individuelle Eishockey-Förderung bis U13. Kleine Gruppen, persönliche Betreuung und 60 Minuten On-Ice plus 60 Minuten Off-Ice.",
  },
};
export const navigation = [
  { label: "Philosophie", href: "/philosophie" },
  { label: "Training", href: "/training" },
  { label: "Trainerpool", href: "/trainerpool" },
  { label: "Standorte", href: "/trainingsstaetten" },
];
export const trainers: Trainer[] = [
  {
    id: "pierre-klein",
    name: "Pierre Klein",
    role: "Gründer & Trainer",
    verifiedBackground: ["Eishockey- und Inlinehockey-Hintergrund"],
    specialties: [],
    active: true,
  },
];
export const venues: Venue[] = [
  ...["Essen", "Dinslaken", "Duisburg"].map((city) => ({
    id: city.toLowerCase(),
    city,
    status: "active_city" as const,
    details:
      "Die konkrete Eishalle und Treffpunktinformationen werden mit dem jeweiligen Termin bekannt gegeben.",
  })),
  ...["Herne", "Dorsten", "Wesel"].map((city) => ({
    id: city.toLowerCase(),
    city,
    status: "planned_city" as const,
    details: "In Planung. Noch kein bestätigter Trainingsbetrieb.",
  })),
];
export const pricing: Pricing[] = [
  {
    packageLabel: "Einzeltermin",
    price: 50,
    description:
      "Eine Trainingseinheit in der Kleingruppe: 60 Minuten On-Ice + 60 Minuten Off-Ice.",
  },
  {
    packageLabel: "5er-Paket",
    price: 200,
    description:
      "Fünf Trainingseinheiten. Details zur Organisation werden vor der Buchung abgestimmt.",
  },
];
// Deliberately empty: never turn illustrative dates into published appointments.
export const sessions: TrainingSession[] = [];
export const demoSessions: TrainingSession[] = [];
export const trainingPhases = [
  {
    number: "01",
    title: "ON-ICE",
    time: "60",
    kicker: "AUF DEM EIS",
    text: "Zeit für dein Spiel. Gezielte individuelle Entwicklung auf dem Eis – angepasst an den jeweiligen Leistungsstand.",
    tags: ["Individuell angepasst", "Kleine Gruppen"],
  },
  {
    number: "02",
    title: "OFF-ICE",
    time: "60",
    kicker: "NEBEN DEM EIS",
    text: "Entwicklung geht weiter. Die ergänzende Arbeit neben dem Eis macht den Trainingsblock komplett.",
    tags: ["Persönliche Betreuung", "Ganzheitlicher Trainingsblock"],
  },
];
