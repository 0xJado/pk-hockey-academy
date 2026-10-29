// Include withdrawals and deletions: filtering by current visibility leaves stale pages.
export const CMS_PUBLICATION_FILTER = `
  coalesce(after()._type, before()._type) in ["trainer", "galleryCamp", "socialPost"] &&
  !(coalesce(after()._id, before()._id) in path("drafts.**")) &&
  !(coalesce(after()._id, before()._id) in path("versions.**"))
`.trim();

// The deployment service needs no document contents, media or personal details.
export const CMS_PUBLICATION_PROJECTION = `{
  "documentId": coalesce(after()._id, before()._id),
  "documentType": coalesce(after()._type, before()._type),
  "operation": delta::operation()
}`;

export function publicationWebhook(dataset: string, destination: string) {
  if (!/^[a-z0-9_-]+$/.test(dataset)) throw new Error("Invalid webhook dataset.");
  const url = new URL(destination);
  if (
    url.origin !== "https://api.vercel.com" || url.username || url.password ||
    url.search || url.hash ||
    !/^\/v1\/integrations\/deploy\/prj_[A-Za-z0-9]+\/[A-Za-z0-9_-]+$/.test(url.pathname)
  ) throw new Error("Use the exact Vercel deploy-hook URL, without extra parameters.");
  return {
    name: "PK Hockey Academy · Website",
    description: "Published trainers, camp albums and curated posts → static website rebuild.",
    type: "document" as const,
    dataset,
    url: url.href,
    apiVersion: "v2025-02-19",
    httpMethod: "POST",
    includeDrafts: false,
    includeAllVersions: false,
    isDisabledByUser: false,
    rule: {
      on: ["create", "update", "delete"],
      filter: CMS_PUBLICATION_FILTER,
      projection: CMS_PUBLICATION_PROJECTION,
    },
  };
}
