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

globalThis.fetch = async (input, options) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  if (url.hostname !== "cmsqa123.api.sanity.io")
    return originalFetch(input, options);
  const trainers = url.searchParams
    .get("query")
    ?.includes('_type == "trainer"');
  appendFileSync(
    process.env.PK_CMS_QA_TRACE,
    JSON.stringify({
      type: trainers ? "trainers" : "gallery",
      perspective: url.searchParams.get("perspective"),
      authenticated:
        options?.headers?.Authorization === "Bearer test-token-never-real",
    }) + "\n",
  );
  const mode = process.env.PK_CMS_QA_MODE;
  const result =
    !trainers || mode === "empty"
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
          { ...profile, ...(mode === "malformed" ? { biography: "" } : {}) },
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
