// Server-only processing boundary. No approved policy, live destination or storage is configured.
import { createHmac } from "node:crypto";

export interface FieldRule {
  required: boolean;
  maxLength: number;
  minLength?: number;
  validate?: (value: string) => boolean;
}
export interface Delivery {
  deliver(
    fields: Readonly<Record<string, string>>,
    context: { idempotencyKey: string; signal: AbortSignal },
  ): Promise<"accepted" | "rejected" | "unknown">;
}
export type Claim = "new" | "pending" | "accepted" | "unknown" | "conflict";
export interface Ledger {
  claim(key: string, fingerprint: string): Promise<Claim>;
  settle(
    key: string,
    state: "accepted" | "unknown" | "retryable",
  ): Promise<void>;
}
export interface RequestLimiter {
  consume(source: string): Promise<boolean>;
}
export const jsonResponse = (
  status: number,
  body: unknown,
  extra: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });
export const inactiveRegistration = () =>
  jsonResponse(503, {
    code: "inactive",
    message:
      "Die Onlineanmeldung ist noch nicht freigegeben. Es wurden keine Angaben angenommen.",
  });

export function createRegistrationProcessor(options: {
  origin: string;
  fields: Readonly<Record<string, FieldRule>>;
  ledger: Ledger;
  limiter: RequestLimiter;
  delivery: Delivery;
  fingerprintSecret: string;
  maxBytes?: number;
  bodyTimeoutMs?: number;
  stateTimeoutMs?: number;
  deliveryTimeoutMs?: number;
}) {
  const { origin, fields, ledger, limiter, delivery, fingerprintSecret } =
    options;
  if (
    new URL(origin).origin !== origin ||
    fingerprintSecret.length < 32 ||
    !Object.keys(fields).length ||
    Object.keys(fields).length > 32
  )
    throw new Error(
      "Registration processing requires an explicit reviewed policy and secret.",
    );
  for (const [key, rule] of Object.entries(fields))
    if (
      !/^[a-z][a-zA-Z0-9]{0,63}$/.test(key) ||
      !Number.isSafeInteger(rule.maxLength) ||
      rule.maxLength < 1 ||
      rule.maxLength > 3000 ||
      typeof rule.required !== "boolean" ||
      (rule.minLength !== undefined &&
        (!Number.isSafeInteger(rule.minLength) ||
          rule.minLength < 0 ||
          rule.minLength > rule.maxLength))
    )
      throw new Error("Invalid registration field policy.");
  const bodyTimeout = options.bodyTimeoutMs ?? 3000;
  if (
    !Number.isSafeInteger(bodyTimeout) ||
    bodyTimeout < 1 ||
    bodyTimeout > 30000
  )
    throw new Error("Invalid body timeout.");
  const maxBytes = options.maxBytes ?? 16384,
    timeout = options.deliveryTimeoutMs ?? 5000;
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 65536 ||
    !Number.isSafeInteger(timeout) ||
    timeout < 1 ||
    timeout > 30000
  )
    throw new Error("Invalid processing limits.");
  const digest = (value: string) =>
    createHmac("sha256", fingerprintSecret).update(value).digest("hex");

  const stateTimeout = options.stateTimeoutMs ?? 2000;
  if (
    !Number.isSafeInteger(stateTimeout) ||
    stateTimeout < 1 ||
    stateTimeout > 30000
  )
    throw new Error("Invalid state timeout.");
  async function bounded<T>(task: () => Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        task(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("State timeout")),
            stateTimeout,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  // source must come from trusted server context, never a submitted header or field.
  return async (request: Request, source: string): Promise<Response> => {
    if (request.method !== "POST")
      return jsonResponse(405, { code: "method" }, { Allow: "POST" });
    if (request.headers.get("origin") !== origin)
      return jsonResponse(403, { code: "origin" });
    if (new URL(request.url).search)
      return jsonResponse(400, { code: "query" });
    if (typeof source !== "string" || !source || source.length > 256)
      return jsonResponse(503, { code: "source-unavailable" });
    try {
      if (!(await bounded(() => limiter.consume(digest(source)))))
        return jsonResponse(
          429,
          { code: "rate-limit" },
          { "Retry-After": "60" },
        );
    } catch {
      return jsonResponse(503, { code: "limits-unavailable" });
    }
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "application/json"
    )
      return jsonResponse(415, { code: "content-type" });
    const key = request.headers.get("idempotency-key");
    if (!key || !/^[A-Za-z0-9_-]{16,128}$/.test(key))
      return jsonResponse(400, { code: "idempotency-key" });
    const length = request.headers.get("content-length");
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes))
      return jsonResponse(413, { code: "body-limit" });
    let raw: unknown;
    if (request.bodyUsed || request.body?.locked)
      return jsonResponse(400, { code: "body" });
    const reader = request.body?.getReader();
    if (!reader) return jsonResponse(400, { code: "body" });
    const bodyExpired = new Error("body-timeout");
    let bodyTimer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      bodyTimer = setTimeout(() => {
        reject(bodyExpired);
        void reader.cancel().catch(() => {});
      }, bodyTimeout);
    });
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let text = "",
        size = 0;
      for (;;) {
        const { done, value } = await Promise.race([reader.read(), deadline]);
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          void reader.cancel().catch(() => {});
          return jsonResponse(413, { code: "body-limit" });
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      raw = JSON.parse(text);
    } catch (error) {
      return jsonResponse(error === bodyExpired ? 408 : 400, {
        code: error === bodyExpired ? "body-timeout" : "body",
      });
    } finally {
      clearTimeout(bodyTimer);
      reader.releaseLock();
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      return jsonResponse(422, { code: "fields" });
    const input = raw as Record<string, unknown>,
      errors: Record<string, string> = {},
      values: Record<string, string> = {};
    if (Object.keys(input).some((key) => !Object.hasOwn(fields, key)))
      return jsonResponse(422, { code: "unknown-fields" });
    for (const [name, rule] of Object.entries(fields).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const value = Object.hasOwn(input, name) ? input[name] : undefined;
      if (value === undefined || value === "") {
        if (rule.required) errors[name] = "Bitte ausfüllen.";
        continue;
      }
      let valid =
        typeof value === "string" &&
        (!rule.required || !!value.trim()) &&
        value.length <= rule.maxLength &&
        value.trim().length >= (rule.minLength ?? (rule.required ? 1 : 0)) &&
        !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
      if (valid && rule.validate) {
        try {
          valid = rule.validate((value as string).trim()) === true;
        } catch {
          return jsonResponse(503, { code: "policy-unavailable" });
        }
      }
      if (!valid) errors[name] = "Bitte die Angabe prüfen.";
      else if (typeof value === "string" && value.trim())
        values[name] = value.trim();
    }
    if (Object.keys(errors).length)
      return jsonResponse(422, { code: "validation", errors });
    const token = digest(key),
      fingerprint = digest(JSON.stringify(values));
    let claim: Claim;
    try {
      claim = await bounded(() => ledger.claim(token, fingerprint));
    } catch {
      return jsonResponse(503, { code: "state-unavailable" });
    }
    if (claim === "conflict")
      return jsonResponse(409, { code: "idempotency-conflict" });
    if (claim === "accepted")
      return jsonResponse(200, {
        code: "delivered",
        duplicate: true,
        bookingConfirmed: false,
      });
    if (claim !== "new")
      return jsonResponse(
        claim === "pending" ? 409 : 503,
        { code: claim === "pending" ? "in-progress" : "delivery-unknown" },
        { "Retry-After": "60" },
      );
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let outcome: "accepted" | "rejected" | "unknown" = "unknown";
    try {
      outcome = await Promise.race([
        delivery.deliver(Object.freeze(values), {
          idempotencyKey: token,
          signal: abort.signal,
        }),
        new Promise<"unknown">((resolve) => {
          timer = setTimeout(() => {
            abort.abort();
            resolve("unknown");
          }, timeout);
        }),
      ]);
    } catch {
      outcome = "unknown";
    } finally {
      clearTimeout(timer);
    }
    if (!["accepted", "rejected", "unknown"].includes(outcome))
      outcome = "unknown";
    try {
      await bounded(() =>
        ledger.settle(token, outcome === "rejected" ? "retryable" : outcome),
      );
    } catch {
      return jsonResponse(503, { code: "delivery-unknown" });
    }
    return outcome === "accepted"
      ? jsonResponse(201, {
          code: "delivered",
          duplicate: false,
          bookingConfirmed: false,
        })
      : jsonResponse(503, {
          code: outcome === "unknown" ? "delivery-unknown" : "delivery-failed",
        });
  };
}

