// Include withdrawals and deletions: filtering by current visibility leaves stale pages.
export const CMS_PUBLICATION_FILTER = `
  (coalesce(after()._type, before()._type) in ["trainer", "galleryCamp", "socialPost", "mediaKitDownload", "venue", "trainingSession", "trainingImages", "homepageHero", "siteImages"] ||
   (before()._type == "sanity.fileAsset" && !defined(after()._id))) &&
  !(coalesce(after()._id, before()._id) in path("drafts.**")) &&
  !(coalesce(after()._id, before()._id) in path("versions.**"))
`.trim();

// The deployment service needs no document contents, media or personal details.
export const CMS_PUBLICATION_PROJECTION = `{
  "documentId": coalesce(after()._id, before()._id),
  "documentType": coalesce(after()._type, before()._type),
  "operation": delta::operation()
}`;

// Separate hook during acceptance: the existing review-host hook stays intact.
export function stratoPublicationWebhook(dataset: string, token: string) {
  if (!/^[a-z0-9_-]+$/.test(dataset) || !/^github_pat_[A-Za-z0-9_]{20,240}$/.test(token))
    throw new Error('Use the approved dataset and a repository-scoped fine-grained token.');
  return {
    name: 'PK Hockey Academy · STRATO',
    type: 'document' as const,
    dataset,
    url: 'https://api.github.com/repos/0xJado/pk-hockey-academy/actions/workflows/strato-publish.yml/dispatches',
    apiVersion: 'v2025-02-19',
    httpMethod: 'POST',
    headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10'},
    includeDrafts: false,
    includeAllVersions: false,
    isDisabledByUser: false,
    rule: {on: ['create','update','delete'],filter: CMS_PUBLICATION_FILTER,projection: '{"ref": "main"}'},
  };
}

export function publicationWebhook(dataset: string, destination: string) {
  if (!/^[a-z0-9_-]+$/.test(dataset))
    throw new Error("Invalid webhook dataset.");
  const url = new URL(destination);
  if (
    url.origin !== "https://api.vercel.com" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/v1\/integrations\/deploy\/prj_[A-Za-z0-9]+\/[A-Za-z0-9_-]+$/.test(
      url.pathname,
    )
  )
    throw new Error(
      "Use the exact Vercel deploy-hook URL, without extra parameters.",
    );
  return {
    name: "PK Hockey Academy · Website",
    description:
      "Published trainers, camp albums, curated posts and media-kit downloads → static website rebuild.",
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
