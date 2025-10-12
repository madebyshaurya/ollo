ollo = Hardware? Not so hard.
Main Idea: AI-powered hardware build companion that guides makers from idea to completion.
Key Features
AI Assistant: Suggests components, tools, and materials
Real-Time Availability: Checks part inventories across suppliers
Smart Build Planner: Breaks projects into milestones with progress tracking
Parts Research Automation: Finds alternatives and avoids incompatible/out-of-stock components
Tech Stack
Frontend: Next.js (https://nextjs.org/)
Backend: Supabase (https://supabase.com/)
AI: Vercel AI SDK (https://nextjs.org/)
Auth: Clerk (https://clerk.com/)
AI Strategy
Model: Consider GPT-5 when available.
RAG: Connect AI to real-time parts databases for accurate information
Conversation design: Ask clarifying questions (budget, skill level, timeline) before suggesting components
Safety rails: Validate suggestions to prevent incompatible voltages, incorrect pins, or dangerous combinations
Supplier API Integration
Priority suppliers:
Digi-Key (comprehensive API, excellent documentation)
Mouser Electronics (wide selection, good API)
LCSC/JLCPCB (affordable, popular with makers)
Adafruit (beginner-friendly, well-documented parts)
SparkFun (maker-focused, great tutorials)
API features: Real-time inventory, pricing, parametric search, datasheets, alternative parts
Technical Implementation
Frontend:
Add Tailwind CSS for styling
Consider shadcn/ui for pre-built components
Implement React Query for data fetching
Backend:
Supabase Edge Functions for serverless API endpoints
PostgreSQL with proper indexing for parts database
Redis caching for frequently accessed parts data
AI Infrastructure:
Vercel AI SDK with streaming responses
Token usage tracking to manage costs
Database Schema:
Users & authentication (Clerk)
Projects (milestones, status, metadata)
Components (cached from supplier APIs)
Build logs & journal entries
AI conversation history
MVP Strategy (4-6 weeks)
Target: 100 email signups before building full product
MVP Features:
AI chat interface for project planning
Basic parts search (2-3 supplier integrations: Digi-Key, Mouser, LCSC)
Simple project creation and milestone tracking
User authentication
Landing Page: Use tagline, key features, and email signup. Drive traffic from maker communities (Reddit r/MechanicalKeyboards, r/AskElectronics, Hackster.io)
Beta Testing: Recruit 10-20 makers from email list. Offer free lifetime access for detailed feedback.
Success Metrics:
Users complete at least one project plan
Average session time > 10 minutes
Users return within 7 days
Net Promoter Score (NPS) > 40


