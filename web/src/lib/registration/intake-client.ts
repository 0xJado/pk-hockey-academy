/** PHP intake transport candidate. Not imported by the public, disabled form.
 * Keep the retry token and exact serialized request only in this page's memory.
 * The server remains authoritative for validation, consent and availability.
 */
export type IntakeResult =
  | { state: "received"; reference: string }
  | { state: "invalid"; fields: string[] }
  | { state: "unavailable" }
  | { state: "uncertain" }
  | { state: "review-required" }
  | { state: "busy" };

type Transport = (path: string, options: RequestInit) => Promise<Response>;

export function createIntakeClient(transport: Transport = fetch, timeoutMs = 15000) {
  let busy = false;
  let ticket: string | undefined;
  let pending: string | undefined;
  let receipt: string | undefined;
  let reviewRequired = false;

  async function post(path: string, body: string, token?: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Also bound non-cooperating transports and response-body reads. A browser
      // abort is not proof that the server rolled back a submitted request.
      return await Promise.race([
        (async () => {
          const response = await transport(path, {
            method: "POST", credentials: "same-origin", cache: "no-store",
            redirect: "error", referrerPolicy: "no-referrer",
            headers: { "Content-Type": "application/json", ...(token ? { "Idempotency-Key": token } : {}) },
            body, signal: controller.signal,
          });
          const json: unknown = await response.json();
          return { response, json };
        })(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true });
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    /** After an ambiguous response only retry() may resend the frozen body.
     * No automatic retry, token replacement, storage, URL parameters or logging.
     */
    async submit(input: Readonly<Record<string, unknown>>): Promise<IntakeResult> {
      if (busy) return { state: "busy" };
      if (receipt) return { state: "received", reference: receipt };
      if (reviewRequired || pending !== undefined) return { state: "review-required" };
      let body: string;
      try { body = JSON.stringify(input); } catch { return { state: "invalid", fields: [] }; }
      return send(body);
    },
    async retry(): Promise<IntakeResult> {
      if (busy) return { state: "busy" };
      if (receipt) return { state: "received", reference: receipt };
      if (reviewRequired || pending === undefined) return { state: "review-required" };
      return send(pending);
    },
  };

  async function send(body: string): Promise<IntakeResult> {
    busy = true;
    try {
      if (!ticket) {
        try {
          const { response, json } = await post("/api/registration/token", "{}");
          if (response.status !== 200 || !isObject(json) || json.code !== "request-token"
            || typeof json.token !== "string"
            || !/^\d{10}\.\d{10}\.[a-f0-9]{64}\.[a-f0-9]{64}\.[a-f0-9]{64}$/.test(json.token)) {
            return { state: "unavailable" };
          }
          ticket = json.token;
        } catch { return { state: "unavailable" }; }
      }
      pending = body;
      try {
        const { response, json } = await post("/api/registration", body, ticket);
        if (isObject(json)) {
          if ([200, 201].includes(response.status) && json.code === "received"
            && typeof json.reference === "string" && /^[a-f0-9]{64}$/.test(json.reference)) {
            receipt = json.reference;
            pending = undefined;
            ticket = undefined;
            return { state: "received", reference: receipt };
          }
          if (response.status === 422) {
            pending = undefined; // PHP validation rejects before the atomic write.
            return { state: "invalid", fields: isObject(json.errors) ? Object.keys(json.errors) : [] };
          }
          if (response.status === 409) {
            // Expiry, restore epochs, conflict and reconciliation all need human
            // review. Never mint another token after a possibly committed write.
            reviewRequired = true;
            return { state: "review-required" };
          }
        }
        return { state: "uncertain" };
      } catch { return { state: "uncertain" }; }
    } finally { busy = false; }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
