import { asRecord } from "../../shared/trainer-profile.ts";

// Derive only same-project raster URLs, never a URL entered by an editor.
export function previewPortraitUrl(
  value: unknown,
  projectId: string,
  dataset: string,
): string | undefined {
  const ref = asRecord(asRecord(value).asset)._ref;
  if (
    typeof ref !== "string" ||
    !/^[a-z0-9]+$/.test(projectId) ||
    !/^[a-z0-9_-]+$/.test(dataset)
  )
    return;
  const match = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(jpg|jpeg|png|webp)$/.exec(
    ref,
  );
  if (
    !match ||
    Number(match[2]) <= 0 ||
    Number(match[3]) <= 0 ||
    Number(match[2]) > 30000 ||
    Number(match[3]) > 30000
  )
    return;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}x${match[3]}.${match[4]}?w=700&auto=format&fit=max`;
}
