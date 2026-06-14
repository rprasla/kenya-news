const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");

const app = express();
app.use(cors()); // Permits your React app to speak to this backend safely

const parser = new Parser({
  // Custom headers mimic a real browser request so news sites don't block you
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// The verified active feed endpoints
const FEED_CONFIG = {
  nairobi: [
    // Switched to a reliable community news crawler that doesn't limit browser traffic
    {
      name: "Nairobi Now (City Updates)",
      url: "https://nairobinow.wordpress.com/feed/",
    },
    {
      name: "r/Nairobi (Top Current)",
      url: "https://www.reddit.com/r/nairobi.rss?sort=new",
    },
  ],
  kenya: [
    // Replaced dead standard paths with their verified working core feed layout
    {
      name: "The Standard Headlines",
      url: "https://www.standardmedia.co.ke/rss/headlines.php",
    },
  ],
  tanzania: [
    // Switched away from blocked Citizen links to AllAfrica's unrestricted live Tanzania stream
    {
      name: "AllAfrica Tanzania News",
      url: "https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf",
    },
  ],
  uganda: [
    {
      name: "The Independent Uganda",
      url: "https://www.independent.co.ug/feed/",
    },
  ],
};  

app.get("/api/news", async (req, res) => {
  const { category } = req.query;
  const feeds = FEED_CONFIG[category];

  if (!feeds) {
    return res
      .status(400)
      .json({ error: "Invalid country category requested." });
  }

  let combinedArticles = [];

  for (const feed of feeds) {
    try {
      const feedData = await parser.parseURL(feed.url);

      const parsedItems = feedData.items.map((item) => ({
        id: item.link || item.guid || item.title,
        title: item.title,
        link: item.link,
        source: feed.name,
        date: item.pubDate
          ? new Date(item.pubDate).toLocaleDateString()
          : "Recent",
        snippet: item.contentSnippet
          ? item.contentSnippet.substring(0, 150) + "..."
          : "Click to read full story.",
      }));

      combinedArticles = [...combinedArticles, ...parsedItems];
    } catch (err) {
      console.error(`Error parsing feed ${feed.name}:`, err.message);
      // Skip broken feeds gracefully so the rest of your app still loads
    }
  }

  // Sort newest first
  combinedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(combinedArticles);
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 News Engine Proxy active on http://localhost:${PORT}`),
);
