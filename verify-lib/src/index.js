// @yieldagentx402/verify — zero-dep receipt + webhook signature verifier.
// Browser-safe (WebCrypto), Node 18+, Cloudflare Workers, Deno.

const enc = new TextEncoder();

function hexToBytes(hex) {
  const h = String(hex || "").replace(/^0x/i, "").toLowerCase();
  if (h.length % 2 !== 0 || /[^0-9a-f]/.test(h)) throw new Error("invalid hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i*2, i*2+2), 16);
  return out;
}
function bytesToHex(buf) {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqualHex(a, b) {
  const A = String(a || "").toLowerCase();
  const B = String(b || "").toLowerCase();
  if (A.length !== B.length) return false;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff |= A.charCodeAt(i) ^ B.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(String(secret)),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key,
    typeof message === "string" ? enc.encode(message) : message
  );
  return bytesToHex(sig);
}

/**
 * Verify a YAX receipt signature.
 *
 * @param {object} opts
 * @param {string} opts.secret      - The shared HMAC secret. Issued with your prod API key.
 * @param {object|string} opts.receipt - Receipt payload. If an object, JSON-stringified canonically.
 * @param {string} opts.signature   - Signature string from receipt_signature. Accepts:
 *                                    "hmac-sha256=<hex>", "<hex>", or "0x<hex>".
 * @returns {Promise<{ok:boolean, computed:string, provided:string, reason?:string}>}
 */
export async function verifyReceipt({ secret, receipt, signature }) {
  if (!secret)    return { ok: false, computed: "", provided: "", reason: "missing secret" };
  if (!signature) return { ok: false, computed: "", provided: "", reason: "missing signature" };

  const body = typeof receipt === "string"
    ? receipt
    : JSON.stringify(receipt, Object.keys(receipt).sort());
  const sig = String(signature).replace(/^hmac-sha256=/i, "").replace(/^0x/, "").toLowerCase();
  const computed = await hmacSha256Hex(secret, body);
  return {
    ok:       timingSafeEqualHex(computed, sig),
    computed,
    provided: sig,
  };
}

/**
 * Verify an incoming webhook from YieldAgentX402.
 * Reads the X-YAX-Signature header (or `signature` opt) and checks against the raw body.
 *
 * @param {object} opts
 * @param {string} opts.secret    - YAX_WEBHOOK_SECRET shared with you on production key issuance.
 * @param {string|ArrayBuffer|Uint8Array} opts.body - Raw HTTP body (string preferred).
 * @param {string|Headers} opts.signature - Either "hmac-sha256=<hex>" or a Headers object containing X-YAX-Signature.
 * @returns {Promise<{ok:boolean, computed:string, provided:string, reason?:string}>}
 */
export async function verifyWebhook({ secret, body, signature }) {
  if (!secret) return { ok: false, computed: "", provided: "", reason: "missing secret" };
  let sigStr = signature;
  if (signature && typeof signature === "object" && typeof signature.get === "function") {
    sigStr = signature.get("X-YAX-Signature") || signature.get("x-yax-signature");
  }
  if (!sigStr) return { ok: false, computed: "", provided: "", reason: "missing X-YAX-Signature header" };
  const sig = String(sigStr).replace(/^hmac-sha256=/i, "").replace(/^0x/, "").toLowerCase();
  const bodyStr = typeof body === "string" ? body :
                  body instanceof Uint8Array ? new TextDecoder().decode(body) :
                  body instanceof ArrayBuffer ? new TextDecoder().decode(new Uint8Array(body)) :
                  String(body);
  const computed = await hmacSha256Hex(secret, bodyStr);
  return {
    ok:       timingSafeEqualHex(computed, sig),
    computed,
    provided: sig,
  };
}

/**
 * Convenience: fetch a receipt from the YAX gateway and verify it in one call.
 *
 * @param {object} opts
 * @param {string} opts.runId
 * @param {string} opts.secret
 * @param {string} [opts.apiKey]   - Required for non-public receipts.
 * @param {string} [opts.endpoint] - Defaults to https://api.yieldagentx402.app
 * @returns {Promise<{ok:boolean, receipt:object|null, verified:boolean, reason?:string}>}
 */
export async function fetchAndVerifyReceipt({ runId, secret, apiKey, endpoint }) {
  const base = String(endpoint || "https://api.yieldagentx402.app").replace(/\/+$/, "");
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const r = await fetch(`${base}/api/orchestration/runs/${encodeURIComponent(runId)}`, { headers });
  if (!r.ok) return { ok: false, receipt: null, verified: false, reason: `HTTP ${r.status}` };
  const d = await r.json();
  const run = d.run || d;
  const sig = run.receipt_signature;
  if (!sig) return { ok: true, receipt: run, verified: false, reason: "receipt has no signature yet" };
  const v = await verifyReceipt({ secret, receipt: run, signature: sig });
  return { ok: true, receipt: run, verified: v.ok };
}

export default { verifyReceipt, verifyWebhook, fetchAndVerifyReceipt };
