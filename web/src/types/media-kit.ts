export interface MediaKitDownload {
  id: string;
  title: string;
  description: string;
  downloadName: string;
  format: string;
  sizeBytes: number;
  url: string;
  usageGuidance?: string;
  preview?: {
    image: ImageMetadata | string;
    alt: string;
    credit?: string;
    width: number;
    height: number;
  };
}
