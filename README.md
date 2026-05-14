# Job Done

An AI-powered interview readiness platform that tells you exactly where you stand before the interview — and helps you close the gap.

**Live demo:** [job-done-five.vercel.app](https://job-done-five.vercel.app)

**Presentation:** https://drive.google.com/file/d/1jpZN9eTr7n7ZQfBydYLi9ctdHJ9lI5ld/view?usp=sharing

---

## What it does

### ⚡ Quick Score
Upload your resume, fill in your details, and get an honest **Interview Readiness Score (0–100)** in under 2 minutes. Powered by Groq's Llama 3.3 70B.

- Score from 0–100 with Beginner / Intermediate / Expert classification
- 3-sentence honest summary of your current standing
- Personalised 30-day action roadmap with specific, actionable steps

### 🎯 Interview Prep
A full company-targeted preparation flow:

1. **Profile** — fill in your details, select a target role from a dropdown, upload your resume
2. **Company** — choose from companies filtered by your selected role
3. **Aptitude Check** — 5 MCQs unique to the selected company (e.g. Google gets MapReduce/PageRank questions, Razorpay gets payment/PCI-DSS questions)
4. **AI Suggestions** — resume changes, LinkedIn tips, GitHub improvements, key skills, and interview focus areas tailored to that company
5. **Virtual Interview** — AI speaks each question aloud, your camera turns on, you answer via speech-to-text with a 90-second timer per question
6. **Results** — per-question answer feedback, posture score, eye contact score, and missed key points

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Supabase (OTP email — 6-digit code) |
| Database | Supabase Postgres + Row Level Security |
| AI | Groq API — `llama-3.3-70b-versatile` |
| PDF parsing | `pdf-parse` (Node.js native) |
| Speech | Web Speech API (browser-native TTS + STT) |
| Deployment | Vercel |

---

## Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- A [Groq](https://console.groq.com) API key (free tier — no credit card)

### 1. Clone and install

```bash
git clone https://github.com/rijulmenon/job-done.git
cd job-done
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

- Supabase keys: Project Settings → API
- Groq key: [console.groq.com](https://console.groq.com) → API Keys → Create key

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor. This creates the `evaluations` table with Row Level Security policies.

### 4. Configure Supabase email OTP

In your Supabase dashboard → **Authentication → Email Templates → Magic Link**, replace the body with:

```html
<h2>Your Job Done login code</h2>
<p>Enter this code to sign in:</p>
<h1 style="letter-spacing: 8px; font-size: 36px;">{{ .Token }}</h1>
<p>This code expires in 10 minutes.</p>
```

For production email delivery, configure a custom SMTP provider (e.g. [Resend](https://resend.com) or Gmail) in Authentication → SMTP Settings.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

The app is deployed on Vercel. To deploy your own instance:

```bash
npx vercel
```

Add the three environment variables in **Vercel → Project → Settings → Environment Variables**.

---

## Project structure

```
app/
├── api/
│   ├── evaluate/          # Quick Score AI evaluation (Groq)
│   ├── evaluate-answers/  # Virtual interview answer scoring (Groq)
│   ├── parse-pdf/         # PDF text extraction (pdf-parse)
│   └── prep-suggestions/  # Company-specific AI suggestions (Groq)
├── auth/callback/         # Supabase OTP callback handler
├── dashboard/             # Dashboard with sidebar (Quick Score, Interview Prep, History)
├── evaluate/              # Public evaluate page
├── login/                 # OTP sign-in / sign-up
└── page.tsx               # Landing page

components/
├── ScoreCard.tsx          # Score visualisation component
└── LogoutButton.tsx

lib/
├── evaluate.ts            # Groq evaluation logic
├── types.ts               # Shared TypeScript types
└── supabase/              # Supabase client, server, middleware helpers

supabase/
└── schema.sql             # Database schema + RLS policies
```

---

## Roles and companies

| Role | Companies |
|------|-----------|
| Software Engineer | Google, Microsoft, Amazon, Meta, Flipkart, Atlassian, Uber, Razorpay |
| Data Scientist | Google, Amazon, Netflix, Adobe, Walmart Labs, Mu Sigma, Fractal Analytics |
| Product Manager | Google, Microsoft, Amazon, Flipkart, Swiggy, CRED, Razorpay, Zepto |
| Frontend Developer | Google, Meta, Atlassian, Zomato, Swiggy, Adobe, Salesforce |
| DevOps / SRE | Google, Amazon, Microsoft, Netflix, Atlassian, Uber, Infosys |
| ML Engineer | Google, Meta, Amazon, Microsoft, Adobe, Fractal Analytics, Mu Sigma |
| Business Analyst | TCS, Infosys, Wipro, Accenture, Deloitte, Amazon, Flipkart |

---

## License

MIT
