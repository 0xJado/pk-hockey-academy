export function getStudioConfig(
  env: Record<string, string | undefined> = {
    SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
    SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET,
  },
) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID?.trim();
  const dataset = env.SANITY_STUDIO_DATASET?.trim();
  if (
    !projectId ||
    !/^[a-z0-9]+$/.test(projectId) ||
    !dataset ||
    !/^[a-z0-9_-]+$/.test(dataset)
  ) {
    throw new Error(
      "Sanity ist noch nicht eingerichtet. Projekt-ID und Dataset aus sanity.io/manage in studio/.env eintragen (siehe studio/README.md).",
    );
  }
  return { projectId, dataset };
}
