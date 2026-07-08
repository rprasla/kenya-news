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
        name: "Standard Latest Live",
        url: "https://www.standardmedia.co.ke/rss/latest",
      },
      { name: "Kenyans Breaking", url: "https://www.kenyans.co.ke/feeds/news" },
    ],
    politics: [
      {
        name: "Standard Politics Feed",
        url: "https://www.standardmedia.co.ke/rss/politics.php",
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
        name: "Standard Sports Network",
        url: "https://www.standardmedia.co.ke/rss/sports.php",
      },
    ],
    entertainment: [
      {
        name: "Standard Entertainment",
        url: "https://www.standardmedia.co.ke/rss/entertainment.php",
      },
    ],
  },
  kenya: {
    all: [
      {
        name: "Standard Main Headlines",
        url: "https://www.standardmedia.co.ke/rss/headlines.php",
      },
      {
        name: "Kenyans Core News",
        url: "https://www.kenyans.co.ke/feeds/news",
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
        name: "Standard Financials",
        url: "https://www.standardmedia.co.ke/rss/business.php",
      },
      {
        name: "Business Daily Realtime",
        url: "https://www.businessdailyafrica.com/service/search/feed/bd/706/feed.rss",
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
        name: "Standard Entertainment",
        url: "https://www.standardmedia.co.ke/rss/entertainment.php",
      },
    ],
  },
  tanzania: {
    all: [
      {
        name: "The Citizen TZ Live",
        url: "https://www.thecitizen.co.tz/service/search/feed/ct/2304482/feed.rss",
      },
    ],
    politics: [
      {
        name: "Google Realtime Politics TZ",
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
        name: "Google Realtime Sports TZ",
        url: "https://news.google.com/rss/search?q=tanzania+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Google Realtime Culture TZ",
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
        name: "Google Realtime Culture UG",
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

  // Calculate the timestamp threshold for exactly 48 hours ago
  const FORTY_EIGHT_HOURS_AGO = Date.now() - 48 * 60 * 60 * 1000;

  combinedArticles = combinedArticles.filter((article) => {
    const textToScan = `${article.title.toLowerCase()} ${article.snippet.toLowerCase()}`;

    // Rule 1: Must not be spam
    const isSpam = LOW_QUALITY_KEYWORDS.some((k) => textToScan.includes(k));

    // Rule 2: Title must be realistic
    const isTooShort = article.title.split(" ").length < 3;

    // Rule 3: STRICT AGE CHECK -> Must be fresher than 48 hours old
    const isStale = article.timestamp < FORTY_EIGHT_HOURS_AGO;

    return !isSpam && !isTooShort && !isStale;
  });

  // Strict Numeric Sort (Newest first)
  if (combinedArticles.length > 0) {
    combinedArticles.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    // If a specific sub-category has nothing from the last 48 hours, prevent a blank screen
    return res.json([
      {
        id: "no-recent-news",
        title: `No new updates on ${activeTopic} in the last 48 hours.`,
        link: "#",
        source: "System Monitor",
        date: "Current",
        timestamp: Date.now(),
        snippet:
          "The feed is filtering properly. Check back soon for brand new updates or toggle another category tab!",
      },
    ]);
  }

  res.json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
