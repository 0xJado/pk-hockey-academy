# Curated social posts — partial issue #5

The owner confirmed on 25 October 2026 that no academy social accounts or approved posts exist yet. No accounts, example endorsements or real posts have been fabricated. `SANITY_SOCIAL_ENABLED=false` keeps the website's existing empty notice.

## Implemented

- The `socialPost` schema provides a title, optional plain-text introduction, Instagram/Facebook source permalink, optional same-platform academy-profile fallback, manual availability status, ordering, content confirmation and website visibility.
- The same strict validator runs in native Studio publication and the website's untrusted-data boundary. Required content, valid direct links, supported platform/host, ordering and public approval are enforced. Credentials, redirects, foreign hosts and malformed links fail validation. Tracking parameters are removed from source links.
- The server adapter reads only published, approved records. Independent checks exclude drafts/releases/withheld records, reject invalid or duplicate approved posts, sort deterministically and show at most six cards. The feature is opt-in; configured failures stop a build instead of silently replacing existing content.
- The branded responsive gallery sidebar renders static, escaped cards with ordinary source links. It performs no requests to Meta, injects no platform scripts, embeds no frames and adds no cookies or visitor JavaScript. This initial presentation requires no embed-consent control because it contains no embeds; actual external navigation is initiated by the visitor's link click.
- If an editor marks a post unavailable/private/deleted, its old introduction is omitted and a general notice links to the supplied academy-profile fallback. Editors can also withdraw a card. Availability is **manual**, not live platform synchronization or automatic deletion detection.
- The shared publication webhook configuration includes social-post changes and withdrawals once the one-time publishing connection is approved and completed.

## Still required

Real academy account/profile links, explicitly approved source posts and their wording, a deployed/accepted curation workflow, and checks against actual unavailable/private/deleted posts are pending. No upload rights or endorsements are inferred from a URL. There are no media uploads in this card implementation.

Full embedded posts remain a separate unfinished part of #5. Before enabling them, confirm the relevant official platform requirements, account/app permissions, approved privacy/consent behavior and blocked/unavailable fallback behavior with real examples. The official [Facebook embedded-post](https://developers.facebook.com/docs/plugins/embedded-posts/) and [Instagram oEmbed](https://developers.facebook.com/docs/instagram-platform/oembed/) pages returned HTTP 429 during this increment; no current embed-permission claim is made. No scraping, proxy or unreviewed third-party embed service was introduced.

The Google Sheets registration connection and future Shopify shop are unrelated and remain inactive. Issue #5 must remain open until its remaining acceptance criteria are verified.
