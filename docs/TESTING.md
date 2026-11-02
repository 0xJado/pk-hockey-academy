# Reproducible quality checks

Use the Node version in `.node-version`. Both npm lockfiles are committed. The website pins Playwright 1.64.1; tests import that package directly and never use `.tools`, a global browser package or an automatically installed dependency.

## Fresh checkout

From the repository root:

```sh
npm ci --prefix web
npm ci --prefix studio
npm run browser:install --prefix web
npm run check --prefix web
npm test --prefix web
npm run check --prefix studio
npm test --prefix studio
npm run test:cms --prefix web
npm run test:browser:guards --prefix web
npm run test:browser --prefix web
npm run test:browser:training --prefix web
```

For a local Studio build, use a real local configuration or the public test identifiers `SANITY_STUDIO_PROJECT_ID=cmsqa123` and `SANITY_STUDIO_DATASET=qa`. This builds a Studio bundle; it does not deploy it or connect an account. CI explicitly clears the preview, application ID and login-provider settings and uses those test identifiers.

On Linux, `npm run browser:install:ci --prefix web` installs Chromium plus its OS dependencies. The normal installer only installs the browser. Playwright requires the browser binary matching its pinned package. The default is Chromium on every OS. To explicitly use an already installed Edge locally, set `PK_BROWSER_CHANNEL=msedge`; Chrome is also supported. No browser fallback is silently selected.

## Compiled fixtures and safeguards

`test:cms` clears the completion marker before building, captures each build log, and writes `output/cms-integration-manifest.json` only as complete after every scenario passes. Browser scripts resolve their starter and populated-training roots from this manifest, independent of the caller's directory. They reject an incomplete run. `PK_BROWSER_ROOT` can explicitly select another compiled client directory for debugging.

Eight isolated scenarios cover starter, populated authenticated, populated tokenless, empty, and malformed trainer/gallery/media-kit/session rejection. Fixture CMS requests never contact a genuine account; unexpected external fixture requests fail. Blank project/dataset/read-token settings disable live sources in the starter build. The Vercel adapter is exercised for static public output; private authenticated editing is separate acceptance.

Browser checks cover 17 routes at desktop/tablet/phone widths and six populated training combinations. They check headings, landmarks, names, layout, images, keyboard access, reduced motion, history, animation lifecycle, no-JavaScript navigation and public script size. External requests fail the normal browser suite. They do not establish full WCAG conformance, real-device performance or real speech/delivery behavior.

`test:browser:guards` copies the compiled starter into disposable ignored folders and introduces overflow and a broken schedule CTA. It requires the actual browser suite to reject each copy for the expected reason. Application source is never mutated. Malformed approved sessions must also reject the actual compiled build. Run the valid browser suites afterward.

## CI and diagnostics

`.github/workflows/quality.yml` runs on pushes to main, pull requests targeting main, and manual dispatch. It uses Ubuntu 24.04, the pinned Node version, full-commit action pins, read-only repository permissions and no persisted checkout credentials. No academy secrets are supplied. It installs locked dependencies, runs both projects' checks/tests, builds Studio, verifies all CMS scenarios and runs browser failure guards plus both valid suites.

GitHub retains `output/playwright/` and `output/cms-build-logs/` for seven days, including screenshots, JSON outcomes, per-build logs and failure traces. It does not upload `.env`, browser authentication state, CMS records or entire build folders. Failures stay nonzero; mutation failures count as success only when the expected defect is detected.

CI reports quality checks. Existing Vercel Git deployments remain independent; this workflow neither deploys nor changes branch-protection or Vercel deployment-check settings. Requiring a green check before merging or promotion is a separate repository/platform setting.

References: [Playwright CI](https://playwright.dev/docs/ci-intro), [matching browser installation](https://playwright.dev/docs/browsers), [GitHub secure workflow guidance](https://docs.github.com/en/actions/reference/security/secure-use).
