import { test } from "node:test";
import assert from "node:assert/strict";
import { YieldAgentX402, verifyReceipt, verifyWebhook, YAXError } from "../dist/index.js";

// Live-network smoke tests — hit the production gateway.
// Public endpoints only (no API key), so safe to run in CI.

test("getCapabilities (public, no auth) returns platform manifest", async () => {
  const yax = new YieldAgentX402();
  const caps = await yax.getCapabilities();
  assert.equal(caps.ok, true);
  assert.equal(caps.platform, "YieldAgentX402");
  assert.ok(Array.isArray(caps.proof_points));
  assert.ok(caps.proof_points.length >= 3);
});

test("getShadeAgentWallet returns EVM + BTC + Starknet addresses", async () => {
  const yax = new YieldAgentX402();
  const w = await yax.getShadeAgentWallet();
  assert.equal(w.success, true);
  assert.match(w.addresses.evm || "", /^0x[a-fA-F0-9]{40}$/);
  assert.match(w.addresses.bitcoin || "", /^bc1[a-z0-9]+$/);
  assert.ok((w.addresses.starknet || "").startsWith("0x"));
});

test("missing API key on non-public tool throws YAXError", async () => {
  const yax = new YieldAgentX402();
  await assert.rejects(
    () => yax.runSecureWorkflow({ intent: "test", action_type: "api_call" }),
    (err) => err instanceof YAXError
  );
});

test("verifyReceipt: valid HMAC passes", async () => {
  const SECRET = "test-secret-2026";
  const receipt = { run_id: "run_abc", status: "completed" };
  const body = JSON.stringify(receipt, Object.keys(receipt).sort());
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const r = await verifyReceipt({ secret: SECRET, receipt, signature: sig });
  assert.equal(r.ok, true);
});

test("verifyWebhook: accepts hmac-sha256= prefix", async () => {
  const SECRET = "test-secret-2026";
  const body = '{"event":"run.completed"}';
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const r = await verifyWebhook({ secret: SECRET, body, signature: `hmac-sha256=${sig}` });
  assert.equal(r.ok, true);
});

test("verifyReceipt: tampered payload fails", async () => {
  const SECRET = "test-secret-2026";
  const original = { run_id: "run_abc", status: "completed" };
  const body = JSON.stringify(original, Object.keys(original).sort());
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const tampered = { ...original, status: "denied" };
  const r = await verifyReceipt({ secret: SECRET, receipt: tampered, signature: sig });
  assert.equal(r.ok, false);
});

test("YAXClient: custom endpoint + agentId pass through", () => {
  const yax = new YieldAgentX402({ apiKey: "k", agentId: "agent_x", endpoint: "https://example.com/mcp" });
  assert.equal(yax.apiKey, "k");
  assert.equal(yax.agentId, "agent_x");
  assert.equal(yax.endpoint, "https://example.com/mcp");
});
