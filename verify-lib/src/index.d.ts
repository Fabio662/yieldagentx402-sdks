export interface VerifyResult {
  ok: boolean;
  computed: string;
  provided: string;
  reason?: string;
}

export interface VerifyReceiptOpts {
  secret: string;
  receipt: Record<string, unknown> | string;
  signature: string;
}
export function verifyReceipt(opts: VerifyReceiptOpts): Promise<VerifyResult>;

export interface VerifyWebhookOpts {
  secret: string;
  body: string | ArrayBuffer | Uint8Array;
  signature: string | Headers;
}
export function verifyWebhook(opts: VerifyWebhookOpts): Promise<VerifyResult>;

export interface FetchAndVerifyOpts {
  runId: string;
  secret: string;
  apiKey?: string;
  endpoint?: string;
}
export function fetchAndVerifyReceipt(opts: FetchAndVerifyOpts): Promise<{
  ok: boolean;
  receipt: Record<string, unknown> | null;
  verified: boolean;
  reason?: string;
}>;
