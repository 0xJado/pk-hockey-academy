import { createClient } from "@sanity/client";
import { normalizePreviewTrainers } from "./trainer-preview-normalize.ts";
export { normalizePreviewTrainers } from "./trainer-preview-normalize.ts";

export function getPreviewClient() {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET;
  const token = import.meta.env.SANITY_PREVIEW_READ_TOKEN;
  if (!projectId || !dataset || !token)
    throw new Error(
      "Visual Editing requires a server-only SANITY_PREVIEW_READ_TOKEN and CMS identifiers.",
    );
  return createClient({
    projectId,
    dataset,
    token,
    useCdn: false,
    apiVersion: "2026-10-01",
    timeout: 15000,
    maxRetries: 1,
  });
}

export async function getPreviewTrainers(
  id: string | null,
  published: boolean,
) {
  const client = getPreviewClient();
  const documents = await client.fetch<unknown[]>(
    `*[_type == "trainer" && (!defined($id) || _id == $id)] | order(displayOrder asc, _id asc) {
    _id, _type, name, role, biography, verifiedBackground, qualifications, specialties,
    displayOrder, active, visibility, contentApproved,
    playingYears, coachingYears, highestDivision, notableTeams,
    playerGallery[]{alt,credit,caption,asset->{url,mimeType,size,metadata{dimensions{width,height}}}},
    portrait{alt,credit,asset->{url,mimeType,size,metadata{dimensions{width,height}}}}
  }`,
    { id },
    { perspective: published ? "published" : "drafts", stega: false },
  );
  const config = client.config();
  return normalizePreviewTrainers(documents, {
    projectId: config.projectId!,
    dataset: config.dataset!,
  });
}
