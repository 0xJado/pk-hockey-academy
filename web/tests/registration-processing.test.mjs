import test from "node:test";
import assert from "node:assert/strict";
import { ALL } from "../src/pages/api/registration.ts";
import {
  createRegistrationProcessor,
  createMemoryControls,
  inactiveRegistration,
} from "../src/lib/registration/processor.ts";
const origin = "https://academy.test";
const policy = {
  testValue: { required: true, maxLength: 100, minLength: 2 },
  optional: { required: false, maxLength: 20 },
};
const key = "fictional-key-00001";
const request = (
  body = { testValue: "Fictional" },
  headers = {},
  method = "POST",
) =>
  new Request(origin + "/api/registration", {
    method,
    headers: {
      origin,
      "content-type": "application/json",
      "idempotency-key": key,
      ...headers,
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
function setup(extra = {}) {
  let calls = 0;
  const handler = createRegistrationProcessor({
    origin,
    fields: policy,
    ...createMemoryControls(),
    fingerprintSecret: "test-only-secret-at-least-32-characters",
    delivery: {
      async deliver() {
        calls++;
        return "accepted";
      },
    },
    ...extra,
  });
  return { handler, calls: () => calls };
}
test("public registration remains unconditionally inactive and noncacheable", async () => {
  let read = false;

  // An opaque unread body proves the exported route never parses submitted fields.
  const response = await ALL({
    request: {
      get body() {
        read = true;
        throw new Error("Body must not be read");
      },
    },
  });
  assert.equal(response.status, 503);
  assert.equal(read, false);
  const r = inactiveRegistration();
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.match(await r.text(), /keine Angaben/);
});
test("method, origin, content type, key, query and byte limits reject before delivery", async () => {
  const { handler, calls } = setup();
  for (const [r, status] of [
    [request({}, {}, "GET"), 405],
    [request({}, { origin: "https://evil.test" }), 403],
    [request({}, { "content-type": "text/plain" }), 415],
    [request({}, { "idempotency-key": "short" }), 400],
    [request({}, { "content-length": "200000" }), 413],
  ])
    assert.equal((await handler(r, "trusted-client")).status, status);
  assert.equal(calls(), 0);
  const large = setup();
  assert.equal(
    (await large.handler(request({ testValue: "x".repeat(17000) }), "client"))
      .status,
    413,
  );
  assert.equal(large.calls(), 0);
  const query = new Request(origin + "/api/registration?private=value", {
    method: "POST",
    headers: { origin },
    body: "{}",
  });
  assert.equal((await setup().handler(query, "client")).status, 400);
});
test("only explicit policy fields and bounded scalar values are accepted", async () => {
  for (const data of [
    {},
    { testValue: " " },
    { testValue: [] },
    { testValue: "x".repeat(101) },
    { testValue: "ok", health: "private" },
    [],
    null,
    { testValue: "ok", optional: 33 },
  ])
    assert.equal((await setup().handler(request(data), "client")).status, 422);
  const r = await setup().handler(
    request({ testValue: " fictional " }),
    "client",
  );
  assert.equal(r.status, 201);
  assert.equal((await r.json()).bookingConfirmed, false);
});
test("same-key replay is duplicate-safe and changed payload conflicts", async () => {
  const s = setup();
  assert.equal((await s.handler(request(), "client")).status, 201);
  const retry = await s.handler(request(), "client");
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).duplicate, true);
  assert.equal(
    (await s.handler(request({ testValue: "Changed" }), "client")).status,
    409,
  );
  assert.equal(s.calls(), 1);
});
test("concurrent requests claim atomically before fake delivery finishes", async () => {
  let complete, started;
  const ready = new Promise((r) => (started = r));
  let calls = 0;
  const s = setup({
    delivery: {
      deliver() {
        calls++;
        started();
        return new Promise((r) => (complete = r));
      },
    },
  });
  const first = s.handler(request(), "client");
  await ready;
  assert.equal((await s.handler(request(), "client")).status, 409);
  complete("accepted");
  assert.equal((await first).status, 201);
  assert.equal(calls, 1);
});
test("known failure permits retry, but ambiguous delivery and timeout never silently resend", async () => {
  let calls = 0;
  const s = setup({
    delivery: {
      async deliver() {
        return ++calls === 1 ? "rejected" : "accepted";
      },
    },
  });
  assert.equal((await s.handler(request(), "client")).status, 503);
  assert.equal((await s.handler(request(), "client")).status, 201);
  for (const delivery of [
    {
      async deliver() {
        throw new Error("sensitive provider detail");
      },
    },
    {
      async deliver() {
        return "unknown";
      },
    },
    {
      deliver() {
        return new Promise(() => {});
      },
    },
  ]) {
    let count = 0;
    const handler = setup({
      deliveryTimeoutMs: 5,
      delivery: {
        deliver(...args) {
          count++;
          return delivery.deliver(...args);
        },
      },
    }).handler;
    const failed = await handler(request(), "client");
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).code, "delivery-unknown");
    assert.equal((await handler(request(), "client")).status, 503);
    assert.equal(count, 1);
  }
});
test("request limits reset, remain bounded and fail closed when stores fail", async () => {
  let now = 0;
  const controls = createMemoryControls(() => now, 1);
  const s = setup(controls);
  for (let n = 0; n < 5; n++)
    assert.ok(
      [200, 201].includes((await s.handler(request(), "client")).status),
    );
  assert.equal((await s.handler(request(), "client")).status, 429);
  assert.equal((await s.handler(request(), "another")).status, 429);
  now = 60001;
  assert.equal((await s.handler(request(), "client")).status, 200);
  assert.equal(
    (
      await setup({
        limiter: {
          async consume() {
            throw new Error("unavailable");
          },
        },
      }).handler(request(), "client")
    ).status,
    503,
  );
  assert.equal(
    (
      await setup({
        ledger: {
          async claim() {
            throw new Error("unavailable");
          },
        },
      }).handler(request(), "client")
    ).status,
    503,
  );
});

