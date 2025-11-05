# ollo – Technical Specification

## 1. Overview

ollo is a web platform that automates electronics project planning, bill of materials generation, and part sourcing by integrating with major suppliers and leveraging AI. This document details the technical implementation, APIs, data architecture, and feature breakdown.

---

## 2. API Integrations

**Supported Suppliers & API Docs:**
- [Digi-Key API](https://developer.digikey.com/)
- [Mouser Electronics API](https://api.mouser.com/api/docs/)
- [LCSC API (Unofficial)](https://github.com/pmslt/lcsc-openapi)
- [Adafruit Product Data](https://adafruit.com/api/)
- [SparkFun Data/API](https://data.sparkfun.com/)
- [JLCPCB OpenAPI](https://support.jlcpcb.com/article/61-jlcpcb-open-api)

**API Endpoints Commonly Used:**
- Inventory: `/products/availability` or `/stock`
- Parametric Search: `/products/search` + filters
- Pricing: `/products/pricebreaks`
- Datasheets: `/products/datasheet`
- Alternatives: supplier API endpoints or internal matching

**Authentication & Security:**
- API keys stored in [Supabase secrets](https://supabase.com/docs/guides/functions/secrets)
- Rate limiting via Supabase middleware
- Data security: SSL, environment variables

**Data Flow & Sync:**
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) scheduled for daily part refresh
- [Redis](https://redis.io/) for cache, fallback to [Postgres](https://supabase.com/docs/guides/database)
- Real-time lookup via [React Query](https://tanstack.com/query/latest) from client

**Error Handling:**
- try/catch for fetches
- Log all non-200 API responses to [Supabase Logs](https://supabase.com/docs/guides/logs)
- Circuit breaker with fallback to cache

---

## 3. Core Features & Technical Implementation

| Feature                   | Implementation Overview                                                                        | Tech/Docs    |
|---------------------------|-----------------------------------------------------------------------------------------------|--------------|
| **AI Assistant**          | Streams user input to OpenAI (via [Vercel AI SDK](https://vercel.com/docs/ai)), logs interactions in Supabase; validates BOMs  | [Vercel AI SDK](https://vercel.com/docs/ai), [OpenAI API](https://platform.openai.com/docs/api-reference) |
| **Real-Time Availability**| Live queries via [Supabase Edge Functions](https://supabase.com/docs/guides/functions), UI updates via [React Query](https://tanstack.com/query/latest) | [Supabase](https://supabase.com), [React Query](https://tanstack.com/query/latest) |
| **Smart Build Planner**   | Project/milestone system; AI proposes steps, updates via Next.js pages, changes logged        | [Supabase](https://supabase.com), [Next.js](https://nextjs.org/docs) |
| **Parts Research**        | Hybrid API lookup/web scraping ([Node.js Fetch](https://nodejs.org/api/http.html)), normalization routines | [Node.js](https://nodejs.org/), [Cheerio](https://cheerio.js.org/) |
| **User Management**       | Auth, session, permissions, and project sharing via [Clerk](https://clerk.com/docs)           | [Clerk](https://clerk.com/docs) |
| **AI-Assisted Project Setup** | Multi-step wizard in a modal (type → name → one-line purpose → AI-driven follow-ups). AI asks up to ~5 targeted questions (text/multiple-choice/slider) with suggested ranges (e.g., budget/timeline). Persists intake, creates project on completion, logs AI. | [Vercel AI SDK](https://vercel.com/docs/ai), [OpenAI](https://platform.openai.com/docs/api-reference), [Supabase](https://supabase.com) |

---

### 3.1 AI-Assisted Project Setup Wizard

UI/UX
- Single modal with progress bar; one question per screen.
- Steps: 1) Choose type (breadboard/pcb/custom) 2) Project name 3) One-sentence purpose (≤ ~50 words) 4) AI follow-up questions (≤ 5) 5) Review → Create project.
- Inputs supported by AI: `text`, `multiple_choice`, `slider`. Sliders show suggested min/max and recommended value.

Schema for dynamic question (JSON stored per answer)
```
{
  type: 'text' | 'multiple_choice' | 'slider',
  label: string,
  helper?: string,
  charLimit?: number,
  options?: { value: string; label: string }[],
  min?: number,
  max?: number,
  suggested?: number | string
}
```

API Endpoints (Next.js route handlers)
- POST `/api/intake/generate-question`: body = { sessionId, context }, returns `{ question }` as above. Uses Vercel AI SDK with `gpt-5-nano` by default.
- POST `/api/intake/answer`: body = { sessionId, sequence, question, answer }, persists to Supabase.
- POST `/api/intake/complete`: creates `projects` row from session context + answers; returns project id.

AI Model & Prompting
- Default model: `gpt-5-nano` via Vercel AI SDK for low-latency, low-cost question generation.
- Guardrails: provide strict JSON schema, require one concise question, cap char limits, include safe defaults for sliders.
- Optionally escalate to larger model for complex domains (feature flag).

Validation & Limits
- Rate limit per user/session (e.g., 30 req/min) and max 5 follow-up questions.
- Server-side zod validation on endpoint payloads; sanitize stored JSON.
- Error handling with fallbacks to static questions if AI fails.

Observability & Logging
- Log prompts/outputs to `ai_history` (user-scoped) and tie to `sessionId`.
- Structured logs to Supabase; surface non-2xx in logs dashboard.

## 4. Data Architecture

| Table         | Key Fields                                                          | More Info   |
|---------------|---------------------------------------------------------------------|-------------|
| users         | id, clerk_id, email, created_at                                     | [Supabase Users](https://supabase.com/docs/guides/auth) |
| projects      | id, user_id, name, description, created_at                          | [Projects Example](https://supabase.com/docs/guides/database/tables) |
| components    | id, supplier_id, part_number, project_id, metadata, datasheet_url, cached_stock, updated_at | [Schema Design](https://supabase.com/docs/guides/database) |
| milestones    | id, project_id, name, deadline, status                              | —           |
| logs          | id, project_id, body, timestamp                                     | —           |
| ai_history    | id, user_id, project_id, input, output, created_at                  | —           |
| project_intake_sessions | id, user_id, project_id (nullable until complete), status, created_at | — |
| project_intake_answers  | id, session_id, sequence, question_json, answer_json, created_at      | — |

**Relations:**  
- Users → Projects (1:M)  
- Projects → Components/Milestones/Logs (1:M)  
- AI history is per-user, per-project
- Users → project_intake_sessions (1:M)
- project_intake_sessions → project_intake_answers (1:M)
- project_intake_sessions → Projects (0 or 1)

---

## 5. Supplier API Handling & Sync

- All fetches use [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- Results cached in [Redis](https://redis.io/) (24h expiry)
- On API error, fallback to latest [Postgres](https://supabase.com/docs/guides/database) cache
- Part record changes flagged for frontend refresh

---

## 6. Milestone/Build Tracking Logic

- Users create milestones in UI
- Status tracked (`complete`, `incomplete` etc.)—saved per project in [Supabase](https://supabase.com/docs)
- Frontend polls milestone states; changes log entries with details

---

## 7. Tech Stack, Libraries & Documentation

- **Frontend:** [Next.js](https://nextjs.org/docs), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/docs), [React Query](https://tanstack.com/query/latest)
- **Backend:** [Supabase](https://supabase.com/), [Postgres](https://supabase.com/docs/guides/database), [Supabase Edge Functions](https://supabase.com/docs/guides/functions), [Redis](https://redis.io/)
- **AI:** [Vercel AI SDK](https://vercel.com/docs/ai), [OpenAI](https://platform.openai.com/docs/api-reference)
- **Auth:** [Clerk](https://clerk.com/docs)

---

Everything else (branding, color, font, design, marketing) is intentionally excluded. This is a technical engineering document only.

---

## 8. Implementation Status Tracker

| Capability | Status | Notes |
|------------|--------|-------|
| **Dashboard project cards** | ✅ Implemented | Compact cards with keyboard support, contextual icons, rename/delete/edit flows hooked to Supabase. |
| **Project detail shell** | ✅ Implemented | Summary, metadata, status control, markdown editing, and mobile responsiveness shipped. Summary editor widened with Markdown guidance. |
| **Next recommended steps** | ✅ Implemented (in summary card) | Status-aware steps now appear inside the project summary card under key themes. |
| **Workspace settings** | ✅ Implemented | Clerk-backed settings page with AI toggles, default view selector, and preferred currency stored in public metadata. |
| **Currency preference wiring** | ✅ Implemented | Server pulls preferred currency and feeds it to parts recommendations and future pricing. |
| **Multi-supplier parts recommendations** | ✅ Implemented (hybrid) | GPT-5 Nano planner + Firecrawl/live scraping with supplier image support; sample dataset used when live data unavailable. |
| **Environment configuration** | ✅ Implemented | `.env.local` seeded with placeholders for Firecrawl, Digi-Key, Mouser, JLCPCB, PCBWay, LCSC keys (owner-only). |
| **AI-assisted project creation** | ✅ Implemented pre-existing wizard | Multi-step intake modal creates projects with AI metadata. |
| **Project stage workflow** | ✅ Implemented | Type-specific stage tracker on project overview with GPT-assisted initiation; completion auto-updates project status. |
| **Per-stage parts workspace** | ✅ Implemented | AI-generated part categories stored per project; users can mark owned items, edit categories, and regenerate supplier suggestions with imagery. |
| **Real-time availability polling** | 🚧 Planned | Edge function + React Query pipeline defined but not yet wired to UI listings. |
| **Milestone/build tracking** | 🚧 Planned | Schema exists; UI & automation still pending. |
| **Supplier-side caching (Redis)** | 🚧 Planned | Described in spec; Redis layer not yet provisioned in codebase. |
| **Edge function refresh jobs** | 🚧 Planned | Scheduled syncs for inventory still to be authored/deployed. |
| **Advanced supplier API integrations** | 🚧 Planned | Digi-Key, Mouser, JLCPCB, PCBWay, LCSC connectors awaiting API key provision and full response normalization. |
| **Observability/logging enhancements** | 🚧 Partial | Basic logging present; structured Supabase log ingestion still outstanding. |

Legend: ✅ Done · 🚧 In progress / pending · ⛔ Not started
