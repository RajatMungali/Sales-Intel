import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client = None

def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")
        _client = create_client(url, key)
    return _client

def upsert_company(data: dict):
    client = get_client()
    # Upsert by company_name to avoid duplicates
    result = client.table("companies").upsert(data, on_conflict="company_name").execute()
    return result

def get_all_companies():
    client = get_client()
    result = client.table("companies").select("*").order("intent_score", desc=True).execute()
    return result.data
