import React, { useState, useEffect } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://kenya-news.onrender.com";

const REGIONS = ["nairobi", "kenya", "tanzania", "uganda"];
const TOPICS = [
  { id: "all", label: "📰 All News" },
  { id: "politics", label: "⚖️ Politics" },
  { id: "business", label: "📈 Business" },
  { id: "sports", label: "⚽ Sports" },
  { id: "entertainment", label: "🍿 Entertainment" },
];

export default function PersonalNewsApp() {
  const [activeRegion, setActiveRegion] = useState("kenya");
  const [activeTopic, setActiveTopic] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNews = async () => {
      setLoading(true);
      try {
        // Append a cache-buster parameter to smash past Vercel's Edge server memory saving
        const response = await fetch(
          `${BACKEND_URL}/api/news?category=${activeRegion}&topic=${activeTopic}&_cb=${Date.now()}`,
        );
        if (!response.ok) throw new Error("Failed to pull raw feeds.");
        const data = await response.json();

        if (isMounted && Array.isArray(data)) {
          // 🛠️ UNIVERSAL STRING-TO-DATE CONVERTER SORTING ENGINE
          const correctlyOrderedNews = [...data].sort((a, b) => {
            // Helper function to turn strings like "11:45 AM - 7/8/2026" back into numeric milliseconds
            const getNumericMs = (articleObj) => {
              if (!articleObj) return 0;

              // If the backend already sends a valid timestamp property, use it immediately
              if (articleObj.timestamp && !isNaN(articleObj.timestamp))
                return Number(articleObj.timestamp);
              if (articleObj.timeValue && !isNaN(articleObj.timeValue))
                return Number(articleObj.timeValue);

              // If it only sends the string, parse it manually:
              if (articleObj.date && typeof articleObj.date === "string") {
                // Splits "11:45 AM - 7/8/2026" into ["11:45 AM", "7/8/2026"]
                const dateParts = articleObj.date.split(" - ");
                if (dateParts.length === 2) {
                  const timeString = dateParts[0].trim(); // "11:45 AM"
                  const dayString = dateParts[1].trim(); // "7/8/2026"

                  const combinedParsedMs = Date.parse(
                    `${dayString} ${timeString}`,
                  );
                  if (!isNaN(combinedParsedMs)) return combinedParsedMs;
                }

                // Fallback parse attempt for single raw date string objects
                const genericParsedMs = Date.parse(articleObj.date);
                if (!isNaN(genericParsedMs)) return genericParsedMs;
              }

              return 0; // Absolute fallback for entries with corrupted indices
            };

            // Subtract absolute milliseconds (Highest value/Newest timestamp moves to index 0)
            return getNumericMs(b) - getNumericMs(a);
          });

          setArticles(correctlyOrderedNews);
        }
      } catch (err) {
        console.error("Layout chronological sorting failure:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
    };
  }, [activeRegion, activeTopic]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Primary Top Bar: Countries */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">🌍 East Africa Custom Brief</h1>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 pb-1 overflow-x-auto">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => {
                setActiveRegion(region);
                setActiveTopic("all");
              }} // Reset topic on region switch
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-lg tracking-wider transition-all ${
                activeRegion === region
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {region}
            </button>
          ))}
        </nav>
      </header>

      {/* Secondary Navbar: Category Sub-Row */}
      <div className="bg-white border-b border-slate-200 sticky top-[88px] z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTopic === topic.id
                  ? "bg-slate-800 border-slate-800 text-white"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Layout */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading && (
          <p className="text-center text-sm py-10 text-slate-400">
            Filtering specific archives...
          </p>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-bold text-amber-600 uppercase tracking-wide">
                    {article.source}
                  </span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 hover:text-amber-600 leading-snug">
                  <a href={article.link} target="_blank" rel="noreferrer">
                    {article.title}
                  </a>
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {article.snippet}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
