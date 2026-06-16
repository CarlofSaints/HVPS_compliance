# HVP Compliance Project — Current State

## Project Location
`C:\Users\CarlDosSantos-(OUTER\Projects\hvps-compliance`

## RESOLVED 2026-06-16: Compliance Check "fast timeout" / 500 — retired model
**Root cause:** `lib/complianceEngine.ts` called model `claude-sonnet-4-20250514`, which **retired June 15, 2026**. From June 16 on, the Anthropic API returns an immediate 404 `not_found_error` on every call — surfaces in the UI as a fast failure / "timed out very quickly". The earlier "500 on every attempt" notes were from when the model was still valid; it became a hard failure the day the model retired.
**Fix:** changed model to `claude-opus-4-8` (current catalog). No other API changes needed — the request uses no `thinking`/`temperature`/`budget_tokens`/prefill, so it's a clean drop-in.
**Note:** the old fallback suggestion `claude-3-5-sonnet-20241022` is even more retired (Oct 2025) — do NOT use it. Current valid IDs: `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`. Always verify model IDs against the current catalog rather than pinning dated snapshots that retire.

### If it still fails after the model fix, debug here
1. **Check `ANTHROPIC_API_KEY`** is set in the Vercel env vars (and the key has access to the chosen model).
2. **Check `pdf-parse`** isn't crashing — `lib/pdfParser.ts` already wraps it in try/catch and returns a placeholder string, so a parse failure degrades gracefully rather than 500ing.
3. **Vercel function logs** — dashboard > Project > Deployments > Functions tab > the compliance/check function.
4. **Test locally** with `npm run dev`.

### What was being added when this broke
- Web search (Anthropic `web_search_20250305` tool) for checking latest BELA Act, SASA, GDE regulations online
- Guideline text truncation (large PDFs were OOMing the serverless function)
- Sources display in the compliance results UI

### Once the 500 is fixed, restore these features in `lib/complianceEngine.ts`:
- Load guidelines (skip files > 2MB, truncate text to 40k chars each)
- Add web search tool: `tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]`
- Parse web search response (multiple content blocks, citations)
- Return `sources` array from citations
- UI already has the "ONLINE SOURCES CONSULTED" section in `app/(portal)/compliance/page.tsx`

## Recent Completed Work (this session)
- Added BELA Act to compliance engine prompt and guideline source options
- Fixed blob storage race condition (in-memory write cache in `controlData.ts`)
- Added "Already Approved" admin button on spend detail page (force-approve via API)
- Changed CAPEX year input to dropdown selector (current year -2 to +4)
- Source of Funds section already exists in Spend Settings page
- Improved error handling on compliance check (shows actual error, handles non-JSON responses)
- `maxDuration = 120` on both compliance check routes

## Tech Stack
- Next.js 16.2.5, React 19, Tailwind v4, Vercel Blob storage, Anthropic SDK 0.95.0
- Deployed on Vercel Pro
- Uses Resend for email, jsPDF for PDF generation

---

