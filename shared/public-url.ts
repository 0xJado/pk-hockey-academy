// Configuration for public-facing links, never a fetch/SSRF authorization function.
export function publicHttpsUrl(
  value: string | undefined,
  setting: string,
): string | undefined {
  if (!value?.trim()) return;
  const fail = () => {
    throw new Error(
      `${setting} must be a real public HTTPS URL without credentials, query parameters or fragments.`,
    );
  };
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return fail();
  }
  const hostname = url.hostname.toLowerCase();
  const labels = hostname.split(".");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.port ||
    labels.length < 2 ||
    labels.every((label) => /^\d+$/.test(label)) ||
    labels.some(
      (label) =>
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label) || label.length > 63,
    ) ||
    [
      "localhost",
      "local",
      "invalid",
      "example",
      "test",
      "internal",
      "home",
      "lan",
    ].includes(labels.at(-1)!) ||
    ["example.com", "example.org", "example.net"].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  )
    return fail();
  return url.href;
}
