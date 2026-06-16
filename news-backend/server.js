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
        name: "Kenyans.co.ke Premium",
        url: "https://www.kenyans.co.ke/feeds/news",
      },
      {
        name: "Capital FM Nairobi",
        url: "https://www.capitalfm.co.ke/news/feed/",
      },
    ],
    politics: [
      {
        name: "Kenyans.co.ke Politics",
        url: "https://www.kenyans.co.ke/feeds/politics",
      },
      {
        name: "Capital FM Politics",
        url: "https://www.capitalfm.co.ke/news/category/news/politics/feed/",
      },
    ],
    business: [
      {
        name: "Kenyans.co.ke Business",
        url: "https://www.kenyans.co.ke/feeds/business",
      },
      {
        name: "Capital FM Business",
        url: "https://www.capitalfm.co.ke/news/category/business/feed/",
      },
    ],
    sports: [
      {
        name: "Capital Sports",
        url: "https://www.capitalfm.co.ke/news/category/sports/feed/",
      },
    ],
    entertainment: [
      {
        name: "Kenyans.co.ke Lifestyle",
        url: "https://www.kenyans.co.ke/feeds/lifestyle",
      },
      {
        name: "Capital FM Lifestyle",
        url: "https://www.capitalfm.co.ke/news/category/lifestyle/feed/",
      },
    ],
  },
  kenya: {
    all: [
      {
        name: "Kenyans.co.ke National",
        url: "https://www.kenyans.co.ke/feeds/news",
      },
      {
        name: "The Guardian (Kenya)",
        url: "https://www.theguardian.com/world/kenya/rss",
      },
    ],
    politics: [
      {
        name: "Kenyans.co.ke Politics",
        url: "https://www.kenyans.co.ke/feeds/politics",
      },
    ],
    business: [
      {
        name: "Kenyans.co.ke Business",
        url: "https://www.kenyans.co.ke/feeds/business",
      },
    ],
    sports: [
      {
        name: "Kenyans.co.ke Sports",
        url: "https://www.kenyans.co.ke/feeds/sports",
      },
    ],
    entertainment: [
      {
        name: "Kenyans.co.ke Entertainment",
        url: "https://www.kenyans.co.ke/feeds/entertainment",
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
    // Utilizing precise Google News premium parameter indexing for Uganda sub-topics
    all: [
      {
        name: "Google News Uganda",
        url: "https://news.google.com/rss/search?q=uganda+politics+or+business&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Premium Uganda Politics",
        url: "https://news.google.com/rss/search?q=uganda+politics+government&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Premium Uganda Economy",
        url: "https://news.google.com/rss/search?q=uganda+business+economy+market&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "Premium Uganda Sports",
        url: "https://news.google.com/rss/search?q=uganda+sports+football&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Premium Uganda Culture",
        url: "https://news.google.com/rss/search?q=uganda+entertainment+culture&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
};

app.get("/api/news", async (req, res) => {
  const { category, topic } = req.query; // category = country/city, topic = sub-category

  const regionConfig = FEED_CONFIG[category || "kenya"];
  if (!regionConfig)
    return res
      .status(400)
      .json({ error: "Invalid country or city parameter." });

  // Select feeds for the specified topic; fall back to 'all' if empty
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
      console.error(`Skipped ${feed.name}:`, err.message);
    }
  }

  // --- PREMIUM QUALITY QUALITY CONTENT FILTER ---
  const LOW_QUALITY_KEYWORDS = [
    "sponsored",
    "advertorial",
    "win a prize",
    "shocking video",
    "you won't believe",
    "click here",
    "casino",
    "betting",
    "promo",
  ];

  combinedArticles = combinedArticles.filter((article) => {
    const titleLower = article.title.toLowerCase();
    const snippetLower = article.snippet.toLowerCase();

    const isSpam = LOW_QUALITY_KEYWORDS.some(
      (keyword) =>
        titleLower.includes(keyword) || snippetLower.includes(keyword),
    );
    const isTooShort = article.title.split(" ").length < 3;

    return !isSpam && !isTooShort;
  });

  // Sort articles chronologically (newest first)
  if (combinedArticles.length > 0) {
    combinedArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  res.json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
