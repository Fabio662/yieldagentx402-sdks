# yieldagentx402-verify

> Zero-dependency verifier for YieldAgentX402 receipts and webhook signatures.
> Works in **browser, Node 18+, Cloudflare Workers, Deno**.

[Docs](https://yieldagentx402.app/mcp-server) · [Verify page](https://yieldagentx402.app/verify) · [npm](https://www.npmjs.com/package/yieldagentx402-verify)

## Install

```bash
npm install yieldagentx402-verify
```

## Verify a receipt

```js
import { verifyReceipt } from "yieldagentx402-verify";

const result = await verifyReceipt({
  secret:   process.env.YAX_WEBHOOK_SECRET,
  receipt:  receiptObjectFromGateway,
  signature: receiptObjectFromGateway.receipt_signature,
});

if (result.ok) console.log("Receipt is genuine ✓");
else console.warn("Receipt failed verification:", result);
```

## Verify a webhook

```js
import { verifyWebhook } from "yieldagentx402-verify";

// In your webhook handler:
const rawBody = await request.text();
const result = await verifyWebhook({
  secret:    process.env.YAX_WEBHOOK_SECRET,
  body:      rawBody,
  signature: request.headers,  // pass Headers directly
});

if (!result.ok) return new Response("invalid sig", { status: 401 });
const event = JSON.parse(rawBody);
// process event.run_id, event.status, event.receipt_signature ...
```

## Fetch + verify in one call

```js
import { fetchAndVerifyReceipt } from "yieldagentx402-verify";

const { verified, receipt } = await fetchAndVerifyReceipt({
  runId:   "run_abc123",
  secret:  process.env.YAX_WEBHOOK_SECRET,
  apiKey:  process.env.YAX_API_KEY,
});

console.log(verified ? "✓ anchored + signed" : "⚠ not verified");
```

## Why this lib exists

YieldAgentX402 receipts are HMAC-SHA256 signatures over canonical receipt JSON. The signing happens inside an Intel TDX TEE, and the proof is anchored to Filecoin + BTFS. This package gives you a tiny, audit-able client to verify the signature yourself — **no trust in the YAX gateway required**.

- **0 runtime deps** — uses WebCrypto only
- **Timing-safe equality** — no leaks
- **TypeScript types included**
- **Works everywhere** — browser, Node, Workers, Deno

## License

MIT
