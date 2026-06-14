const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");

const app = express();

// Replace your old app.use(cors()) with this line:
app.use(
  cors({
    origin: "*", // Allows your Vercel frontend web address to fetch data securely
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
  }),
);

const parser = new Parser({
  timeout: 5000, // Drop slow feeds after 5 seconds so the app doesn't hang
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

const FEED_CONFIG = {
  nairobi: [
    { name: "Nairobi Now", url: "https://nairobinow.wordpress.com/feed/" },
    {
      name: "r/Nairobi (Reddit)",
      url: "https://www.reddit.com/r/nairobi.rss?sort=new",
    },
  ],
  kenya: [
    {
      name: "The Standard Headlines",
      url: "https://www.standardmedia.co.ke/rss/headlines.php",
    },
  ],
  tanzania: [
    {
      name: "AllAfrica Tanzania",
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
      console.log(`Fetching from: ${feed.name}`);
      const feedData = await parser.parseURL(feed.url);

      if (feedData && feedData.items) {
        const parsedItems = feedData.items.map((item) => ({
          id: item.link || item.guid || item.title || Math.random().toString(),
          title: item.title || "Untitled Story",
          link: item.link || "#",
          source: feed.name,
          date: item.pubDate
            ? new Date(item.pubDate).toLocaleDateString()
            : "Recent",
          snippet: item.contentSnippet
            ? item.contentSnippet.substring(0, 150) + "..."
            : "Click link to read full story.",
        }));
        combinedArticles = [...combinedArticles, ...parsedItems];
      }
    } catch (err) {
      // If a feed fails, log it locally but DO NOT crash the server
      console.error(`⚠️ Failed to parse ${feed.name}:`, err.message);
    }
  }

  // Defensive Sorting: Only sort if we actually found articles
  if (combinedArticles.length > 0) {
    try {
      combinedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (sortErr) {
      console.error("Sorting error fallback applied:", sortErr.message);
    }
  } else {
    // If absolutely everything failed, send a friendly placeholder instead of a 500 error
    combinedArticles.push({
      id: "error-placeholder",
      title: "Feeds are momentarily loading slow",
      link: "#",
      source: "System Status",
      date: "Now",
      snippet:
        "The upstream news servers are taking too long to respond. Please toggle tabs or refresh shortly!",
    });
  }

  // Always return a clean 200 JSON response so the React frontend stays happy
  res.status(200).json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 News Engine Active on Port ${PORT}`),
);
