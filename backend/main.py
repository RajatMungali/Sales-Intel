from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from services.supabase_client import get_all_companies
from workflows.reddit import run_reddit_workflow
from workflows.newsapi import run_newsapi_workflow
from workflows.funding import run_funding_workflow
import asyncio

app = FastAPI(title="Sales Intel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://sales-intel-sand.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

refresh_status = {"running": False, "last_run": None, "last_count": 0}

async def run_all_workflows():
    refresh_status["running"] = True
    try:
        reddit_results = await run_reddit_workflow()
        news_results = await run_newsapi_workflow()
        funding_results = await run_funding_workflow()
        total = len(reddit_results) + len(news_results) + len(funding_results)
        refresh_status["last_count"] = total
        from datetime import datetime
        refresh_status["last_run"] = datetime.utcnow().isoformat()
        print(f"Refresh complete: {len(reddit_results)} reddit, {len(news_results)} news, {len(funding_results)} funding leads")
    finally:
        refresh_status["running"] = False

@app.get("/")
def root():
    return {"status": "ok", "message": "Sales Intel API running"}

@app.get("/companies")
def get_companies():
    data = get_all_companies()
    return {"companies": data, "total": len(data)}

@app.post("/refresh")
async def refresh(background_tasks: BackgroundTasks):
    if refresh_status["running"]:
        return {"message": "Refresh already running", "status": "running"}
    background_tasks.add_task(run_all_workflows)
    return {"message": "Refresh started", "status": "started"}

@app.get("/refresh/status")
def get_refresh_status():
    return refresh_status

@app.get("/stats")
def get_stats():
    data = get_all_companies()
    hot = sum(1 for c in data if c.get("lead_tier") == "Hot")
    warm = sum(1 for c in data if c.get("lead_tier") == "Warm")
    cold = sum(1 for c in data if c.get("lead_tier") == "Cold")
    hiring = sum(1 for c in data if c.get("sales_hiring"))
    funding = sum(1 for c in data if c.get("funding_signal"))
    return {
        "total": len(data),
        "hot": hot,
        "warm": warm,
        "cold": cold,
        "hiring_signals": hiring,
        "funding_signals": funding,
    }
