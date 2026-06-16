import React, { useState, useEffect } from "react";

const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "https://kenya-news.onrender.com";

const REGIONS = ['nairobi', 'kenya', 'tanzania', 'uganda'];
const TOPICS = [
  { id: 'all', label: '📰 All News' },
  { id: 'politics', label: '⚖️ Politics' },
  { id: 'business', label: '📈 Business' },
  { id: 'sports', label: '⚽ Sports' },
  { id: 'entertainment', label: '🍿 Entertainment' }
];

export default function PersonalNewsApp() {
  const [activeRegion, setActiveRegion] = useState('kenya');
  const [activeTopic, setActiveTopic] = useState('all');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategorizedNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query both regional filters and topic variables simultaneously
        const response = await fetch(
          `${BACKEND_URL}/api/news?category=${activeRegion}&topic=${activeTopic}`
        );
        if (!response.ok) throw new Error("Could not pull specified category feeds.");
        
        const data = await response.json();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finaly {
        setLoading(false);
      }
    };

    fetchCategorizedNews();
  }, [activeRegion, activeTopic]); // Re-run if user switches country OR topic

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
              onClick={() => { setActiveRegion(region); setActiveTopic('all'); }} // Reset topic on region switch
              className={`px-4 py-2 text-xs font-bold uppercase rounded-t-lg tracking-wider transition-all ${
                activeRegion === region ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {region}
            </button>
          ))}
        </nav>
      </header>

      {/* Secondary Navbar: Category Sub-Row */}
      <div className="bg-white border-b border-slate-200 sticky top-[92px] z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTopic === topic.id
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Layout */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading && <p className="text-center text-sm py-10 text-slate-400">Filtering specific archives...</p>}
        {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">⚠️ {error}</div>}
        
        {!loading && !error && (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-bold text-amber-600 uppercase tracking-wide">{article.source}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 hover:text-amber-600 leading-snug">
                  <a href={article.link} target="_blank" rel="noreferrer">{article.title}</a>
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{article.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
