# Google Cloud Marketplace — AI Agents listing

**Audience:** Fabian Jefferson / YieldAgentX402  
**Partner Hub:** `partners@yieldagentx402.app` · launch **2026-06-01**  
**Public readiness:** https://yieldagentx402.app/google-cloud-partner-readiness  

This is **separate** from Partner Network enrollment. Marketplace requires **vendor onboarding** + Producer Portal + (usually) **GCP billing integration**.

---

## Which path fits YieldAgentX402?

| Path | Protocol | Fit today | Notes |
|------|----------|-----------|--------|
| **A2A + Gemini Enterprise** | [Agent2Agent](https://a2a-protocol.org/) | **Partial** | Production API is **MCP** (`POST /mcp`), not native A2A. Use draft `agent-card.json` + confirm with Google whether MCP-over-HTTP qualifies or you need an A2A adapter. |
| **SaaS (recommended near-term)** | MCP / REST / any | **Strong** | List as SaaS agent; bill via Marketplace; run control plane on **Cloud Run** per `ARCHITECTURE_PLAN.md`. |
| **GKE app** | Container | Medium | If you ship a Helm chart for self-hosted enterprise. |
| **Professional services** | — | Strong | “Governed agent execution deployment” for enterprises migrating to GCP. |

**Practical strategy:** Finish **Partner Hub** now → start **Marketplace vendor** onboarding → pursue **SaaS** listing while validating **A2A Agent Card** with Google (draft in `agent-card.json`).

---

## Prerequisites (do in order)

1. **[Sign up as Cloud Marketplace vendor](https://cloud.google.com/marketplace/docs/partners/offer-products#initiate-onboarding)**  
2. **Cloud Marketplace Project Info Form** (Google sends after interest) → access **Producer Portal**  
3. Legal entity, support, security contacts (see `READINESS_CHECKLIST.md`, `SUPPORT_AND_SECURITY.md`)  
4. **GCP-primary story** for reviewers: `ARCHITECTURE_PLAN.md` (hybrid today; GCP target for enterprise tenants)

---

## A2A path — step-by-step

Official flow: https://cloud.google.com/marketplace/docs/partners/ai-agents

| Step | Action | Repo asset |
|------|--------|------------|
| 1 | Finalize **Agent Card** JSON | `agent-card.json` (edit → upload to **Cloud Storage**) |
| 2 | [Add product in Producer Portal](https://cloud.google.com/marketplace/docs/partners/ai-agents/add-product) | Product name: **YieldAgentX402** |
| 3 | [Add Agent Card](https://cloud.google.com/marketplace/docs/partners/ai-agents/agent-card) | GCS URI to `agent-card.json` |
| 4 | [Product details](https://cloud.google.com/marketplace/docs/partners/ai-agents/product-details) | Copy from `APPLICATION_BRIEF.md` |
| 5 | [Pricing](https://cloud.google.com/marketplace/docs/partners/ai-agents/choose-pricing) | Start **Free** or **Usage-based** (API calls / active agents) |
| 6 | [Technical integration](https://cloud.google.com/marketplace/docs/partners/ai-agents/technical-integration) | Google sign-in, account linking, entitlements |
| 7 | [Publish](https://cloud.google.com/marketplace/docs/partners/ai-agents/publish) | Google validation → public `gcloud` visibility command |

### Agent Card hosting (GCS)

```bash
# Example — use your marketplace project bucket
gsutil cp docs/google-cloud-partner/agent-card.json gs://YOUR_BUCKET/agent-cards/yieldagentx402/agent-card.json
# Producer Portal: paste gs://YOUR_BUCKET/agent-cards/yieldagentx402/agent-card.json
```

Also publish well-known (optional, A2A convention):

`https://yieldagentx402.app/.well-known/agent-card.json` → can mirror same JSON after legal review.

### Pricing suggestion (first listing)

| Model | When |
|-------|------|
| **Free** | Pilot / Agent Finder visibility; customer pays only GCP resources |
| **Usage-based** | Later: meter `tools/call`, active agents, or $ settled via x402 |
| **Subscription** | Enterprise tier with SLA (see `SUPPORT_AND_SECURITY.md`) |

---

## SaaS path — step-by-step

Docs: https://cloud.google.com/marketplace/docs/partners/integrated-saas

| Step | Action |
|------|--------|
| 1 | Producer Portal → **SaaS** product |
| 2 | Describe **YieldAgentX402 Agent OS** — MCP endpoint + dashboard |
| 3 | Deploy admin/signup on **Cloud Run** (signup, entitlements, reporting) |
| 4 | Integrate **[Marketplace procurement API](https://cloud.google.com/marketplace/docs/partners/integrated-saas)** |
| 5 | Point execution API to `https://api.yieldagentx402.app` (phase 1) or migrate API to Cloud Run (phase 2) |

---

## Copy-paste — product listing (short)

**Product name:** YieldAgentX402  

**One-liner:** Policy-gated, receipt-backed execution layer for AI agents on MCP and x402.

**Description:**  
YieldAgentX402 lets enterprises run AI agents that move money without giving up custody. ShadeGuard enforces policy and spend caps before execution; x402 handles machine-verifiable payments; every governed action returns a signed receipt suitable for audit. Sixteen MCP tools, eighteen chains, TEE-attested runs, and a public SDK mirror. Integrates with Claude, Cursor, CrewAI, and LangChain. Official MCP Registry: `io.github.Fabio662/yieldagentx402`.

**Support URL:** https://yieldagentx402.app/enterprise  
**Documentation:** https://yieldagentx402.app/mcp-server  
**Terms / Privacy:** https://yieldagentx402.app/terms · https://yieldagentx402.app/privacy  

**Proof URLs for reviewers:**  
- MCP: `https://api.yieldagentx402.app/mcp`  
- Discovery: `yax_get_capabilities` (no auth)  
- Partner readiness: https://yieldagentx402.app/google-cloud-partner-readiness  
- TEE: `https://api.yieldagentx402.app/api/tee/report  

---

## What to cite (distribution already live)

| Surface | Value |
|---------|--------|
| Official MCP Registry | `io.github.Fabio662/yieldagentx402` v1.0.2 → `yieldagentx402-sdks/mcp-server` |
| npm | `agentx402-mcp-server@1.0.3`, `yieldagentx402@1.1.0`, `yieldagentx402-verify@1.0.1` |
| PyPI | `crewai-yieldagentx402-tools`, `yieldagentx402-langchain@0.1.3` |
| Manifest | `/.well-known/mcp.json` v1.0.3 (5 packages) |

---

## Agent Finder

After publish, listing can surface on: https://cloud.withgoogle.com/agentfinder/  

Example partner listing shape: Dynatrace A2A agent on Agent Finder (see GCP blog).

---

## Timeline (realistic)

| Phase | Target |
|-------|--------|
| Partner Hub submitted | Now (launch 2026-06-01) |
| Marketplace vendor approved | 2–6 weeks (Google-driven) |
| SaaS or A2A draft in Producer Portal | +2–4 weeks your engineering |
| Public Marketplace / Agent Finder | +4–8 weeks review & integration |

---

## Open questions for Google (ask in onboarding call)

1. Is **MCP Streamable HTTP** at `/mcp` acceptable for `supportedInterfaces` on an A2A Agent Card, or is a native A2A message endpoint required?  
2. Can **usage-based** pricing meter external x402 settlement volume?  
3. **Hybrid architecture** (Cloudflare edge today + Cloud Run control plane) acceptable for phase-1 SaaS?

---

## Related files

- `agent-card.json` — A2A draft  
- `APPLICATION_BRIEF.md` — Partner + product narrative  
- `ARCHITECTURE_PLAN.md` — GCP diagram  
- `registry-submissions/google-cloud-ai-agent-marketplace.md` — short index  
