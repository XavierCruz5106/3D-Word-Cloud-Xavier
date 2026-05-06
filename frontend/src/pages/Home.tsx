import { useState } from "react";
import { useAnalyze } from "../hooks/useAnalyze";
import { WordCloudCanvas } from "../features/wordCloud/WordCloudCanvas";
import { SAMPLE_URLS } from "../mockData";

export default function Home() {
  const [url, setUrl] = useState("");
  const { analyze, data, loading, error, reset } = useAnalyze();

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    analyze(trimmed);
  };

  const handleSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    analyze(sampleUrl);
  };

  const handleReset = () => {
    reset();
    setUrl("");
  };

  return (
    <div className="page">
        {/*Some cool gradient stuff */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      {!data && !loading && (
        <div className="panel glass-panel input-panel">
          <div className="logo-area">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="rgba(200,168,255,0.6)" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="10" stroke="rgba(200,168,255,0.4)" strokeWidth="1" />
                <circle cx="20" cy="20" r="3" fill="rgba(224,208,255,0.9)" />
                <ellipse cx="20" cy="20" rx="18" ry="6" stroke="rgba(168,216,255,0.35)" strokeWidth="1" transform="rotate(30 20 20)" />
                <ellipse cx="20" cy="20" rx="18" ry="6" stroke="rgba(168,216,255,0.25)" strokeWidth="1" transform="rotate(-30 20 20)" />
              </svg>
            </div>
            <h1 className="logo-title">Buzzfinder</h1>
            <p className="logo-sub">Article Topic Visualizer</p>
          </div>

          <div className="input-group">
            <input
              type="url"
              className="url-input glass-input"
              placeholder="Paste an article URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              spellCheck={false}
            />
            <button
              className="analyze-btn glass-btn"
              onClick={handleSubmit}
              disabled={!url.trim()}
            >
              <span>Visualize</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="error-msg">
              <span>⚠ {error}</span>
            </div>
          )}

          <div className="samples">
            <p className="samples-label">Try a sample</p>
            <div className="sample-chips">
              {SAMPLE_URLS.map((s: any) => (
                <button
                  key={s}
                  className="chip glass-chip"
                  onClick={() => handleSample(s)}
                >
                  {new URL(s).hostname.replace("www.", "")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="panel glass-panel loading-panel">
          <div className="loader-orb">
            <div className="orb-ring ring-1" />
            <div className="orb-ring ring-2" />
            <div className="orb-ring ring-3" />
            <div className="orb-core" />
          </div>
          <p className="loading-text">Analyzing article…</p>
          <p className="loading-sub">Extracting topics & themes</p>
        </div>
      )}

      {data && !loading && (
        <div className="result-layout">
          <div className="canvas-area">
            <WordCloudCanvas topics={data.topics} />
          </div>

          <div className="info-overlay">
            <div className="glass-panel info-panel">
              <button className="back-btn glass-chip" onClick={handleReset}>
                ← New article
              </button>
              <h2 className="result-title">{data.title}</h2>
              {data.summary && (
                <p className="result-summary">{data.summary}</p>
              )}

              <div className="legend">
                <p className="legend-label">Topics ({data.topics.length})</p>
                <div className="topic-pills">
                  {data.topics.slice(0, 8).map((t: any) => (
                    <span
                      key={t.word}
                      className="topic-pill"
                      style={{
                        fontSize: `${0.7 + t.weight * 0.3}rem`,
                        opacity: 0.55 + t.weight * 0.45,
                      }}
                    >
                      {t.word}
                    </span>
                  ))}
                  {data.topics.length > 8 && (
                    <span className="topic-pill more-pill">
                      +{data.topics.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
