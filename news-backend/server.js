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

  // --- CLEAN OPEN-GATE PROCESSING ---
  const LOW_QUALITY_KEYWORDS = ['sponsored', 'advertorial', 'casino', 'betting', 'promo'];

  combinedArticles = combinedArticles.filter(article => {
    // 1. Instantly skip empty items
    if (!article || !article.title) return false;

    // 2. Prevent spam junk cards from loading
    const textToScan = `${article.title.toLowerCase()} ${article.snippet.toLowerCase()}`;
    const isSpam = LOW_QUALITY_KEYWORDS.some(k => textToScan.includes(k));
    if (isSpam) return false;

    // 3. Prevent broken text fragments 
    if (article.title.split(' ').length < 3) return false;
    
    // 4. Fallback: If a feed element completely omits a timestamp, protect it
    if (!article.timestamp || isNaN(article.timestamp)) {
      article.timestamp = Date.now();
    }

    return true; // AGE FILTER COMPLETELY REMOVED: All articles flow through!
  });

  // Strict chronological placement execution (Newest calculations land at top index)
  combinedArticles.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  // Pull a generous chunk of articles (up to 50) so your screen stays completely packed
  const finalPayload = combinedArticles.slice(0, 50);

  res.json(finalPayload);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
