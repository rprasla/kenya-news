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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/news?category=${activeRegion}&topic=${activeTopic}`,
        );
        if (!response.ok) throw new Error("Failed to load feeds.");
        const data = await response.json();

        // FORCE CHRONOLOGICAL TIMELINE RENDER (Newest First)
        if (Array.isArray(data) && data.length > 0) {
          data.sort((a, b) => b.timestamp - a.timestamp);
        }

        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
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
          <div className="news-grid grid-cols-1 gap-4">
            {/* Find your articles mapping list and wrap it exactly like this */}

            {articles &&
              articles
                .filter((article) => article && article.title) // clear out null objects
                .sort((a, b) => {
                  // Pull whichever timestamp property exists safely
                  const timeA = a.timestamp || a.timeValue || a.rawDate || 0;
                  const timeB = b.timestamp || b.timeValue || b.rawDate || 0;
                  return timeB - timeA; // Strict highest-number-first sorting
                })
                .map((article) => (
                  <div key={article.id} className="news-card">
                    <h3>{article.title}</h3>
                    <span className="meta-tag">
                      {article.source} • {article.date}
                    </span>
                    <p>{article.snippet}</p>
                    <a href={article.link} target="_blank" rel="noreferrer">
                      Read more
                    </a>
                  </div>
                ))}
          </div>
        )}
      </main>
    </div>
  );
}
