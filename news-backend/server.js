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
// Premium, high-quality feeds mapped cleanly by topic
const FEED_CONFIG = {
  nairobi: {
    all: [
      {
        name: "KBC Nairobi News",
        url: "https://www.kbc.co.ke/category/county-news/nairobi/feed/",
      },
      {
        name: "Nairobi News Wire",
        url: "https://news.google.com/rss/search?q=Nairobi&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    politics: [
      {
        name: "Capital FM Politics",
        url: "https://news.google.com/rss/search?q=Nairobi+Politics&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    business: [
      {
        name: "KBC Business Tech",
        url: "https://www.kbc.co.ke/category/business/feed/",
      },
    ],
    sports: [
      {
        name: "KBC Sports Central",
        url: "https://www.kbc.co.ke/category/sports/feed/",
      },
    ],
    entertainment: [
      {
        name: "Nairobi Gossip Core",
        url: "https://news.google.com/rss/search?q=Nairobi+Entertainment&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
  },
  kenya: {
    all: [
      {
        name: "KBC National Live",
        url: "https://www.kbc.co.ke/category/news/kenya/feed/",
      },
      { name: "Kenya News Agency", url: "https://kenyanews.go.ke/feed/" },
    ],
    politics: [
      {
        name: "KBC National Politics",
        url: "https://www.kbc.co.ke/category/news/politics/feed/",
      },
    ],
    business: [
      {
        name: "Business Daily Wire",
        url: "https://www.businessdailyafrica.com/service/search/feed/bd/706/feed.rss",
      },
      {
        name: "KBC Financial Wire",
        url: "https://www.kbc.co.ke/category/business/feed/",
      },
    ],
    sports: [
      {
        name: "KBC National Sports",
        url: "https://www.kbc.co.ke/category/sports/feed/",
      },
    ],
    entertainment: [
      {
        name: "KBC Showbiz",
        url: "https://www.kbc.co.ke/category/entertainment/feed/",
      },
    ],
  },

  // Keep your tanzania and uganda objects exactly as they are below...
  tanzania: {
    all: [
      {
        name: "The Citizen TZ Live",
        url: "https://www.thecitizen.co.tz/service/search/feed/ct/2304482/feed.rss",
      },
    ],
    politics: [
      {
        name: "Google Politics TZ",
        url: "https://news.google.com/rss/search?q=tanzania+politics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "The Citizen Biz",
        url: "https://www.thecitizen.co.tz/service/search/feed/ct/2304562/feed.rss",
      },
    ],
    sports: [
      {
        name: "Google Sports TZ",
        url: "https://news.google.com/rss/search?q=tanzania+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Google Culture TZ",
        url: "https://news.google.com/rss/search?q=tanzania+entertainment&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  uganda: {
    all: [
      {
        name: "Daily Monitor UG Live",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688322/feed.rss",
      },
    ],
    politics: [
      {
        name: "Daily Monitor Politics",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688326/feed.rss",
      },
    ],
    business: [
      {
        name: "Daily Monitor Biz",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688330/feed.rss",
      },
    ],
    sports: [
      {
        name: "Daily Monitor Sports",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688338/feed.rss",
      },
    ],
    entertainment: [
      {
        name: "Google Culture UG",
        url: "https://news.google.com/rss/search?q=uganda+entertainment&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
};

const RSSParser = require("rss-parser");
const parser = new RSSParser();

app.get("/api/news", async (req, res) => {
  const { category, topic } = req.query;

  // 1. Guard against unexpected query values
  if (!FEED_CONFIG[category] || !FEED_CONFIG[category][topic]) {
    return res
      .status(400)
      .json({ error: "Invalid routing query configuration values." });
  }

  const feedsToQuery = FEED_CONFIG[category][topic];
  let accumulatedArticles = []; // Master structural tray

  // 2. Loop through every single feed parameter independently
  for (const feed of feedsToQuery) {
    try {
      // Fetch fresh raw data directly bypassing regional edge proxy memory sets
      const parsedData = await parser.parseURL(
        `${feed.url}?nocache=${Date.now()}`,
      );

      if (parsedData && parsedData.items) {
        const structuralItems = parsedData.items.map((item, index) => {
          // Force parse erratic date footprints safely into Unix integers
          let numericTimestamp = Date.now();
          const rawDate = item.pubDate || item.date || item.isoDate;
          if (rawDate) {
            const parsedTime = Date.parse(rawDate);
            if (!isNaN(parsedTime)) numericTimestamp = parsedTime;
          }

          return {
            id: item.guid || item.id || `${feed.name}-${index}-${Date.now()}`,
            title: item.title || "No Headline Provided",
            link: item.link,
            snippet: item.contentSnippet || item.summary || "",
            source: feed.name,
            date: item.pubDate || item.date || "Live Now",
            timestamp: numericTimestamp, // Critical engine property
          };
        });

        // 🎯 THE LIFESAVING FIX: Stack items together dynamically rather than overwriting!
        accumulatedArticles = [...accumulatedArticles, ...structuralItems];
      }
    } catch (feedError) {
      console.error(
        `Bypassed down target endpoint offline [${feed.name}]:`,
        feedError.message,
      );
    }
  }

  // 3. SECURE TIME SORT (Ensures all raw 2026 content is frozen right at the top)
  accumulatedArticles.sort((a, b) => b.timestamp - a.timestamp);

  // 4. Return a highly generous slice to your frontend
  res.json(accumulatedArticles.slice(0, 60));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
