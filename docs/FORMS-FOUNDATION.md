# Registration foundation

This increment adds processing infrastructure and fictional local previews, not live registration or contact delivery. No Google Sheet, messaging account, email service, database or CMS record is connected.

## Registration boundary

`/api/registration` always returns HTTP 503 with a German inactive message, `Cache-Control: no-store` and no body parsing. This is unconditional, not an environment switch. `/anmeldung` and its original PDF remain unchanged and disabled for data entry.

The server-only `createRegistrationProcessor` factory is exercised in Node with Request objects and fake destinations. Its policy is injected: the repository does not approve final registration fields, requiredness, signatures, guardian details or consent rules. The tests use a fictional `testValue` field unrelated to the actual PDF.

The core checks POST, an explicitly configured Origin, absence of URL query data, trusted server-supplied request identity, JSON content type and a bounded idempotency key. It limits streamed UTF-8 bytes (16 KiB by default) and body reading time (3 seconds), independently of Content-Length. Malformed JSON, unknown fields, non-string values, control characters, excessive lengths and invalid approved rules fail before delivery. Request-limit and ledger operations also have a bounded deadline (2 seconds by default); a timed-out state operation may require later reconciliation and is never treated as permission to resend. Required fields cannot be whitespace. Custom validation is run only after basic limits pass.

Source identities, idempotency keys and canonical normalized payload fingerprints are HMAC digests in the test controls. Raw submitted values are neither logged nor stored in those controls. Successful replies contain no submitted fields and never claim a training booking is confirmed.

## Delivery and duplicate contract

The injectable destination returns `accepted`, `rejected` or `unknown` and receives an immutable validated field map, an opaque idempotency token and an abort signal. Acceptance means destination acknowledgement, not a confirmed training place.

An atomic ledger claim prevents concurrent same-key delivery. Replaying an acknowledged key returns the existing success without resending; reusing it with a changed normalized payload returns 409. A known rejection permits retry. Exceptions, timeouts or uncertain destination outcomes remain unresolved and do not automatically resend. They require later reconciliation. The destination must honour idempotency too; aborting a request does not prove an external write did not occur.

Bounded in-memory adapters exist exclusively for tests: at most 1000 source/state entries, five requests per source per minute, and a ten-minute idempotency window. They are process-local, expire and reset on restart. They do not provide distributed rate limits or durable exactly-once delivery on serverless hosting. Before activation, provide shared atomic storage, a trustworthy platform request-identity strategy, a durable destination/reconciliation contract and approved retention/deletion. Do not activate the memory adapters in production. This increment deliberately provisions no storage infrastructure.

## Browser coverage

The maintained `test:browser` suite now exercises both complete interviews at phone width. It checks required trainer-name handling, fixed follow-ups, skipping, back navigation, corrections through both review and question screens, real JSON downloads, literal-text safety, print invocation, print visibility, generated A4 PDFs, reset/cancel and navigation clearing. Mock speech captures callbacks before disposal and fires them late; exports must not contain the stale transcript. No actual microphone, speech provider or real personal answers are used.

Interview tests assert there are no application POSTs or external page requests. These simulations do not prove real delivery, voice-device support, legal adequacy, full screen-reader compatibility or final booking behavior.

Run `npm test --prefix web` for processing cases, then `npm run test:cms --prefix web` and `npm run test:browser --prefix web` for compiled UI flows. The CMS suite includes a launch-mode build proving interview test inputs and sitemap entries stay absent. CI runs these commands through the existing workflow. Fictional screenshots, JSON exports and print PDFs are retained only as ignored diagnostics under `output/playwright/`.
