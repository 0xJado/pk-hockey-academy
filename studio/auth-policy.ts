export type StudioAuthProvider = "google" | "github" | "sanity";

export function getStudioAuthProvider(
  env: Record<string, string | undefined>,
): StudioAuthProvider | undefined {
  const value = env.SANITY_STUDIO_AUTH_PROVIDER?.trim();
  if (!value) return;
  if (value !== "google" && value !== "github" && value !== "sanity") {
    throw new Error(
      "SANITY_STUDIO_AUTH_PROVIDER must be google, github or sanity, or blank for the native defaults.",
    );
  }
  return value;
}

// Restrict only native supported providers. This changes login choices, not dataset grants or MFA.
export function selectAuthProviders<T extends { name: string }>(
  providers: T[],
  allowed: StudioAuthProvider | undefined,
): T[] {
  if (!allowed) return providers;
  const selected = providers.filter((provider) => provider.name === allowed);
  if (!selected.length)
    throw new Error(
      "The configured Studio sign-in provider is not available. Check the project authentication configuration.",
    );
  return selected;
}
