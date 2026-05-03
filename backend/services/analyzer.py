from sklearn.feature_extraction.text import TfidfVectorizer

def extract_keywords(text: str, top_k: int = 50):
    if not text.strip():
        return []

    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    X = vectorizer.fit_transform([text])

    scores = X.toarray()[0]
    terms = vectorizer.get_feature_names_out()

    ranked = list(zip(terms, scores))
    ranked.sort(key=lambda x: x[1], reverse=True)

    return ranked[:top_k]