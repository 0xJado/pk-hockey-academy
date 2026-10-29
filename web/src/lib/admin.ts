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

// Sanity's overlay edit URLs require a base without a trailing slash, even
// though the ordinary Studio navigation link accepts one.
export function getStudioEditBaseUrl(
  value: string | undefined,
): string | undefined {
  return getStudioUrl({ PUBLIC_SANITY_STUDIO_URL: value })?.replace(/\/+$/, "");
}