// Bounded, process-local adapters for isolated tests only. Not suitable for serverless production.
export function createMemoryControls(now = Date.now, capacity = 1000) {
  const rows = new Map<
    string,
    {
      fingerprint: string;
      state: Exclude<Claim, "new" | "conflict">;
      expires: number;
    }
  >();
  const limits = new Map<string, { count: number; expires: number }>();
  const prune = <T extends { expires: number }>(map: Map<string, T>) => {
    for (const [key, value] of map) if (value.expires <= now()) map.delete(key);
  };
  const ledger: Ledger = {
    async claim(key, fingerprint) {
      prune(rows);
      const row = rows.get(key);
      if (row) return row.fingerprint !== fingerprint ? "conflict" : row.state;
      if (rows.size >= capacity) throw new Error("State capacity");
      rows.set(key, { fingerprint, state: "pending", expires: now() + 600000 });
      return "new";
    },
    async settle(key, state) {
      const row = rows.get(key);
      if (!row) throw new Error("Missing claim");
      if (state === "retryable") rows.delete(key);
      else row.state = state;
    },
  };
  const limiter: RequestLimiter = {
    async consume(source) {
      prune(limits);
      const row = limits.get(source);
      if (row) {
        if (row.count >= 5) return false;
        row.count++;
        return true;
      }
      if (limits.size >= capacity) return false;
      limits.set(source, { count: 1, expires: now() + 60000 });
      return true;
    },
  };
  return { ledger, limiter };
}
