import { useState } from "react";
import { MOCK_RESULTS, type AnalysisResult } from "../mockData";

const REPLACE_WITH_REAL_API = false;
const API_BASE_URL = "http://localhost:8000";

const MOCK_DELAY_MS = 1800; // simulates network latency

export function useAnalyze() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (url: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      if (REPLACE_WITH_REAL_API) {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || `Server error: ${response.status}`);
        }

        const result: AnalysisResult = await response.json();
        setData(result);
      } else {
        await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));

        const result = MOCK_RESULTS["default"];
        setData({
          ...result,
          title: `Analysis of: ${url.slice(0, 60)}${url.length > 60 ? "…" : ""}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { analyze, data, loading, error, reset };
}
