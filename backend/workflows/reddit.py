import httpx
from datetime import datetime
from services.groq_client import extract_leads_from_text
from services.supabase_client import upsert_company
from workflows.scorer import calculate_score, get_lead_tier

SUBREDDITS = [
    # Global startup/business
    "startups",
    "entrepreneur",
    "SaaS",
    "smallbusiness",
    "growmybusiness",
    "B2Bsales",
    "sales",
    "leadgeneration",
    "digital_marketing",
    "marketing",
    "agency",
    "business",
    "venturecapital",
    "startup_ideas",

    # India focused
    "indiabusiness",
    "indianstartups",
    "india_entrepreneur",
    "IndiaInvestments",
    "IndiaTech",
    "delhi",
    "bangalore",
    "mumbai",
    "hyderabad",
    "Chennai",
    "pune",
]

SIGNAL_KEYWORDS = [
    "hiring", "sales", "outbound", "leads", "pipeline",
    "revenue", "funding", "raised", "growth", "scaling",
    "customers", "marketing", "outreach", "SDR", "BDR",
    # India specific
    "crore", "lakh", "seed funding", "angel investor",
    "startup india", "bootstrapped", "b2b", "saas india",
]

def is_relevant_post(title: str, selftext: str) -> bool:
    text = (title + " " + selftext).lower()
    return any(kw in text for kw in SIGNAL_KEYWORDS)

async def fetch_subreddit_posts(subreddit: str) -> list:
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit=25"
    headers = {"User-Agent": "SalesIntelBot/1.0"}
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                data = r.json()
                return data.get("data", {}).get("children", [])
        except Exception as e:
            print(f"Reddit fetch error for r/{subreddit}: {e}")
    return []

async def run_reddit_workflow() -> list:
    results = []
    seen = set()

    for subreddit in SUBREDDITS:
        try:
            posts = await fetch_subreddit_posts(subreddit)

            for post in posts:
                post_data = post.get("data", {})
                title = post_data.get("title", "")
                selftext = post_data.get("selftext", "")[:800]
                author = post_data.get("author", "")
                url = f"https://reddit.com{post_data.get('permalink', '')}"

                if not is_relevant_post(title, selftext):
                    continue

                # Use Groq to extract company + signals from post
                context = f"Subreddit: r/{subreddit}\nTitle: {title}\nPost: {selftext}"
                leads = extract_leads_from_text(context, source=f"Reddit r/{subreddit}")

                for lead in leads:
                    name = lead.get("company_name")
                    if not name or name in seen or name.lower() in ["my company", "our company", "a company", "the company"]:
                        continue
                    seen.add(name)

                    score = calculate_score(
                        sales_hiring=lead.get("sales_hiring", False),
                        funding_signal=lead.get("funding_signal", False),
                        growth_signal=lead.get("growth_signal", False),
                    )
                    tier = get_lead_tier(score)

                    record = {
                        "company_name": name,
                        "website": lead.get("website",""),
                        "industry": lead.get("industry", "Unknown"),
                        "source": f"Reddit r/{subreddit}",
                        "sales_hiring": lead.get("sales_hiring", False),
                        "funding_signal": lead.get("funding_signal", False),
                        "growth_signal": lead.get("growth_signal", False),
                        "intent_score": score,
                        "lead_tier": tier,
                        "reason": lead.get("why_flagged", title[:200]),
                        "outreach_angle": lead.get("outreach_angle", ""),
                        "created_at": datetime.utcnow().isoformat(),
                        "source_url": url,
                    }
                    upsert_company(record)
                    results.append(record)

        except Exception as e:
            print(f"Reddit workflow error for r/{subreddit}: {e}")
            continue

    return results
