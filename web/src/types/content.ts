export interface TrainingSession {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  group: string;
  venueId: string;
  status: "open" | "full" | "cancelled" | "draft";
  availableSpots: number | null;
  spielerPlusUrl?: string;
  isDemo: boolean;
}
export interface Trainer {
  id: string;
  name: string;
  role: string;
  biography: string;
  verifiedBackground: string[];
  qualifications: string[];
  specialties: string[];
  portrait?: {
    url: string;
    alt: string;
    credit: string;
    width: number;
    height: number;
  };
  displayOrder: number;
  active: boolean;
}
export interface Venue {
  id: string;
  city: string;
  rinkName?: string;
  address?: string;
  status: "active_city" | "planned_city";
  photography?: string;
  details: string;
}
export interface SiteSettings {
  brandName: string;
  contactDestinations?: {
    email?: string;
    whatsapp?: string;
    formEndpoint?: string;
  };
  globalCTAs: { schedule: string; contact: string };
  socialHandles?: Record<string, string>;
  seoConfig: { defaultDescription: string };
}
export interface Pricing {
  packageLabel: string;
  price: number;
  description: string;
}
