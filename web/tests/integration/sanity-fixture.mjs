// Loaded ONLY by test:cms in child build processes. No site module imports this file.
import { appendFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const profile = {
  _id: "fixture-coach",
  _type: "trainer",
  name: "Technisches Testprofil A",
  role: "Testrolle",
  biography:
    "Dieses technische Testprofil stellt keinen echten Trainer vor.\n\n<script>window.__coachXss=true</script>",
  verifiedBackground: ["Technischer Testdatensatz"],
  qualifications: [],
  specialties: [],
  displayOrder: 10,
  active: true,
  visibility: "public",
  contentApproved: true,
  portrait: {
    alt: "Technische Testgrafik ohne echte Person",
    credit: "Test fixture",
    asset: {
      url: "https://cdn.sanity.io/images/cmsqa123/qa/abc-800x1000.webp",
      mimeType: "image/webp",
      size: 1024,
      metadata: { dimensions: { width: 800, height: 1000 } },
    },
  },
};

const album = {
  _id: "fixture-album",
  title: "Technisches Testalbum",
  slug: "cms-test-album",
  occurredOn: "2026-10-01",
  city: "Testort",
  description: "Technischer Testdatensatz ohne echte Camp-Inhalte.",
  visibility: "public",
  rightsConfirmed: true,
  media: [
    { _key: "fixture-photo", _type: "galleryPhoto", ...profile.portrait },
  ],
};
const socialPost = {
  _id: "fixture-social",
  _type: "socialPost",
  title: "Technischer Testbeitrag",
  summary: "<script>window.__socialXss=true</script>",
  platform: "instagram",
  sourceUrl: "https://www.instagram.com/p/fixture123/",
  sourceStatus: "available",
  displayOrder: 10,
  visibility: "public",
  contentApproved: true,
};

const mediaKitDownload = {
  _id: "fixture-download",
  _type: "mediaKitDownload",
  title: "Technischer Testdownload A",
  description: "<script>window.__downloadXss=true</script>",
  downloadName: "Academy-Test.png",
  displayOrder: 10,
  visibility: "public",
  contentApproved: true,
  file: {
    asset: {
      url: "https://cdn.sanity.io/files/cmsqa123/qa/abc.png",
      mimeType: "image/png",
      extension: "png",
      size: 1024,
    },
  },
  preview: profile.portrait,
};

globalThis.fetch = async (input, options) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  if (
    url.hostname === "cdn.sanity.io" &&
    url.pathname.startsWith("/files/cmsqa123/qa/") &&
    options?.method === "HEAD"
  ) {
    appendFileSync(
      process.env.PK_CMS_QA_TRACE,
      JSON.stringify({
        type: "media-kit-file",
        hasAuthorization: new Headers(options.headers).has("Authorization"),
      }) + "\n",
    );
    return new Response(null, {
      status: url.pathname.endsWith("missing.png") ? 404 : 200,
    });
  }
  if (url.hostname !== "cmsqa123.api.sanity.io")
    return originalFetch(input, options);
  const trainers = url.searchParams
    .get("query")
    ?.includes('_type == "trainer"');
  const social = url.searchParams
    .get("query")
    ?.includes('_type == "socialPost"');
  const mediaKit = url.searchParams
    .get("query")
    ?.includes('_type == "mediaKitDownload"');
  appendFileSync(
    process.env.PK_CMS_QA_TRACE,
    JSON.stringify({
      type: trainers
        ? "trainers"
        : social
          ? "social"
          : mediaKit
            ? "media-kit"
            : "gallery",
      perspective: url.searchParams.get("perspective"),
      authenticated:
        options?.headers?.Authorization === "Bearer test-token-never-real",
      hasAuthorization: new Headers(options?.headers).has("Authorization"),
    }) + "\n",
  );
  const mode = process.env.PK_CMS_QA_MODE;
  if (mediaKit) {
    const result =
      mode === "empty"
        ? []
        : [
            {
              ...mediaKitDownload,
              ...(mode === "malformed-media-kit" ? { title: " " } : {}),
              ...(mode === "public"
                ? {
                    description: "Geänderter technischer Downloadtext",
                    displayOrder: 30,
                    downloadName: "Academy-Test-Edited.png",
                    file: {
                      asset: {
                        ...mediaKitDownload.file.asset,
                        url: "https://cdn.sanity.io/files/cmsqa123/qa/def.png",
                      },
                    },
                  }
                : {}),
            },
            {
              ...mediaKitDownload,
              _id: "fixture-pdf",
              title: "Technischer Testdownload B",
              downloadName: "Academy-Test.pdf",
              displayOrder: 20,
              preview: undefined,
              usageGuidance: "Technischer Nutzungshinweis für isolierte Tests.",
              file: {
                asset: {
                  url: "https://cdn.sanity.io/files/cmsqa123/qa/abc.pdf",
                  mimeType: "application/pdf",
                  extension: "pdf",
                  size: 2048,
                },
              },
            },
            {
              ...mediaKitDownload,
              _id: "drafts.download",
              title: "DRAFT_DO_NOT_EXPOSE",
            },
            {
              ...mediaKitDownload,
              _id: "versions.release.download",
              title: "RELEASE_DO_NOT_EXPOSE",
            },
            {
              ...mediaKitDownload,
              _id: "hidden-download",
              visibility: "hidden",
              title: "HIDDEN_DO_NOT_EXPOSE",
            },
            {
              ...mediaKitDownload,
              _id: "unapproved-download",
              contentApproved: false,
              title: "UNAPPROVED_DO_NOT_EXPOSE",
            },
            {
              ...mediaKitDownload,
              _id: "unresolved-download",
              title: "MISSING_DOWNLOAD_DO_NOT_EXPOSE",
              file: { asset: null },
            },
            {
              ...mediaKitDownload,
              _id: "missing-download",
              title: "MISSING_DOWNLOAD_DO_NOT_EXPOSE",
              file: {
                asset: {
                  ...mediaKitDownload.file.asset,
                  url: "https://cdn.sanity.io/files/cmsqa123/qa/missing.png",
                },
              },
            },
          ];
    return Response.json({ result });
  }
  const result = social
    ? mode === "empty"
      ? []
      : [
          socialPost,
          { ...socialPost, _id: "drafts.social", title: "DRAFT_DO_NOT_EXPOSE" },
          {
            ...socialPost,
            _id: "social-hidden",
            title: "HIDDEN_DO_NOT_EXPOSE",
            visibility: "hidden",
          },
          {
            ...socialPost,
            _id: "social-unavailable",
            title: "Technischer Ersatzlink",
            summary: "OLD_SOCIAL_COPY_DO_NOT_EXPOSE",
            sourceUrl: "https://www.instagram.com/p/fixture456/",
            fallbackUrl: "https://www.instagram.com/fixtureacademy/",
            sourceStatus: "unavailable",
            displayOrder: 20,
          },
        ]
    : !trainers
      ? mode === "public" || mode === "malformed-gallery"
        ? [
            {
              ...album,
              ...(mode === "malformed-gallery"
                ? { media: [{ ...album.media[0], credit: "   " }] }
                : {}),
            },
            {
              ...album,
              _id: "drafts.fixture-album",
              title: "DRAFT_DO_NOT_EXPOSE",
            },
          ]
        : []
      : mode === "empty"
        ? []
        : [
            { ...profile, _id: "drafts.hidden", name: "DRAFT_DO_NOT_EXPOSE" },
            {
              ...profile,
              _id: "versions.release.hidden",
              name: "RELEASE_DO_NOT_EXPOSE",
            },
            {
              ...profile,
              _id: "hidden",
              name: "HIDDEN_DO_NOT_EXPOSE",
              visibility: "hidden",
            },
            {
              ...profile,
              _id: "inactive",
              name: "INACTIVE_DO_NOT_EXPOSE",
              active: false,
            },
            {
              ...profile,
              _id: "unapproved",
              name: "UNAPPROVED_DO_NOT_EXPOSE",
              contentApproved: false,
            },
            {
              ...profile,
              ...(mode === "malformed" ? { biography: "" } : {}),
              ...(mode === "public"
                ? {
                    role: "Geänderte Testrolle",
                    displayOrder: 30,
                    portrait: {
                      ...profile.portrait,
                      asset: {
                        ...profile.portrait.asset,
                        url: "https://cdn.sanity.io/images/cmsqa123/qa/def-800x1000.webp",
                      },
                    },
                  }
                : {}),
            },
            {
              ...profile,
              _id: "fixture-second",
              name: "Technisches Testprofil B",
              portrait: undefined,
              displayOrder: 20,
            },
          ];
  return new Response(JSON.stringify({ result }), {
    headers: { "content-type": "application/json" },
  });
};