test("streamed bytes and slow or malformed bodies cannot bypass request limits", async () => {
  const headers = {
    origin,
    "content-type": "application/json",
    "idempotency-key": key,
  };
  const slow = new Request(origin + "/api/registration", {
    method: "POST",
    headers,
    duplex: "half",
    body: new ReadableStream(
      {
        pull() {},
        cancel() {
          return new Promise(() => {});
        },
      },
      { highWaterMark: 0 },
    ),
  });
  assert.equal(
    (await setup({ bodyTimeoutMs: 5 }).handler(slow, "client")).status,
    408,
  );
  const streamed = new Request(origin + "/api/registration", {
    method: "POST",
    headers,
    duplex: "half",
    body: new ReadableStream({
      start(c) {
        c.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ testValue: "💙".repeat(100) }),
          ),
        );
        c.close();
      },
    }),
  });
  assert.equal(
    (await setup({ maxBytes: 80 }).handler(streamed, "client")).status,
    413,
  );
  for (const body of ["{invalid", "null", '{"__proto__":{"polluted":true}}']) {
    const result = await setup().handler(
      new Request(origin + "/api/registration", {
        method: "POST",
        headers,
        body,
      }),
      "client",
    );
    assert.ok([400, 422].includes(result.status));
  }
  assert.equal({}.polluted, undefined);
});

test("fake destination receives only normalized reviewed fields and an opaque retry key", async () => {
  const received = [];
  const s = setup({
    delivery: {
      async deliver(fields, context) {
        received.push({ fields, context });
        assert.ok(Object.isFrozen(fields));
        return "accepted";
      },
    },
  });
  await s.handler(
    request({ testValue: " Fictional ", optional: " " }),
    "client",
  );
  await s.handler(request({ testValue: "Fictional" }), "client");
  assert.equal(received.length, 1);
  assert.deepEqual(received[0].fields, { testValue: "Fictional" });
  assert.match(received[0].context.idempotencyKey, /^[a-f0-9]{64}$/);
  assert.ok(received[0].context.signal instanceof AbortSignal);
});
test("validators run only on bounded values, and faults or ledger settlement failures never claim success", async () => {
  let validations = 0;
  const s = setup({
    fields: {
      testValue: {
        required: true,
        maxLength: 4,
        validate() {
          validations++;
          throw new Error("sensitive-policy-detail");
        },
      },
    },
  });
  assert.equal(
    (await s.handler(request({ testValue: "too long" }), "client")).status,
    422,
  );
  assert.equal(validations, 0);
  const r = await s.handler(request({ testValue: "test" }), "client");
  assert.equal(r.status, 503);
  assert.ok(!(await r.text()).includes("sensitive"));
  assert.equal(s.calls(), 0);
  const faulty = setup({
    ledger: {
      async claim() {
        return "new";
      },
      async settle() {
        throw new Error("private-state-detail");
      },
    },
  });
  assert.equal((await faulty.handler(request(), "client")).status, 503);
});

test("hanging limiter and atomic state operations fail closed within the configured deadline", async () => {
  const never = () => new Promise(() => {});
  for (const extra of [
    { limiter: { consume: never } },
    { ledger: { claim: never } },
    {
      ledger: {
        async claim() {
          return "new";
        },
        settle: never,
      },
    },
  ]) {
    const s = setup({ stateTimeoutMs: 5, ...extra });
    assert.equal((await s.handler(request(), "client")).status, 503);
  }
});
