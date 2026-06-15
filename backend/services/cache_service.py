from datetime import datetime, timedelta

from services.supabase_client import get_client


def get_cache(cache_key):

    client = get_client()

    response = (

        client

        .table("api_cache")

        .select("*")

        .eq("cache_key", cache_key)

        .gt(

            "expires_at",

            datetime.utcnow().isoformat()

        )

        .execute()

    )

    if response.data:

        return response.data[0]["data"]

    return None


def set_cache(

    cache_key,

    source,

    data,

    hours=6,

):

    client = get_client()

    expires = (

        datetime.utcnow()

        + timedelta(hours=hours)

    ).isoformat()

    client.table(

        "api_cache"

    ).upsert({

        "cache_key": cache_key,

        "source": source,

        "data": data,

        "expires_at": expires,

    }).execute()