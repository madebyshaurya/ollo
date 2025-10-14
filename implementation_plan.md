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

---

## 4. Data Architecture

| Table         | Key Fields                                                          | More Info   |
|---------------|---------------------------------------------------------------------|-------------|
| users         | id, clerk_id, email, created_at                                     | [Supabase Users](https://supabase.com/docs/guides/auth) |
| projects      | id, user_id, name, description, created_at                          | [Projects Example](https://supabase.com/docs/guides/database/tables) |
| components    | id, supplier_id, part_number, project_id, metadata, datasheet_url, cached_stock, updated_at | [Schema Design](https://supabase.com/docs/guides/database) |
| milestones    | id, project_id, name, deadline, status                              | —           |
| logs          | id, project_id, body, timestamp                                     | —           |
| ai_history    | id, user_id, project_id, input, output, created_at                  | —           |

**Relations:**  
- Users → Projects (1:M)  
- Projects → Components/Milestones/Logs (1:M)  
- AI history is per-user, per-project

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
