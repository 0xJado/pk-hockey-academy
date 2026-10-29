import { createClient } from "@sanity/client";
import { normalizeTrainers } from "./trainers.ts";
import { asRecord } from "../../../shared/trainer-profile.ts";
import type { GalleryConfig } from "./gallery.ts";

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

export function normalizePreviewTrainers(
  documents: unknown[],
  config: Pick<GalleryConfig, "projectId" | "dataset">,
) {
  const incomplete: { id: string; name: string }[] = [];
  const trainers = documents.flatMap((document) => {
    const raw = asRecord(document);
    // Inclusion flags stay intact in the public adapter. Only this authenticated
    // preview may display hidden/unapproved drafts using the shared renderer.
    try {
      return normalizeTrainers(
        [
          {
            ...raw,
            _id: String(raw._id).replace(/^drafts\./, ""),
            active: true,
            visibility: "public",
            contentApproved: true,
          },
        ],
        config,
      );
    } catch {
      incomplete.push({
        id: String(raw._id).replace(/^drafts\./, ""),
        name: typeof raw.name === "string" ? raw.name : "Neues Trainerprofil",
      });
      return [];
    }
  });
  return { trainers, incomplete };
}
