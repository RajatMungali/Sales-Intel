# Sales Intel - AI Lead Discovery Platform

AI-powered platform that discovers high-intent companies likely to need sales outreach services.

## Architecture

```
Greenhouse/Lever APIs  ──┐
TechCrunch/YC RSS      ──┼──▶ FastAPI (Python) ──▶ Groq AI ──▶ Supabase ──▶ React Dashboard
Manual Refresh Webhook ──┘
```

## Stack
- **Backend:** FastAPI + Python (hosted on Render)
- **AI:** Groq (llama3-8b-8192) for enrichment + intent analysis
- **Database:** Supabase (PostgreSQL)
- **Frontend:** React + Vite + Tailwind (hosted on Vercel)

---

## Setup

### 1. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run `backend/schema.sql`
3. Copy your project URL and anon key

### 2. Groq
1. Get free API key at [console.groq.com](https://console.groq.com)

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in your keys in .env

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

npm install
npm run dev
```

---

## Deploy

### Backend → Render (free)
1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY)

### Frontend → Vercel (free)
1. Import repo on [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Add env var: `VITE_API_URL=https://your-render-app.onrender.com`

---

## How It Works

### Workflow 1: Hiring Signal Discovery
- Fetches jobs from Greenhouse and Lever public APIs
- Detects SDR/BDR/AE/sales hiring keywords
- Sends to Groq for industry detection and outreach angle generation
- Score: +40 for sales hiring, +25 if growth signal detected

### Workflow 2: Funding Signal Discovery
- Parses TechCrunch and YC RSS feeds
- Extracts company names from funding headlines
- Groq enriches with industry, growth signals, outreach angle
- Score: +35 for funding, +25 if growth detected

### Intent Scoring
| Signal | Score |
|--------|-------|
| Sales Hiring | +40 |
| Recent Funding | +35 |
| Growth Signal | +25 |
| **Total** | **100** |

| Score | Tier |
|-------|------|
| 80-100 | 🔥 Hot |
| 50-79 | ⚡ Warm |
| 0-49 | ❄️ Cold |

---

## V1 Scope (Built)
- Hiring signal discovery (Greenhouse + Lever)
- Funding signal discovery (TechCrunch + YC RSS)
- AI enrichment via Groq
- Intent scoring + lead tiers
- React dashboard with filters/sort/search
- Manual refresh button
- Lead detail drawer

## V2 Roadmap
- Contact discovery (LinkedIn, Apollo integration)
- More signals: job descriptions, Twitter/X mentions, G2 reviews
- Scheduled auto-refresh (APScheduler)
- Email outreach generation
- ICP-based filtering
- Webhook alerts for new Hot leads
- Multi-agent research pipeline
