export function getStudioConfig() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim();
  const dataset = process.env.SANITY_STUDIO_DATASET?.trim();
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
