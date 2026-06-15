def calculate_score(
    sales_hiring: bool = False,
    funding_signal: bool = False,
    growth_signal: bool = False,
):
    score = 0

    if sales_hiring:
        score += 40

    if funding_signal:
        score += 35

    if growth_signal:
        score += 25

    return min(score, 100)


def get_lead_tier(score: int) -> str:
    if score >= 80:
        return "Hot"

    if score >= 50:
        return "Warm"

    return "Cold"