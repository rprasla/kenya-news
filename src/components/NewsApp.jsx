import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNewsFeed = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Append a cache-buster timestamp parameter to break past Vercel edge caching
        const cacheBuster = `&_cb=${Date.now()}`;
        const requestUrl = `${BACKEND_URL}/api/news?category=${activeRegion}&topic=${activeTopic}${cacheBuster}`;

        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error("Could not sync live media records.");
        const data = await response.json();

        if (Array.isArray(data)) {
          // ENFORCE CHRONOLOGICAL ALIGNMENT (Newest Unix millisecond values at index 0)
          const strictlySorted = [...data].sort((a, b) => {
            const valA = Number(a.timestamp || a.timeValue || a.rawDate || 0);
            const valB = Number(b.timestamp || b.timeValue || b.rawDate || 0);
            return valB - valA;
          });
          setArticles(strictlySorted);
        }
      } catch (err) {
        console.error("Fetch Exception Handled:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeRegion, activeTopic],
  );

  // Hook: Trigger feed updates automatically when standard tabs change
  useEffect(() => {
    fetchNewsFeed();
  }, [fetchNewsFeed]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>East Africa Newsroom</h1>

        {/* REGION NAVIGATION SELECTOR ROW */}
        <div className="nav-row regions">
          {["kenya", "nairobi", "uganda", "tanzania"].map((region) => (
            <button
              key={region}
              className={`nav-btn ${activeRegion === region ? "active" : ""}`}
              onClick={() => {
                setActiveRegion(region);
                setActiveTopic("all");
              }}
            >
              {region.toUpperCase()}
            </button>
          ))}
        </div>

        {/* TOPIC/CATEGORY SUB-SELECTOR ROW */}
        <div className="nav-row topics">
          {["all", "politics", "business", "sports", "entertainment"].map(
            (topic) => (
              <button
                key={topic}
                className={`topic-btn ${activeTopic === topic ? "active" : ""}`}
                onClick={() => setActiveTopic(topic)}
              >
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </button>
            ),
          )}
        </div>
      </header>

      {/* PULL TO REFRESH INTERACTION ELEMENT */}
      <div className="action-row">
        <button
          onClick={() => fetchNewsFeed(true)}
          className={`pull-refresh-action ${refreshing ? "loading" : ""}`}
          disabled={loading || refreshing}
        >
          {refreshing
            ? "⏳ Refreshing Live Feeds..."
            : "👇 Click to Sync Fresh News"}
        </button>
      </div>

      <main className="content-area">
        {/* SHIMMERING CARD SKELETON PLACEHOLDERS */}
        {loading && !refreshing && (
          <div className="news-grid animated-shimmer">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-card-block" />
            ))}
          </div>
        )}

        {/* ERROR BOUNDARY DISPLAY DIAGNOSTIC CONTAINER */}
        {error && (
          <div className="error-banner">
            <h3>Feed Synchronization Paused</h3>
            <p>{error}</p>
            <button onClick={() => fetchNewsFeed()}>Attempt Reconnect</button>
          </div>
        )}

        {/* ACTIVE STICKY TIMELINE WORKING ENVIRONMENT */}
        {!loading && !error && (
          <div className="news-grid">
            {articles.map((article) => (
              <article key={article.id} className="news-card">
                <div className="card-metadata">
                  <span className="source-pill-tag">{article.source}</span>
                  <span className="date-string-tag">{article.date}</span>
                </div>
                <h3 className="article-headline">{article.title}</h3>
                <p className="article-summary">{article.snippet}</p>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="read-more-action"
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
