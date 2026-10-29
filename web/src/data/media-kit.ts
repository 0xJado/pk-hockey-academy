import logo from "../assets/brand/pk-hockey-crest.png";
import type { MediaKitDownload } from "../types/media-kit.ts";

export const mediaKitAssets: readonly MediaKitDownload[] = [
  {
    id: "academy-logo",
    title: "PK Hockey Academy Logo",
    description:
      "Das Academy-Wappen als Originaldatei mit transparentem Hintergrund.",
    url: logo.src,
    preview: {
      image: logo,
      alt: "Wappen der PK Hockey Academy",
      width: logo.width,
      height: logo.height,
    },
    downloadName: "PK-Hockey-Academy-Logo.png",
    format: "PNG",
    sizeBytes: 1_558_622,
  },
];
