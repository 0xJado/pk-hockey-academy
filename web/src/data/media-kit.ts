import logo from "../assets/brand/pk-hockey-crest.png";

interface MediaKitAsset {
  id: string;
  title: string;
  description: string;
  image: ImageMetadata;
  downloadName: string;
  format: string;
  sizeBytes: number;
}

export const mediaKitAssets: readonly MediaKitAsset[] = [
  {
    id: "academy-logo",
    title: "PK Hockey Academy Logo",
    description: "Das Academy-Wappen als Originaldatei mit transparentem Hintergrund.",
    image: logo,
    downloadName: "PK-Hockey-Academy-Logo.png",
    format: "PNG",
    sizeBytes: 1_558_622,
  },
];
