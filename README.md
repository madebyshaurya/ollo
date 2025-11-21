
# ollo 🔧 ⚡

I made ollo because of the struggles I had when I started doing hardware. Ollo smoothens out that experience and helps beginners bring their hardware imaginations to life.

---

![alt text](image.png)

## Features

- **🤖 AI-Powered Project Planning** - Answer dynamic, experience-adaptive questions to get tailored project guidance
- **📦 Smart Parts Recommendations** - AI-powered component suggestions with categorization and sourcing
- **🎯 Context-Aware AI** - Remembers your project details for personalized suggestions throughout your workflow
- **📄 Datasheets & Documentation** - Automatic datasheet fetching via Nexar/Octopart integration with visual previews
- **🔄 Workflow Management** - Guided stages for breadboard prototypes, PCB designs, and custom hardware builds
- **✅ Task Tracking** - Stage-specific tasks and artifact suggestions to keep your project organized
- **🔍 Part Search & Selection** - Search across major suppliers (Mouser, DigiKey, SparkFun, JLCPCB, LCSC, PCBway)
- **💰 Budget Tracking** - Set and monitor project budgets with currency preferences
- **📝 Custom Part Lists** - Add and manage your own components alongside AI suggestions

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, Turbopack)
- **UI/Styling:** Tailwind CSS 4, Radix UI, Motion
- **Authentication:** Clerk
- **Database:** Supabase
- **AI:** OpenAI GPT-5 Nano, Google Gemini 2.5 Flash (via AI SDK)
- **Type Safety:** TypeScript 5

---

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm/yarn/pnpm/bun
- Clerk account
- Supabase project
- OpenAI API key

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
NEXT_PUBLIC_APP_URL=
NEXAR_CLIENT_ID=                     # Optional: Nexar/Octopart client ID for datasheet fetching
NEXAR_CLIENT_SECRET=                 # Optional: Nexar/Octopart client secret
```

1. Run the development server:
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
│   │   ├── ai/           # GPT-5 Nano for metadata generation
│   │   ├── intake/       # Dynamic question generation (Gemini 2.5 Flash)
│   │   ├── parts/        # Part recommendations & search
│   │   └── projects/     # Project workflow management
│   ├── dashboard/         # Dashboard pages
│   │   ├── [id]/         # Project detail & settings
│   │   └── settings/     # User preferences
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # UI primitives (Radix UI)
│   ├── dashboard/        # Dashboard-specific components
│   ├── settings/         # Settings components
│   └── datasheets/       # Datasheet viewer components
├── lib/                   # Utilities & services
│   ├── actions/          # Server actions (projects, context, preferences)
│   ├── services/         # Business logic (parts, datasheets)
│   ├── workflows.ts      # Workflow stage management
│   └── utils.ts          # Helper functions
└── types/                 # TypeScript type definitions
```

---

## How It Works

1. **Create a Project** - Choose between breadboard prototype, PCB design, or custom hardware
2. **Answer Questions** - Respond to AI-generated, experience-adaptive intake questions
3. **Get Recommendations** - Receive AI-powered part suggestions organized by category
4. **Follow Workflows** - Progress through stage-specific tasks and guidance
5. **Search & Select Parts** - Search suppliers and view datasheets with visual previews
6. **Track Progress** - Monitor budget, manage tasks, and advance through workflow stages

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | Application base URL |
| `NEXAR_CLIENT_ID` | Optional: Nexar/Octopart client ID for automatic datasheet fetching |
| `NEXAR_CLIENT_SECRET` | Optional: Nexar/Octopart client secret for automatic datasheet fetching |

---

## Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Key Technologies

- **Next.js 16** with App Router and React Server Components for optimal performance
- **Turbopack** for lightning-fast development and builds
- **OpenAI GPT-5 Nano** for intelligent project metadata generation
- **Google Gemini 2.5 Flash** for adaptive intake question generation via AI SDK
- **Clerk** for secure, production-ready authentication
- **Supabase** with JSONB fields for flexible data modeling
- **Nexar/Octopart** integration for automatic datasheet fetching
- **Radix UI** + **Tailwind CSS 4** for accessible, beautiful components
- **TypeScript 5** for end-to-end type safety

---

## Architecture Highlights

- **Server Actions** for all data mutations with built-in revalidation
- **JSONB Fields** for dynamic part categories and intake answers
- **Workflow System** with three distinct flows (breadboard, PCB, custom)
- **Experience-Adaptive AI** that adjusts question complexity based on user level
- **Row-Level Security** via Supabase with Clerk user ID filtering
- **Webhook-Based Sync** for user lifecycle management

---

## Contributing

This project is feature-complete and stable. For bug reports or feature suggestions, please open an issue.

## License

This project is open source and available under the MIT License.

## Contact

Built by [@madebyshaurya](https://x.com/madebyshaurya)

---

**Made with ❤️ & 🥤**
