export interface WordTopic {
  word: string;
  weight: number; // 0–1 (controls size, brightness, orbit radius)
  category?: string; // optional grouping for color
}

export interface AnalysisResult {
  title: string;
  summary: string;
  topics: WordTopic[];
}

export const MOCK_RESULTS: Record<string, AnalysisResult> = {
  default: {
    title: "AI & Technology Trends",
    summary: "Analysis of current trends in artificial intelligence, machine learning, and their impact on society.",
    topics: [
      { word: "Artificial Intelligence", weight: 1.0, category: "core" },
      { word: "Machine Learning", weight: 0.88, category: "core" },
      { word: "Neural Networks", weight: 0.82, category: "core" },
      { word: "Deep Learning", weight: 0.76, category: "tech" },
      { word: "Large Language Models", weight: 0.74, category: "core" },
      { word: "Automation", weight: 0.68, category: "impact" },
      { word: "Data Privacy", weight: 0.65, category: "ethics" },
      { word: "Open Source", weight: 0.60, category: "tech" },
      { word: "Regulation", weight: 0.58, category: "ethics" },
      { word: "Silicon Valley", weight: 0.54, category: "geo" },
      { word: "Startups", weight: 0.50, category: "business" },
      { word: "GPU", weight: 0.48, category: "tech" },
      { word: "Robotics", weight: 0.46, category: "tech" },
      { word: "Ethics", weight: 0.44, category: "ethics" },
      { word: "Cloud Computing", weight: 0.42, category: "tech" },
      { word: "Quantum", weight: 0.38, category: "tech" },
      { word: "Bias", weight: 0.36, category: "ethics" },
      { word: "Inference", weight: 0.34, category: "tech" },
      { word: "Venture Capital", weight: 0.32, category: "business" },
      { word: "Sustainability", weight: 0.30, category: "impact" },
    ],
  },
};

export const SAMPLE_URLS = [
  "https://www.bbc.com/news/articles/c9dl90lg91do",
  "https://techcrunch.com/2025/04/15/ai-regulation-2025/",
  "https://www.theverge.com/ai-artificial-intelligence",
  "https://www.wired.com/story/what-is-artificial-intelligence/",
];
