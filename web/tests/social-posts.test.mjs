import test from "node:test";
import assert from "node:assert/strict";
import { parseSocialPost, socialSourceUrl, validateSocialPublication } from "../../shared/social-post.ts";
import { fetchSocialPosts, getSocialConfig, parseSocialPosts } from "../src/lib/social-posts.ts";
const post = { _id: "fixture", _type: "socialPost", title: "Technischer Testbeitrag", summary: "Keine reale Rückmeldung.", platform: "instagram", sourceUrl: "https://www.instagram.com/p/fixture123/", sourceStatus: "available", displayOrder: 10, visibility: "public", contentApproved: true };

test("only supported direct platform links survive; redirects, wrong platforms and embedded credentials fail", () => {
  assert.equal(socialSourceUrl("https://instagram.com/p/fixture123/?igsh=tracking#caption", "instagram"), post.sourceUrl);
  assert.ok(socialSourceUrl("https://www.facebook.com/fixtureacademy/posts/pfbid123", "facebook"));
  for (const url of ["javascript:alert(1)", "https://instagram.com.evil.test/p/fixture123", "https://user:pass@instagram.com/p/fixture123", "https://www.instagram.com/accounts/login/", "https://www.instagram.com/p/%2ffixture123", "https://www.facebook.com/l.php?u=https://evil.test", "https://www.facebook.com/fixtureacademy/posts/pfbid123"])
    assert.equal(socialSourceUrl(url, "instagram"), undefined);
});

test("publication requires confirmed content and unavailable sources need a valid profile fallback", () => {
  assert.equal(validateSocialPublication(post), true);
  assert.notEqual(validateSocialPublication({ ...post, contentApproved: false }), true);
  assert.equal(parseSocialPost({ ...post, title: "  " }), undefined);
  assert.equal(parseSocialPost({ ...post, sourceStatus: "unavailable" }), undefined);
  assert.ok(parseSocialPost({ ...post, sourceStatus: "unavailable", fallbackUrl: "https://www.instagram.com/fixtureacademy/" }));
  assert.equal(parseSocialPost({ ...post, fallbackUrl: "https://www.instagram.com/accounts/login/" }), undefined);
});

test("query-independent filtering, ordering, duplicate rejection and withdrawal retain no stale fallback", () => {
  const hidden = ["drafts.fixture", "versions.release.fixture"].map(_id => ({ ...post, _id }));
  const second = { ...post, _id: "second", sourceUrl: "https://www.instagram.com/reel/fixture456/", displayOrder: 1 };
  assert.deepEqual(parseSocialPosts([...hidden, { ...post, visibility: "hidden" }, { ...post, contentApproved: false }, post, second]).map(p=>p.id), ["second", "fixture"]);
  assert.deepEqual(parseSocialPosts([{ ...post, visibility: "hidden" }]), []);
  assert.throws(() => parseSocialPosts([post, post]));
  assert.throws(() => parseSocialPosts([{ ...post, sourceUrl: "https://evil.test" }]));
  assert.throws(() => parseSocialPosts({ result: [] }));
});

test("social activation is opt-in and its public build transport omits authorization and fails on CMS errors", async () => {
  assert.equal(getSocialConfig({}), undefined);
  assert.throws(() => getSocialConfig({ SANITY_SOCIAL_ENABLED: "yes" }));
  assert.throws(() => getSocialConfig({ SANITY_SOCIAL_ENABLED: "true" }));
  const config = getSocialConfig({ SANITY_SOCIAL_ENABLED: "true", SANITY_PROJECT_ID: "cmsqa123", SANITY_DATASET: "qa" });
  const posts = await fetchSocialPosts(config, async (input, options) => {
    assert.equal(new URL(input).searchParams.get("perspective"), "published");
    assert.equal(new Headers(options.headers).has("Authorization"), false);
    assert.equal(options.redirect, "error");
    return new Response(JSON.stringify({ result: [post] }));
  });
  assert.equal(posts.length, 1);
  await assert.rejects(fetchSocialPosts(config, async () => new Response("", { status: 503 })));
});
