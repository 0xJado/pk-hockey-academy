export type GallerySection = "on-ice" | "off-ice" | "other";
export type GallerySpotlight = "left" | "right";

export interface GalleryImage {
  type: "image";
  section?: GallerySection;
  spotlight?: GallerySpotlight;
  id: string;
  url: string;
  alt: string;
  caption?: string;
  credit: string;
  width: number;
  height: number;
}
export interface GalleryVideo {
  type: "video";
  section?: GallerySection;
  id: string;
  title: string;
  url: string;
  mimeType: "video/mp4" | "video/webm";
  poster: GalleryImage;
  transcript: string;
  caption?: string;
  credit: string;
}
export type GalleryMedia = GalleryImage | GalleryVideo;
export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  occurredOn: string;
  city: string;
  description: string;
  media: GalleryMedia[];
  cover: GalleryImage;
}
