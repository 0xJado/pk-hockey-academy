# Current project status

This is the current entry point. Dated assessments and VALIDATION.md preserve historical evidence, not current task lists.

## Approved design checkpoint — 7 November 2026

The user approved the homepage/subpage redesign and coach profile extension for merging from `develop/strato-migration` into `main`, following the final skate-outline refinement. This is a design and CMS-schema checkpoint, not completion of the STRATO migration or public launch. Hosted Studio deployment, approved coach career content and the remaining dependencies below still apply.

## Completed foundation

German responsive website, supplied branding, reusable motion, trainer CMS, hosted Visual Editing, Sanity-managed media kit, printable registration PDF and simple player/trainer questionnaires. Interview AI was cancelled. Trainer photography is optional under the approved logo presentation.

## Local increment — 2 November 2026

Registration now has a server-only, policy-injected processing foundation with fake-delivery tests; the public endpoint still rejects submissions without reading them. The contact page lists the academy email and a placeholder for WhatsApp. Full mobile player/trainer journeys now run in the maintained browser suite. See [forms foundation](FORMS-FOUNDATION.md) for contracts and activation limits.

Opt-in session/venue schemas and retrieval, shared validation, upcoming schedule handling, venue details and keyboard improvements. See [local acceptance](LOCAL-ACCEPTANCE.md) for checks and limits, and [training editing](TRAINING-CMS.md) for activation.

## Remaining dependencies

- Coach profiles implemented locally, 7 November 2026: dedicated `/trainerpool/{document-id}` pages, biography, optional years as player/trainer, highest division, selected playing teams and an eight-image player gallery. Homepage and trainer-list links now open the profile. The Studio's new Laufbahn fields are built locally; hosted Studio deployment and Pierre's approved career facts/photos remain pending. No career facts or gallery records were fabricated or published.
- Hosting decision, 6 November 2026: migrate production to Pierre's existing STRATO Hosting Basic package. Keep Astro static public pages and Sanity for public website content; use PHP and a private STRATO database for registrations. Google Sheets delivery is abandoned. The developer-owned Vercel site remains the protected review host until migration is implemented and verified. See [migration decision](STRATO-MIGRATION.md).
- Registration: private STRATO database, PHP processing and protected staff interface, approved fields/consents/signatures/retention, durable request state, production activation and booking process. No Google Sheet is needed.
- Schedule: real dates, halls, groups and capacity. New CMS source stays disabled pending live deployment and publishing acceptance.
- Contact: WhatsApp number.
- Launch: legal content, domain connection and explicit approval.
- Admin/gallery: account recovery/MFA/member lifecycle and approved real-media acceptance.
- Interviews: actual phone/voice/privacy acceptance; private delivery is separate. No AI work remains.
- Social: real accounts/posts and privacy/embed acceptance. Can follow launch.
- Shop: future scope, excluded from MVP.

[Pierre checklist](PIERRE-CHECKLIST.md) · [Publishing runbook](CMS-PUBLISHING.md)

The original local increment was committed in 7eb5d23, 307d3d9 and 05199eb. The protected website deployment for 05199eb reached READY before reproducible testing work began. Training CMS activation and live schema/hook changes remain pending.

The new [quality workflow and test guide](TESTING.md) covers clean installs, pinned tooling and isolated CI checks.
