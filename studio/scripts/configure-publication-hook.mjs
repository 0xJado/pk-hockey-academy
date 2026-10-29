// Run through npm run webhook:setup. Native Sanity CLI authentication supplies access.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { publicationWebhook } from "../../shared/cms-publication.ts";
import { getStudioConfig } from "../config.ts";

try {
  const fileIndex = process.argv.indexOf("--url-file");
  if (fileIndex < 0 || !process.argv[fileIndex + 1])
    throw new Error(
      "Supply --url-file with a private local file containing the deploy-hook URL.",
    );
  const destination = (
    await readFile(process.argv[fileIndex + 1], "utf8")
  ).trim();
  const { projectId, dataset } = getStudioConfig();
  const payload = publicationWebhook(dataset, destination);
  const require = createRequire(import.meta.url);
  const { getProjectCliClient } = await import(
    pathToFileURL(require.resolve("@sanity/cli-core")).href
  );
  const client = await getProjectCliClient({
    apiVersion: "2025-02-19",
    projectId,
    requireUser: true,
  });
  const hooks = await client.request({ url: `/hooks/projects/${projectId}` });
  const existing = hooks.filter(
    (hook) => hook.name === payload.name && !hook.deletedAt,
  );
  if (existing.length > 1)
    throw new Error(
      "Multiple matching hooks; inspect the project before changing anything.",
    );
  if (existing.length === 1) {
    const hook = existing[0];
    for (const key of [
      "type",
      "dataset",
      "url",
      "apiVersion",
      "httpMethod",
      "includeDrafts",
      "includeAllVersions",
    ])
      if (!isDeepStrictEqual(hook[key], payload[key]))
        throw new Error(
          "An existing hook differs. Inspect it; this command never overwrites other configurations.",
        );
    if (hook.isDisabled || hook.isDisabledByUser)
      throw new Error("The existing publication hook is disabled.");
    if (!isDeepStrictEqual(hook.rule, payload.rule)) {
      // Only an explicit filter update is supported. Keep destination, event types,
      // payload projection, access and all other existing settings unchanged.
      if (
        !process.argv.includes("--update-existing") ||
        !isDeepStrictEqual(hook.rule.on, payload.rule.on) ||
        !isDeepStrictEqual(hook.rule.projection, payload.rule.projection)
      )
        throw new Error(
          "Existing rules differ; explicit filter-update authorization is required.",
        );
      if (!process.argv.includes("--apply")) {
        console.log(
          JSON.stringify({
            result: "ready-to-update-filter",
            projectId,
            dataset,
            hookId: hook.id,
            previousFilter: hook.rule.filter,
            filter: payload.rule.filter,
          }),
        );
      } else {
        await client.request({
          method: "PATCH",
          url: `/hooks/projects/${projectId}/${hook.id}`,
          body: { rule: payload.rule, description: payload.description },
        });
        const updated = await client.request({
          url: `/hooks/projects/${projectId}/${hook.id}`,
        });
        for (const key of [
          "url",
          "dataset",
          "includeDrafts",
          "includeAllVersions",
          "httpMethod",
          "apiVersion",
        ])
          if (!isDeepStrictEqual(updated[key], hook[key]))
            throw new Error("Unexpected publication-hook setting changed.");
        if (!isDeepStrictEqual(updated.rule, payload.rule))
          throw new Error("Updated filter did not match.");
        console.log(
          JSON.stringify({
            result: "filter-updated-and-verified",
            projectId,
            dataset,
            hookId: hook.id,
          }),
        );
      }
    } else
      console.log(
        JSON.stringify({
          result: "already-configured",
          projectId,
          dataset,
          hookId: hook.id,
        }),
      );
  } else if (!process.argv.includes("--apply")) {
    console.log(
      JSON.stringify({
        result: "ready-to-create",
        projectId,
        dataset,
        name: payload.name,
        includeDrafts: false,
        includeAllVersions: false,
        rule: payload.rule,
      }),
    );
  } else {
    const hook = await client.request({
      method: "POST",
      url: `/hooks/projects/${projectId}`,
      body: payload,
    });
    console.log(
      JSON.stringify({
        result: "created",
        projectId,
        dataset,
        hookId: hook.id,
      }),
    );
  }
} catch {
  // Request errors can contain the request body, including the private destination.
  console.error(
    "Publication hook setup did not complete. Check CLI authentication, the private URL file and existing hooks. No secret was printed.",
  );
  process.exitCode = 1;
}
