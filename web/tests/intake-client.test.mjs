import test from "node:test";
import assert from "node:assert/strict";
import { createIntakeClient } from "../src/lib/registration/intake-client.ts";

const token = `1794500000.1794586400.${"a".repeat(64)}.${"b".repeat(64)}.${"c".repeat(64)}`;
const reference = "d".repeat(64);
const response = (status, body) => new Response(JSON.stringify(body), { status });
const issued = () => response(200, { code: "request-token", token });
const received = () => response(201, { code: "received", reference });
const fictional = { childName: "Fictional child", consents: { health: false } };

test("a lost receipt retries identical bytes/key despite edited input, without automatic resend", async () => {
  const writes = [];
  let tokens = 0;
  const client = createIntakeClient(async (path, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.ok(!path.includes("?"));
    if (path.endsWith("/token")) { tokens++; assert.equal(options.body, "{}"); return issued(); }
    writes.push({ body: options.body, key: options.headers["Idempotency-Key"] });
    if (writes.length === 1) throw new Error("receipt lost after possible commit");
    return received();
  });
  const input = structuredClone(fictional);
  assert.deepEqual(await client.submit(input), { state: "uncertain" });
  input.childName = "Edited after loss";
  assert.deepEqual(await client.submit(input), { state: "review-required" });
  assert.equal(writes.length, 1);
  assert.deepEqual(await client.retry(), { state: "received", reference });
  assert.deepEqual(writes[0], writes[1]);
  assert.equal(tokens, 1);
  assert.equal(JSON.parse(writes[1].body).childName, fictional.childName);
  assert.deepEqual(await client.submit(input), { state: "received", reference });
  assert.equal(writes.length, 2);
});

test("concurrent clicks create only one token and one write", async () => {
  let release;
  let calls = 0;
  const client = createIntakeClient(async (path) => {
    calls++;
    if (path.endsWith("/token")) return new Promise(resolve => { release = () => resolve(issued()); });
    return received();
  });
  const first = client.submit(fictional);
  assert.deepEqual(await client.submit(fictional), { state: "busy" });
  assert.deepEqual(await client.retry(), { state: "busy" });
  release();
  assert.deepEqual(await first, { state: "received", reference });
  assert.equal(calls, 2);
});

test("server validation permits corrections using the same token without returning submitted values", async () => {
  let count = 0;
  const keys = [];
  const client = createIntakeClient(async (path, options) => {
    if (path.endsWith("/token")) return issued();
    keys.push(options.headers["Idempotency-Key"]);
    return ++count === 1
      ? response(422, { code: "validation", errors: { guardianEmail: "untrusted returned text" } })
      : received();
  });
  assert.deepEqual(await client.submit(fictional), { state: "invalid", fields: ["guardianEmail"] });
  assert.deepEqual(await client.submit({ ...fictional, guardianEmail: "fictional@example.test" }), { state: "received", reference });
  assert.deepEqual(keys, [token, token]);
});

test("expired/conflicting/reconciliation tokens never silently rotate after submission", async () => {
  for (const code of ["ticket-expired", "idempotency-conflict", "reconciliation-required", "policy-version"]) {
    let count = 0;
    const client = createIntakeClient(async path => {
      count++;
      return path.endsWith("/token") ? issued() : response(409, { code });
    });
    assert.deepEqual(await client.submit(fictional), { state: "review-required" });
    assert.deepEqual(await client.retry(), { state: "review-required" });
    assert.deepEqual(await client.submit(fictional), { state: "review-required" });
    assert.equal(count, 2);
  }
});

test("HTTP status, malformed responses and missing references cannot manufacture success", async () => {
  for (const failure of [
    () => response(503, { code: "received", reference }),
    () => response(200, { code: "received" }),
    () => response(201, { code: "received", reference: "untrusted markup" }),
    () => new Response("<html>proxy error</html>", { status: 200 }),
    () => response(429, { code: "rate-limit" }),
    () => response(503, { code: "outcome-unknown" }),
  ]) {
    const client = createIntakeClient(async path => path.endsWith("/token") ? issued() : failure());
    assert.deepEqual(await client.submit(fictional), { state: "uncertain" });
    assert.deepEqual(await client.submit(fictional), { state: "review-required" });
  }
});

test("token failures never submit participant fields", async () => {
  for (const tokenResult of [
    () => response(503, { code: "inactive" }),
    () => response(200, { code: "request-token", token: "invalid" }),
    () => { throw new Error("offline"); },
  ]) {
    const client = createIntakeClient(async (path, options) => {
      assert.equal(path, "/api/registration/token");
      assert.equal(options.body, "{}");
      return tokenResult();
    });
    assert.deepEqual(await client.submit(fictional), { state: "unavailable" });
  }
});

test("a stalled write or response-body read becomes uncertain within a bounded deadline", async () => {
  for (const stall of [() => new Promise(() => {}), () => ({ json: () => new Promise(() => {}) })]) {
    const client = createIntakeClient(async path => path.endsWith("/token") ? issued() : stall(), 10);
    assert.deepEqual(await client.submit(fictional), { state: "uncertain" });
    assert.deepEqual(await client.submit(fictional), { state: "review-required" });
  }
});
