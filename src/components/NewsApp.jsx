import React, { useState, useEffect, useCallback } from "react";
import "./NewsApp.css"; // Optional styling sheet

export default function NewsFeed({ activeRegion, activeTopic, backendUrl }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Core Data Fetcher Function
  const loadContent = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        // Smash Vercel Edge Server caches by attaching a fresh timestamp parameter
        const cacheBuster = `&_cb=${Date.now()}`;
        const response = await fetch(
          `${backendUrl}/api/news?category=${activeRegion}&topic=${activeTopic}${cacheBuster}`,
        );

        if (!response.ok)
          throw new Error("Could not synchronize live data streams.");
        const data = await response.json();

        if (Array.isArray(data)) {
          // Double-check our chronological timeline weight constraints
          const strictlySorted = [...data].sort((a, b) => {
            const valA = Number(a.timestamp || a.timeValue || a.rawDate || 0);
            const valB = Number(b.timestamp || b.timeValue || b.rawDate || 0);
            return valB - valA;
          });
          setArticles(strictlySorted);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeRegion, activeTopic, backendUrl],
  );

  // Hook 1: Automatically fetch whenever tabs change
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Hook 2: Pull-to-Refresh Handler
  const handleRefresh = () => {
    loadContent(true);
  };

  return (
    <div className="feed-wrapper">
      {/* Dynamic Header Action Bar */}
      <div className="action-row">
        <button
          onClick={handleRefresh}
          className={`refresh-btn ${refreshing ? "spinning" : ""}`}
          disabled={loading || refreshing}
        >
          {refreshing
            ? "🔄 Syncing Stories..."
            : "👇 Pull/Click to Refresh Feed"}
        </button>
      </div>

      {/* Loading State Skeleton UI */}
      {loading && !refreshing && (
        <div className="skeleton-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card" />
          ))}
        </div>
      )}

      {/* Error Boundary Status Feedback */}
      {error && (
        <div className="status-banner error-state">
          <h4>Network Outage Detected</h4>
          <p>{error}</p>
          <button onClick={() => loadContent()}>Retry Handshake</button>
        </div>
      )}

      {/* Primary Clean Render Workspace */}
      {!loading && !error && (
        <div className="articles-grid">
          {articles.map((article) => (
            <article key={article.id} className="news-card-layout">
              <div className="card-badge-row">
                <span className="source-pill">{article.source}</span>
                <span className="time-string">{article.date}</span>
              </div>
              <h3 className="headline-text">{article.title}</h3>
              <p className="summary-snippet">{article.snippet}</p>
              <a
                href={article.link}
                target="_blank"
                rel="noreferrer noopener"
                className="action-link"
              >
                Read Full Coverage →
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
