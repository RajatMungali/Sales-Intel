from services.cache_service import (
    get_cache,
    set_cache,
)
import feedparser

import re
from datetime import datetime
from services.groq_client import analyze_company
from services.supabase_client import upsert_company
from workflows.scorer import calculate_score, get_lead_tier

RSS_FEEDS = [
    # Global
    "https://techcrunch.com/category/startups/feed/",
    "https://techcrunch.com/tag/funding/feed/",
    "https://www.ycombinator.com/blog/rss.xml",

    # Early-stage launches
    "https://www.producthunt.com/feed",
    "https://news.ycombinator.com/rss",

    # Smaller startups
    "https://www.eu-startups.com/feed/",
    "https://betakit.com/feed/",
    "https://yourstory.com/feed",
    "https://inc42.com/feed/",

    # VC ecosystem
    "https://www.sifted.eu/feed",
    "https://venturebeat.com/category/ai/feed/",
]

NEWS_DOMAINS = [
    "techcrunch.com", "ycombinator.com", "producthunt.com",
    "venturebeat.com", "sifted.eu", "betakit.com", "yourstory.com",
    "inc42.com", "eu-startups.com", "news.ycombinator.com",
    "reddit.com", "twitter.com", "linkedin.com", "bloomberg.com",
    "forbes.com", "businessinsider.com", "wsj.com", "reuters.com",
]

FUNDING_KEYWORDS = [
    "pre-seed",
    "seed",
    "series a",
    "angel investment",
    "funding",
    "raised",
    "backed by",
    "launches",
    "expanding",
    "hiring",
    "growth",
    "developer tools",
    "AI startup",
    "B2B SaaS",
    "healthtech",
    "fintech",
]

EXCLUDE_KEYWORDS = [
    "series b",
    "series c",
    "series d",
    "series e",
    "billion",
    "$1b",
    "$500m",
    "$300m",
    "$200m",
    "$150m",
    "$100m",
    "unicorn",
    "ipo",
    "public offering",
    "goes public",
    "acquisition",
    "acquires",
    "acquired by",
    "merger",
    "enterprise",
    "valuation of $",
]

EARLY_STAGE_KEYWORDS = [
    "pre-seed",
    "seed",
    "angel",
    "series a",
    "early-stage",
    "early stage",
    "just launched",
    "launches",
    "new startup",
    "founded in 2023",
    "founded in 2024",
    "founded in 2025",
    "founded in 2026",
    "show hn",
    "bootstrapped",
    "first funding",
    "initial funding",
]


def clean_website(url: str, company_name: str) -> str:
    """Reject article/news URLs and fall back to a guessed company homepage."""
    if not url:
        slug = company_name.lower().replace(" ", "")
        return f"https://{slug}.com"
    if any(domain in url for domain in NEWS_DOMAINS):
        slug = company_name.lower().replace(" ", "")
        return f"https://{slug}.com"
    # Make sure it has a protocol
    if not url.startswith("http"):
        url = f"https://{url}"
    return url


def extract_company_from_title(title: str) -> str | None:
    """Try to extract company name from funding article title."""
    patterns = [
        r"^([A-Z][a-zA-Z0-9\s]+?)\s+[Rr]aises",
        r"^([A-Z][a-zA-Z0-9\s]+?)\s+[Ss]ecures",
        r"^([A-Z][a-zA-Z0-9\s]+?)\s+[Cc]loses",
        r"^([A-Z][a-zA-Z0-9\s]+?)\s+[Ll]aunches",
        r"^([A-Z][a-zA-Z0-9\s]+?)\s+[Gg]ets",
    ]
    for p in patterns:
        m = re.match(p, title)
        if m:
            name = m.group(1).strip()
            if len(name) > 2 and len(name) < 40:
                return name
    return None


def is_funding_article(title: str, summary: str) -> bool:
    text = (title + " " + summary).lower()
    return any(kw in text for kw in FUNDING_KEYWORDS)


def is_early_stage(title: str, summary: str) -> bool:
    """Return True only for early-stage / small startups."""
    text = (title + " " + summary).lower()
    if any(kw in text for kw in EXCLUDE_KEYWORDS):
        return False
    return any(kw in text for kw in EARLY_STAGE_KEYWORDS)


async def run_funding_workflow() -> list:

    cache_key = "funding_workflow"

    cached = get_cache(cache_key)

    if cached:

        print("Using cached funding workflow")

        return cached

    results = []

    seen = set()

    for feed_url in RSS_FEEDS:

        try:

            feed = feedparser.parse(feed_url)

            entries = feed.entries[:20]

            for entry in entries:

                title = entry.get(
                    "title",
                    "",
                )

                summary = (
                    entry.get(
                        "summary",
                        "",
                    )[:500]
                )

                link = entry.get(
                    "link",
                    "",
                )

                if not is_funding_article(
                    title,
                    summary,
                ):
                    continue

                if not is_early_stage(
                    title,
                    summary,
                ):
                    continue

                company_name = (
                    extract_company_from_title(
                        title
                    )
                )

                if (

                    not company_name

                    or company_name in seen

                ):

                    continue

                seen.add(
                    company_name
                )

                context = (
                    f"Title: {title}. "
                    f"Summary: {summary}"
                )

                ai = analyze_company(

                    company_name,

                    context,

                    "Funding News",

                )

                score = calculate_score(

                    sales_hiring=False,

                    funding_signal=True,

                    growth_signal=ai.get(

                        "growth_signal",

                        True,

                    ),

                )

                tier = get_lead_tier(
                    score
                )

                record = {

                    "company_name": company_name,

                    "website": clean_website(

                        ai.get(

                            "website",

                            "",

                        ),

                        company_name,

                    ),

                    "industry": ai.get(

                        "industry",

                        "Unknown",

                    ),

                    "source": "TechCrunch/YC RSS",

                    "sales_hiring": False,

                    "funding_signal": True,

                    "growth_signal": ai.get(

                        "growth_signal",

                        True,

                    ),

                    "intent_score": score,

                    "lead_tier": tier,

                    "reason": ai.get(

                        "why_flagged",

                        "Recently funded early-stage startup",

                    ),

                    "outreach_angle": ai.get(

                        "outreach_angle",

                        "",

                    ),

                    "created_at": (
                        datetime.utcnow()
                        .isoformat()
                    ),

                    "source_url": link,

                }

                upsert_company(
                    record
                )

                results.append(
                    record
                )

        except Exception as e:

            print(
                f"RSS error for {feed_url}: {e}"
            )

            continue

    set_cache(

        cache_key,

        "funding",

        results,

        hours=12,

    )

    return results
    