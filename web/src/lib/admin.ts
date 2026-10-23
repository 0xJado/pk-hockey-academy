import { publicHttpsUrl } from "../../../shared/public-url.ts";

// A Studio link never grants access. Authentication and grants belong to Sanity.
export function getStudioUrl(
  env: Record<string, string | undefined>,
): string | undefined {
  return publicHttpsUrl(
    env.PUBLIC_SANITY_STUDIO_URL,
    "PUBLIC_SANITY_STUDIO_URL",
  );
}
