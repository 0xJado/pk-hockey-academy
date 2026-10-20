import test from "node:test";
import assert from "node:assert/strict";
import { validateAsset } from "../schemaTypes/validation.ts";

test("Studio assets require supported types, completed uploads and bounded sizes", () => {
  assert.equal(validateAsset("image", { mimeType: "image/webp", size: 1024 }), true);
  assert.equal(validateAsset("video", { mimeType: "video/mp4", size: 2048 }), true);
  assert.notEqual(validateAsset("image", { mimeType: "image/svg+xml", size: 10 }), true);
  assert.notEqual(validateAsset("image", { mimeType: "image/jpeg", size: 13 * 1024 * 1024 }), true);
  assert.notEqual(validateAsset("video", { mimeType: "video/mp4", size: 101 * 1024 * 1024 }), true);
  assert.notEqual(validateAsset("video", null), true);
});
