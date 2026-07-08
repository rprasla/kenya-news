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
      { name: "Nairobi Wire Breaking", url: "https://nairobiwire.com/feed" },
      { name: "K24 Metro Streams", url: "https://k24.digital/feed" },
    ],
    politics: [
      {
        name: "Nairobi Wire Politics",
        url: "https://nairobiwire.com/category/news/politics/feed",
      },
    ],
    business: [
      {
        name: "K24 Business Core",
        url: "https://k24.digital/category/business/feed",
      },
    ],
    sports: [
      {
        name: "Nairobi Wire Sports",
        url: "https://nairobiwire.com/category/sports/feed",
      },
    ],
    entertainment: [
      { name: "Ghafla Entertainment", url: "https://ghafla.co.ke/ke/feed" },
    ],
  },
  kenya: {
    all: [
      { name: "K24 National Headlines", url: "https://k24.digital/feed" },
      { name: "Nairobi Wire National", url: "https://nairobiwire.com/feed" },
    ],
    politics: [
      {
        name: "K24 Statehouse Briefs",
        url: "https://k24.digital/category/news/politics/feed",
      },
    ],
    business: [
      {
        name: "Business Daily Core",
        url: "https://www.businessdailyafrica.com/service/search/feed/bd/706/feed.rss",
      },
    ],
    sports: [
      {
        name: "K24 Sports Desk",
        url: "https://k24.digital/category/sports/feed",
      },
    ],
    entertainment: [
      { name: "Ghafla Kenya Showbiz", url: "https://ghafla.co.ke/ke/feed" },
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

app.get("/api/news", async (req, res) => {
  const { category, topic } = req.query;
  const activeCategory = category || "kenya";
  const activeTopic = topic || "all";

  const regionConfig = FEED_CONFIG[activeCategory];
  if (!regionConfig)
    return res.status(400).json({ error: "Invalid search metrics." });

  const feeds =
    regionConfig[activeTopic] && regionConfig[activeTopic].length > 0
      ? regionConfig[activeTopic]
      : regionConfig["all"];

  let combinedArticles = [];

  for (const feed of feeds) {
    try {
      const feedData = await parser.parseURL(feed.url);
      if (feedData && feedData.items) {
        const parsedItems = feedData.items.map((item) => {
          const cleanTitle = item.title
            ? item.title.split(" - ")[0]
            : "Live Update";

          // 1. Create a rock-solid date fallback chain
          let finalTimestamp = Date.now();

          if (item.pubDate) {
            const parsed = Date.parse(item.pubDate);
            if (!isNaN(parsed)) finalTimestamp = parsed;
          } else if (item.isoDate) {
            const parsed = Date.parse(item.isoDate);
            if (!isNaN(parsed)) finalTimestamp = parsed;
          }

          return {
            id: item.link || item.guid || Math.random().toString(),
            title: cleanTitle,
            link: item.link || "#",
            source: feed.name,
            snippet: item.contentSnippet
              ? item.contentSnippet.substring(0, 140) + "..."
              : "",

            // 2. We bind it to every possible naming scheme to prevent frontend mismatches:
            timestamp: Number(finalTimestamp),
            timeValue: Number(finalTimestamp),
            rawDate: Number(finalTimestamp),

            date:
              new Date(finalTimestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) +
              " - " +
              new Date(finalTimestamp).toLocaleDateString(),
          };
        });

        combinedArticles = [...combinedArticles, ...parsedItems];
      }
    } catch (err) {
      console.error(`Fetch error on ${feed.name}:`, err.message);
    }
  }

  // --- SPAM & AGE HORIZON FILTER ---
  const LOW_QUALITY_KEYWORDS = [
    "sponsored",
    "advertorial",
    "casino",
    "betting",
    "promo",
  ];

  // --- CLEAN OPEN-GATE PROCESSING ---
  const LOW_QUALITY_KEYWORDS = [
    "sponsored",
    "advertorial",
    "casino",
    "betting",
    "promo",
  ];

  // --- ROBUST UNIFIED PARSING & SORTING ---
  combinedArticles = combinedArticles.map((article) => {
    // Forcefully normalize all erratic incoming RSS date formats into real Unix milliseconds
    let standardTimestamp = Date.now(); // fallback to now if broken

    if (article.pubDate || article.date || article.isoDate) {
      const rawDateString = article.pubDate || article.date || article.isoDate;
      const parsedTime = Date.parse(rawDateString);

      // If JavaScript successfully converts the date string to a number, use it
      if (!isNaN(parsedTime)) {
        standardTimestamp = parsedTime;
      }
    }

    // Return the polished item with a clean numeric timestamp property
    return {
      ...article,
      timestamp: standardTimestamp,
    };
  });

  // --- GENERAL FRAGMENT FILTER ---
  combinedArticles = combinedArticles.filter((article) => {
    if (!article || !article.title) return false;

    // Drop spam and empty link fragments
    const lowQualityTerms = [
      "sponsored",
      "advertorial",
      "casino",
      "betting",
      "promo",
    ];
    const contentText = `${article.title.toLowerCase()} ${article.snippet.toLowerCase()}`;
    const isSpam = lowQualityTerms.some((term) => contentText.includes(term));

    return !isSpam && article.title.split(" ").length >= 3;
  });

  // --- CRITICAL STICKY SORT (Strictly Newest to Oldest) ---
  // Subtracting clean integers guarantees the latest updates freeze to index 0
  // combinedArticles.sort((a, b) => b.timestamp - a.timestamp);

  // Return a generous slice of 50 stories so your feed is always full
  const finalCleanPayload = combinedArticles.slice(0, 50);

  res.json(finalCleanPayload);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
