# Job Done — Interview Readiness Score

An AI-powered tool that evaluates a candidate's profile and generates an honest **Interview Readiness Score (0–100)**, a category label, a 3-sentence summary, and a 30-day actionable roadmap.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Auth & DB | Supabase (magic link auth + PostgreSQL) |
| AI | Google Gemini 1.5 Flash API |
| Hosting | Vercel |

## Features

- Score 0–100 (FAANG-caliber benchmark)
- Beginner / Intermediate / Expert classification
- 3-sentence honest summary of current standing
- 3 specific, high-impact 30-day action items
- Evaluation history saved per user (Supabase)
- Works without login (no history saved)

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/rijulmenon/job-done
cd job-done
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Get a Gemini API key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create an API key

### 4. Configure environment variables

Copy `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://alulgpenfzgmsbbrdwfg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
XAI_API_KEY=your-grok-api-key
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
vercel --prod
```

Add the three environment variables in your Vercel project settings.

## Project Structure

```
app/
  page.tsx              # Landing page
  evaluate/page.tsx     # Evaluation form + results
  dashboard/page.tsx    # History (authenticated)
  login/page.tsx        # Magic link auth
  api/evaluate/route.ts # POST /api/evaluate → Gemini
  auth/callback/route.ts
components/
  ScoreCard.tsx         # Score display component
  LogoutButton.tsx
lib/
  evaluate.ts           # Gemini API call + prompt
  types.ts              # Shared TypeScript types
  supabase/             # Supabase client/server/middleware
supabase/
  schema.sql            # DB schema + RLS policies
```
