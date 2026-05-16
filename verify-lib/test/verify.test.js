import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyReceipt, verifyWebhook } from "../src/index.js";

const SECRET = "test-secret-2026";

test("verifyReceipt: valid signature passes", async () => {
  const receipt = { run_id: "run_abc", status: "completed", anchored_at: "2026-05-16" };
  const body = JSON.stringify(receipt, Object.keys(receipt).sort());
  // pre-computed expected sig from node crypto
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const r = await verifyReceipt({ secret: SECRET, receipt, signature: sig });
  assert.equal(r.ok, true);
});

test("verifyReceipt: tampered receipt fails", async () => {
  const receipt = { run_id: "run_abc", status: "completed" };
  const body = JSON.stringify(receipt, Object.keys(receipt).sort());
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const tampered = { ...receipt, status: "denied" };
  const r = await verifyReceipt({ secret: SECRET, receipt: tampered, signature: sig });
  assert.equal(r.ok, false);
});

test("verifyReceipt: accepts hmac-sha256= prefix and 0x prefix", async () => {
  const body = "raw-string-receipt";
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const r1 = await verifyReceipt({ secret: SECRET, receipt: body, signature: `hmac-sha256=${sig}` });
  const r2 = await verifyReceipt({ secret: SECRET, receipt: body, signature: `0x${sig}` });
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
});

test("verifyWebhook: Headers object", async () => {
  const body = '{"event":"run.completed","run_id":"run_xyz"}';
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const headers = new Headers({ "X-YAX-Signature": `hmac-sha256=${sig}` });
  const r = await verifyWebhook({ secret: SECRET, body, signature: headers });
  assert.equal(r.ok, true);
});

test("verifyWebhook: missing signature returns reason", async () => {
  const r = await verifyWebhook({ secret: SECRET, body: "x", signature: "" });
  assert.equal(r.ok, false);
  assert.match(r.reason || "", /missing/i);
});
