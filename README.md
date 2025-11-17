
# ollo 🔧 ⚡

I made ollo becuase of the struggles I had when I started doing hardware. I am making ollo to smoothen out that experience and help beginners with their hardware imaginations.

---

![alt text](image.png)

## Features
⏳ = Coming soon

- **🤖 AI-Powered Project Planning** - When making new project we ask relevant questions for your project.
- **📦 Smart Parts Recommendations** - Real-time component pricing from global suppliers using Firecrawl + AI
- **🔍 Intelligent Parts Search** - Search across multiple electronics suppliers based on your location
- **🔄 Alternative Components Finder** - AI-powered suggestions for compatible alternative parts
- **🎯 Context-Aware AI** - Remembers your project details for personalized suggestions
- **⏳ ⚡ Real-time Updates** - Live project status and progress tracking

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack)
- **UI/Styling:** Tailwind CSS 4, Radix UI, Motion
- **Authentication:** Clerk
- **Database:** Supabase
- **AI:** OpenAI GPT-4o Mini & GPT-5 Nano (via AI SDK), Google Gemini 2.5 Flash
- **Web Scraping:** Firecrawl (for real-time parts pricing)
- **Type Safety:** TypeScript 5 + Zod

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm/bun
- Clerk account
- Supabase project
- OpenAI API key
- Firecrawl API key (for parts pricing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/madebyshaurya/ollo.git
cd ollo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
FIRECRAWL_API_KEY=
NEXT_PUBLIC_APP_URL=
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Project Structure

```
ollo/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI primitives
│   ├── dashboard/        # Dashboard-specific
│   └── settings/         # Settings components
├── lib/                   # Utilities & services
│   ├── actions/          # Server actions
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
└── types/                 # TypeScript types
```



---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o Mini & GPT-5 Nano |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key for Gemini 2.5 Flash |
| `FIRECRAWL_API_KEY` | Firecrawl API key for web scraping parts suppliers |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

---

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

Built by [@madebyshaurya](https://x.com/madebyshaurya)

---

**Made with ❤️ & 🥤**
