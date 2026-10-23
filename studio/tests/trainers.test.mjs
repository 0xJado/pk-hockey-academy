import test from "node:test";
import assert from "node:assert/strict";
import {
  parseTrainerFields,
  validateTrainerPublication,
} from "../../shared/trainer-profile.ts";
import { previewPortraitUrl } from "../lib/trainer-preview.ts";

const profile = {
  name: "Technisches Testprofil",
  role: "Testrolle",
  biography: "Dieses Profil dient nur der technischen Validierung.",
  verifiedBackground: ["Testangabe"],
  displayOrder: 0,
  visibility: "public",
  contentApproved: true,
};
test("Studio and website use the same strict profile/approval validation", () => {
  assert.equal(validateTrainerPublication(profile), true);
  assert.deepEqual(parseTrainerFields(profile).qualifications, []);
  assert.equal(parseTrainerFields({ ...profile, name: "  " }), undefined);
  assert.equal(
    parseTrainerFields({ ...profile, displayOrder: 0.1 }),
    undefined,
  );
  assert.notEqual(
    validateTrainerPublication({ ...profile, contentApproved: false }),
    true,
  );
  assert.notEqual(
    validateTrainerPublication({ ...profile, verifiedBackground: [" "] }),
    true,
  );
});
test("private preview only derives raster assets from its own project and dataset", () => {
  const ref = (asset) => ({ asset: { _ref: asset } });
  assert.equal(
    previewPortraitUrl(ref("image-abc-800x1000-webp"), "cmsqa123", "qa"),
    "https://cdn.sanity.io/images/cmsqa123/qa/abc-800x1000.webp?w=700&auto=format&fit=max",
  );
  for (const input of [
    "https://evil.invalid/a.jpg",
    "image-abc-0x100-jpg",
    "image-abc-100x0-jpg",
    "image-abc-90000x100-jpg",
    "image-abc-100x100-svg",
    "image-abc-100x100-jpg?token=1",
  ])
    assert.equal(previewPortraitUrl(ref(input), "cmsqa123", "qa"), undefined);
  assert.equal(
    previewPortraitUrl(ref("image-abc-100x100-jpg"), "bad/host", "qa"),
    undefined,
  );
});
