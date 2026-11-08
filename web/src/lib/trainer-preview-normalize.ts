import {normalizeTrainers} from './trainers.ts';
import {asRecord} from '../../../shared/trainer-profile.ts';
import type {GalleryConfig} from './gallery.ts';

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
