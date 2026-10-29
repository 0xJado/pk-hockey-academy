// One-time migration of the already published original logo. Never overwrite editor changes.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { getStudioConfig } from "../config.ts";
import { validateDownloadAsset } from "../../shared/media-kit.ts";

try {
  const config = getStudioConfig();
  const require = createRequire(import.meta.url);
  const { getProjectCliClient } = await import(
    pathToFileURL(require.resolve("@sanity/cli-core")).href
  );
  const client = (
    await getProjectCliClient({
      ...config,
      apiVersion: "2026-10-01",
      requireUser: true,
    })
  ).withConfig({ ...config, perspective: "raw", useCdn: false });
  const id = "media-kit-academy-logo";
  const existing = await client.fetch("*[_id in $ids]{_id}", {
    ids: [id, `drafts.${id}`],
  });
  if (existing.length)
    console.log(
      JSON.stringify({
        result: "already-exists-no-changes",
        documentIds: existing.map((doc) => doc._id),
      }),
    );
  else {
    const bytes = await readFile(
      new URL(
        "../../web/src/assets/brand/pk-hockey-crest.png",
        import.meta.url,
      ),
    );
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (
      digest !==
      "913ef27652da16d9940f8872a675174c4f99911ecf8348e074ad225a66fdec53"
    )
      throw new Error("Original logo differs from the recorded approved file.");
    if (!process.argv.includes("--apply"))
      console.log(
        JSON.stringify({
          result: "ready-to-stage-approved-logo",
          projectId: config.projectId,
          dataset: config.dataset,
          bytes: bytes.length,
          sha256: digest,
        }),
      );
    else {
      const options = { contentType: "image/png", preserveFilename: false };
      const file = await client.assets.upload("file", bytes, options);
      const image = await client.assets.upload("image", bytes, options);
      const downloadName = "PK-Hockey-Academy-Logo.png";
      if (validateDownloadAsset(file, downloadName) !== true)
        throw new Error("Uploaded file metadata differs.");
      const draft = await client.createIfNotExists({
        _id: `drafts.${id}`,
        _type: "mediaKitDownload",
        title: "PK Hockey Academy Logo",
        description:
          "Das Academy-Wappen als Originaldatei mit transparentem Hintergrund.",
        downloadName,
        displayOrder: 10,
        visibility: "public",
        contentApproved: true,
        file: { _type: "file", asset: { _type: "reference", _ref: file._id } },
        preview: {
          _type: "image",
          asset: { _type: "reference", _ref: image._id },
          alt: "Wappen der PK Hockey Academy",
          credit: "Bereitgestellt von PK Hockey Academy",
        },
      });
      console.log(
        JSON.stringify({
          result: "draft-staged-publish-in-studio",
          documentId: draft._id,
          bytes: file.size,
          sha256: digest,
        }),
      );
    }
  }
} catch {
  console.error(
    "Logo migration did not complete. Check the original asset, existing documents and native CLI authentication. No credential was printed.",
  );
  process.exitCode = 1;
}
