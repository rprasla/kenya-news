import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
app.use(cors({ origin: "*", methods: ["GET"] }));

const parser = new Parser({
  timeout: 5000,
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
});

// A multi-dimensional mapping for Region -> Category
const FEED_CONFIG = {
  nairobi: {
    all: [
      { name: "Nairobi Now", url: "https://nairobinow.wordpress.com/feed/" },
    ],
    politics: [
      {
        name: "r/Nairobi Politics",
        url: "https://www.reddit.com/r/nairobi.rss?sort=new",
      },
    ],
    business: [
      {
        name: "Nairobi Tech/Work",
        url: "https://www.reddit.com/r/nairobi.rss",
      },
    ],
    sports: [],
    entertainment: [
      {
        name: "Nairobi Culture",
        url: "https://nairobinow.wordpress.com/category/arts-culture/feed/",
      },
    ],
  },
  kenya: {
    all: [
      {
        name: "Standard Headlines",
        url: "https://www.standardmedia.co.ke/rss/headlines.php",
      },
    ],
    politics: [
      {
        name: "Standard Politics",
        url: "https://www.standardmedia.co.ke/rss/politics.php",
      },
    ],
    business: [
      {
        name: "Standard Business",
        url: "https://www.standardmedia.co.ke/rss/business.php",
      },
    ],
    sports: [
      {
        name: "Standard Sports",
        url: "https://www.standardmedia.co.ke/rss/sports.php",
      },
    ],
    entertainment: [
      {
        name: "Standard Pulse",
        url: "https://www.standardmedia.co.ke/rss/entertainment.php",
      },
    ],
  },
  tanzania: {
    all: [
      {
        name: "AllAfrica Tanzania",
        url: "https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf",
      },
    ],
    politics: [
      {
        name: "AllAfrica TZ Governance",
        url: "https://allafrica.com/tools/headlines/rdf/tanzania/headlines.rdf",
      },
    ],
    business: [
      {
        name: "Daily News TZ Business",
        url: "https://dailynews.co.tz/category/business/feed/",
      },
    ],
    sports: [
      {
        name: "Daily News TZ Sports",
        url: "https://dailynews.co.tz/category/sport/feed/",
      },
    ],
    entertainment: [],
  },
  uganda: {
    all: [
      {
        name: "The Independent UG",
        url: "https://www.independent.co.ug/feed/",
      },
    ],
    politics: [
      {
        name: "The Independent UG Politics",
        url: "https://www.independent.co.ug/category/news/national-news/feed/",
      },
    ],
    business: [
      {
        name: "The Independent UG Business",
        url: "https://www.independent.co.ug/category/business/feed/",
      },
    ],
    sports: [
      {
        name: "The Independent UG Sports",
        url: "https://www.independent.co.ug/category/sports/feed/",
      },
    ],
    entertainment: [],
  },
};

app.get("/api/news", async (req, res) => {
  const { category, topic } = req.query; // e.g., category=kenya, topic=business

  const regionConfig = FEED_CONFIG[category || "kenya"];
  if (!regionConfig)
    return res.status(400).json({ error: "Invalid country choice." });

  // Fallback to 'all' if the selected topic doesn't exist for that country
  const feeds =
    regionConfig[topic] && regionConfig[topic].length > 0
      ? regionConfig[topic]
      : regionConfig["all"];

  let combinedArticles = [];

  for (const feed of feeds) {
    try {
      const feedData = await parser.parseURL(feed.url);
      if (feedData && feedData.items) {
        const parsedItems = feedData.items.map((item) => ({
          id: item.link || item.guid || Math.random().toString(),
          title: item.title,
          link: item.link,
          source: feed.name,
          date: item.pubDate
            ? new Date(item.pubDate).toLocaleDateString()
            : "Recent",
          snippet: item.contentSnippet
            ? item.contentSnippet.substring(0, 140) + "..."
            : "Click to view.",
        }));
        combinedArticles = [...combinedArticles, ...parsedItems];
      }
    } catch (err) {
      console.error(`Skipped ${feed.name}:`, err.message);
    }
  }

  res.json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Categorized server on port ${PORT}`),
);
