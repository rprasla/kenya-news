import React, { useState, useEffect } from "react";

export default function PersonalNewsApp() {
  const [activeTab, setActiveTab] = useState("nairobi");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a dynamic configuration for your API endpoint
  const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || "https://kenya-news.onrender.com";

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // Points safely to your local Node engine proxy
        const response = await fetch(
          `${BACKEND_URL}/api/news?category=${activeTab}`,
        );

        if (!response.ok)
          throw new Error("Failed to pull news feeds from server.");

        const data = await response.json();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-emerald-800 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            🗺️ East African Personal Dashboard
          </h1>
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-2 pb-2">
          {["nairobi", "kenya", "tanzania", "uganda"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md capitalize transition-colors ${
                activeTab === tab
                  ? "bg-slate-50 text-emerald-900 font-bold"
                  : "text-emerald-100 hover:bg-emerald-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading && (
          <p className="text-center text-slate-500">
            Querying regional streams...
          </p>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-5 bg-white rounded-lg shadow-sm border border-slate-100"
              >
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-emerald-700">
                    {article.source}
                  </span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 hover:text-emerald-700">
                  <a href={article.link} target="_blank" rel="noreferrer">
                    {article.title}
                  </a>
                </h3>
                <p className="text-sm text-slate-600 mt-2">{article.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
