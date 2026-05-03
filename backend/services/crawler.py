import requests
from bs4 import BeautifulSoup

def fetch_article(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0"}

    res = requests.get(url, headers=headers, timeout=10)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    article = soup.find("article")

    if article:
        return article.get_text(separator=" ")

    return soup.get_text(separator=" ")