import React, { useState, useEffect, useCallback } from "react";
import "./NewsApp.css"; // Styling file configuration link

// Replace this with your exact active Render backend API root link
const BACKEND_URL = "https://your-render-backend-url.onrender.com";

export default function NewsApp() {
  // Navigation Routing States
  const [activeRegion, setActiveRegion] = useState("kenya"); // options: kenya, nairobi, uganda, tanzania
  const [activeTopic, setActiveTopic] = useState("all"); // options: all, politics, business, sports, entertainment

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // MASTER FETCHING ENGINE (NO SORTING IMPLEMENTED)
  const syncLiveNews = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Create a timestamp parameters buster to break past Vercel Edge proxy caching
        const cacheBuster = `&_cb=${Date.now()}`;
        const apiEndpoint = `${BACKEND_URL}/api/news?category=${activeRegion}&topic=${activeTopic}${cacheBuster}`;

        const response = await fetch(apiEndpoint);
        if (!response.ok)
          throw new Error("Synchronization handshake aborted by host.");

        const data = await response.json();

        if (Array.isArray(data)) {
          // 🚫 NO SORTING APPLIED:
          // Data is passed directly into state exactly as structured by your server configuration.
          setArticles(data);
        }
      } catch (err) {
        console.error("Pipeline Communication Error Handled:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeRegion, activeTopic],
  );

  // Hook: Trigger automatic refresh loops whenever the navigation tab shifts
  useEffect(() => {
    syncLiveNews();
  }, [syncLiveNews]);

  return (
    <div className="newsapp-root">
      <header className="newsapp-header">
        <h1>East Africa Newsroom</h1>

        {/* REGIONAL FILTER ACTIONS */}
        <div className="filter-row regions">
          {["kenya", "nairobi", "uganda", "tanzania"].map((region) => (
            <button
              key={region}
              className={`filter-btn ${activeRegion === region ? "selected" : ""}`}
              onClick={() => {
                setActiveRegion(region);
                setActiveTopic("all");
              }}
            >
              {region.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TOPICAL FEED FILTER ACTIONS */}
        <div className="filter-row topics">
          {["all", "politics", "business", "sports", "entertainment"].map(
            (topic) => (
              <button
                key={topic}
                className={`topic-btn ${activeTopic === topic ? "selected" : ""}`}
                onClick={() => setActiveTopic(topic)}
              >
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </button>
            ),
          )}
        </div>
      </header>

      {/* PULL TO REFRESH INTERACTIVE ACTION ANCHOR */}
      <div className="sync-action-container">
        <button
          onClick={() => syncLiveNews(true)}
          className={`sync-trigger ${refreshing ? "syncing" : ""}`}
          disabled={loading || refreshing}
        >
          {refreshing
            ? "🔄 Fetching Feed Updates..."
            : "👇 Pull/Click to Sync Headlines"}
        </button>
      </div>

      <main className="feed-viewport">
        {/* STRUCTURAL SKELETON LOADERS */}
        {loading && !refreshing && (
          <div className="viewport-grid layout-shimmer">
            {[1, 2, 3].map((placeholderKey) => (
              <div key={placeholderKey} className="shimmer-card-wireframe" />
            ))}
          </div>
        )}

        {/* RECOVERY EXCEPTION BANNER */}
        {error && (
          <div className="error-diagnostic-panel">
            <h3>Network Outage Detected</h3>
            <p>{error}</p>
            <button onClick={() => syncLiveNews()}>
              Retry Connection Handshake
            </button>
          </div>
        )}

        {/* CORE STREAM INTERFACE */}
        {!loading && !error && (
          <div className="viewport-grid">
            {articles.map((article) => (
              <article key={article.id} className="interactive-news-card">
                <div className="card-top-metadata">
                  <span className="pill-tag-source">{article.source}</span>
                  <span className="text-tag-date">{article.date}</span>
                </div>
                <h3 className="headline-title-text">{article.title}</h3>
                <p className="body-summary-snippet">{article.snippet}</p>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="card-navigation-link"
                >
                  Read Full Coverage →
                </a>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
