import os
import httpx

from datetime import datetime, timedelta

from dotenv import load_dotenv

from services.groq_client import extract_leads_from_text

from services.supabase_client import upsert_company

from services.cache_service import (
    get_cache,
    set_cache,
)

from workflows.scorer import (
    calculate_score,
    get_lead_tier,
)

load_dotenv()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")


SEARCH_QUERIES = [

    # Funding

    "pre-seed startup funding",

    "seed startup funding",

    "early stage startup funding",

    "startup raised $1 million",

    "startup raised $2 million",

    "startup raised $3 million",

    "angel investment startup",

    # Hiring

    "startup hiring SDR",

    "startup hiring account executive",

    "startup hiring sales team",

    # Growth

    "startup expanding to new markets",

    "startup launches product",

    "startup opening new office",

    # B2B SaaS

    "B2B SaaS startup funding",

    "AI startup seed funding",

    "developer tools startup funding",

    # India

    "Indian startup seed funding",

    "Indian SaaS startup funding",

    "startup india funding",

    # Marketing agency

    "startup needs marketing",

    "startup growth marketing",

    "startup launch marketing agency",

]


EXCLUDE_TERMS = [

    "series b",

    "series c",

    "series d",

    "series e",

    "billion",

    "$100m",

    "$200m",

    "$300m",

    "$500m",

    "$1b",

    "unicorn",

    "ipo",

    "public offering",

    "acquisition",

    "acquires",

    "acquired by",

    "merger",

    "valuation of $",

]


def is_large_company(
    title: str,
    description: str,
) -> bool:

    text = (
        title
        + " "
        + description
    ).lower()

    return any(

        term in text

        for term in EXCLUDE_TERMS

    )


async def fetch_news(
    query: str
) -> list:

    if not NEWSAPI_KEY:

        print(
            "No NEWSAPI_KEY found"
        )

        return []

    cache_key = (

        f"news_{query}"

        .lower()

        .replace(" ", "_")

    )

    cached = get_cache(
        cache_key
    )

    if cached:

        print(
            f"Using cached news: {query}"
        )

        return cached

    from_date = (

        datetime.utcnow()

        - timedelta(days=30)

    ).strftime(
        "%Y-%m-%d"
    )

    url = (
        "https://newsapi.org/v2/everything"
    )

    params = {

        "q": query,

        "from": from_date,

        "sortBy": "publishedAt",

        "language": "en",

        "pageSize": 10,

        "apiKey": NEWSAPI_KEY,

    }

    async with httpx.AsyncClient(
        timeout=15
    ) as client:

        try:

            response = await client.get(

                url,

                params=params,

            )

            if response.status_code == 200:

                articles = (

                    response.json()

                    .get(

                        "articles",

                        []

                    )
                )

                set_cache(

                    cache_key,

                    "newsapi",

                    articles,

                    hours=6,

                )

                return articles

            print(

                f"NewsAPI error: "

                f"{response.status_code}"

            )

        except Exception as e:

            print(

                f"NewsAPI fetch error: {e}"

            )

    return []


async def run_newsapi_workflow() -> list:

    results = []

    seen = set()

    for query in SEARCH_QUERIES:

        try:

            articles = await fetch_news(
                query
            )

            for article in articles:

                title = article.get(
                    "title",
                    "",
                )

                description = (
                    article.get(
                        "description",
                        "",
                    )
                    or ""
                )

                content = (
                    article.get(
                        "content",
                        "",
                    )
                    or ""
                )

                source_name = (

                    article.get(

                        "source",

                        {},

                    )

                    .get(

                        "name",

                        "News",

                    )
                )

                article_url = (

                    article.get(

                        "url",

                        "",

                    )
                )

                if is_large_company(

                    title,

                    description,

                ):

                    continue

                text = f"""
Title: {title}

Description: {description}

Content: {content[:600]}
"""

                leads = extract_leads_from_text(

                    text,

                    source=(
                        f"NewsAPI - {source_name}"
                    ),

                )

                for lead in leads:

                    name = lead.get(
                        "company_name"
                    )

                    if (

                        not name

                        or name in seen

                        or name.lower()

                        in [

                            "my company",

                            "our company",

                            "a company",

                        ]

                    ):

                        continue

                    seen.add(
                        name
                    )

                    score = calculate_score(

                        sales_hiring=lead.get(

                            "sales_hiring",

                            False,

                        ),

                        funding_signal=lead.get(

                            "funding_signal",

                            False,

                        ),

                        growth_signal=lead.get(

                            "growth_signal",

                            False,

                        ),

                    )

                    tier = get_lead_tier(
                        score
                    )

                    record = {

                        "company_name": name,

                        "website": lead.get(

                            "website",

                            "",

                        ),

                        "source_url": article_url,

                        "industry": lead.get(

                            "industry",

                            "Unknown",

                        ),

                        "source": "NewsAPI",

                        "sales_hiring": lead.get(

                            "sales_hiring",

                            False,

                        ),

                        "funding_signal": lead.get(

                            "funding_signal",

                            False,

                        ),

                        "growth_signal": lead.get(

                            "growth_signal",

                            False,

                        ),

                        "intent_score": score,

                        "lead_tier": tier,

                        "reason": lead.get(

                            "why_flagged",

                            title[:200],

                        ),

                        "outreach_angle": lead.get(

                            "outreach_angle",

                            "",

                        ),

                        "created_at": datetime.utcnow().isoformat(),

                    }

                    upsert_company(
                        record
                    )

                    results.append(
                        record
                    )

        except Exception as e:

            print(

                f"NewsAPI workflow error "

                f"for '{query}': {e}"

            )

            continue

    return results