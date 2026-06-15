import os
import json
import hashlib

from groq import Groq
from dotenv import load_dotenv

from services.cache_service import (
    get_cache,
    set_cache,
)

load_dotenv()

_client = None


def get_client() -> Groq:

    global _client

    if _client is None:

        _client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )

    return _client


def analyze_company(
    company_name: str,
    context: str,
    source: str,
) -> dict:

    cache_key = (
        f"analyze_{company_name}_{source}"
        .lower()
        .replace(" ", "_")
    )

    cached = get_cache(cache_key)

    if cached:

        print(f"Using cached analysis: {company_name}")

        return cached

    prompt = f"""
You are an expert B2B sales intelligence analyst.

Analyze this company.

Company: {company_name}

Source: {source}

Context: {context}

Prioritize:

- startups under 500 employees
- companies founded within 10 years
- pre-seed, seed and Series A startups
- B2B SaaS
- AI startups
- developer tools
- fintech
- healthtech

Avoid:

- FAANG
- public companies
- mature unicorns

Return ONLY valid JSON:

{{
 "industry":"",
 "growth_signal":true,
 "summary":"",
 "outreach_angle":"",
 "why_flagged":""
}}
"""

    try:

        response = (
            get_client()
            .chat
            .completions
            .create(
                model="llama-3.3-70b-versatile",

                messages=[
                    {
                        "role": "user",

                        "content": prompt,
                    }
                ],

                temperature=0.3,

                max_tokens=300,
            )
        )

        text = (
            response
            .choices[0]
            .message.content
            .strip()
        )

        result = json.loads(text)

        set_cache(

            cache_key,

            "groq_analysis",

            result,

            hours=24,
        )

        return result

    except Exception as e:

        print(
            f"Analyze error: {e}"
        )

        return {

            "industry": "Unknown",

            "growth_signal": False,

            "summary": context[:200],

            "outreach_angle": (
                f"{company_name} may benefit from outbound sales support."
            ),

            "why_flagged": source,
        }


def extract_leads_from_text(
    text: str,
    source: str,
) -> list:

    text_hash = hashlib.md5(
        text.encode()
    ).hexdigest()

    cache_key = (
        f"extract_{source}_{text_hash}"
    )

    cached = get_cache(cache_key)

    if cached:

        print(
            "Using cached lead extraction"
        )

        return cached

    prompt = f"""
You are an expert B2B sales intelligence analyst.

Your goal is to discover HIGH-INTENT COMPANIES for a sales agency.

Source:
{source}

Text:
{text}

Extract ONLY companies that satisfy MOST of these:

- startup
- SMB
- under 500 employees
- founded within 10 years
- pre-seed
- seed
- Series A
- recently funded
- hiring SDRs
- hiring Account Executives
- hiring sales teams
- launching products
- expanding markets
- growing quickly

Prioritize:

- B2B SaaS
- AI
- developer tools
- fintech
- healthtech
- cybersecurity

DO NOT include:

Google
Microsoft
Meta
Apple
Amazon
Oracle
Salesforce
Uber
Airbnb
Stripe

Return ONLY a JSON array.

Each object:

{{
 "company_name":"",
 "website":"",
 "industry":"",
 "sales_hiring":false,
 "funding_signal":false,
 "growth_signal":false,
 "why_flagged":"",
 "outreach_angle":""
}}

If none found:

[]
"""

    try:

        response = (
            get_client()
            .chat
            .completions
            .create(
                model="llama-3.3-70b-versatile",

                messages=[
                    {
                        "role": "user",

                        "content": prompt,
                    }
                ],

                temperature=0.2,

                max_tokens=800,
            )
        )

        text_response = (

            response
            .choices[0]
            .message.content
            .strip()
        )

        text_response = (

            text_response

            .replace(
                "```json",
                "",
            )

            .replace(
                "```",
                "",
            )

            .strip()
        )

        leads = json.loads(
            text_response
        )

        if not isinstance(
            leads,
            list,
        ):

            return []

        cleaned = []

        for lead in leads:

            name = lead.get(

                "company_name",

                "",
            ).strip()

            if len(name) < 2:

                continue

            cleaned.append(
                lead
            )

        set_cache(

            cache_key,

            "groq_extract",

            cleaned,

            hours=24,
        )

        return cleaned

    except Exception as e:

        print(
            f"Groq extract error: {e}"
        )

        return []