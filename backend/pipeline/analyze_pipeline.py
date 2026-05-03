from services.crawler import fetch_article
from services.cleaner import clean_text
from services.analyzer import extract_keywords
from models.response import AnalyzeResponse, WordTopic

def generate_summary(text: str) -> str:
    # lightweight extractive summary
    sentences = text.split(". ")
    return ". ".join(sentences[:3]) if sentences else ""

def run_analysis(url: str) -> AnalyzeResponse:
    try:
        raw = fetch_article(url)
    except Exception:
        raw = ""

    cleaned = clean_text(raw) if raw else ""

    keywords = extract_keywords(cleaned)

    topics = [
        WordTopic(word=w, weight=float(s), category="default")
        for w, s in keywords if s > 0
    ]

    # normalize weights → 0–1 (important for orbit system)
    if topics:
        max_w = max(t.weight for t in topics)
        if max_w > 0:
            for t in topics:
                t.weight = t.weight / max_w

    summary = generate_summary(cleaned)

    return AnalyzeResponse(
        title=url,
        summary=summary,
        topics=topics
    )