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
        name: "Standard Nairobi Live",
        url: "https://www.standardmedia.co.ke/rss/headlines.php",
      },
      {
        name: "Google Nairobi Brief",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+nairobi&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Standard Politics",
        url: "https://www.standardmedia.co.ke/rss/politics.php",
      },
      {
        name: "Google Nairobi Politics",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+politics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Standard Business",
        url: "https://www.standardmedia.co.ke/rss/business.php",
      },
      {
        name: "Google Nairobi Biz",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+business&hl=en-US&gl=US&ceid=US:en",
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
  kenya: {
    all: [
      {
        name: "Standard National Live",
        url: "https://www.standardmedia.co.ke/rss/kenya.php",
      },
      {
        name: "Google Kenya Stream",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22&hl=en-US&gl=US&ceid=US:en",
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
        name: "Standard Entertainment",
        url: "https://www.standardmedia.co.ke/rss/entertainment.php",
      },
    ],
  },
  tanzania: {
    all: [
      {
        name: "Google News TZ",
        url: "https://news.google.com/rss/search?q=tanzania&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "TZ Governance",
        url: "https://news.google.com/rss/search?q=tanzania+politics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "TZ Economy",
        url: "https://news.google.com/rss/search?q=tanzania+business&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "TZ Sports",
        url: "https://news.google.com/rss/search?q=tanzania+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "TZ Culture",
        url: "https://news.google.com/rss/search?q=tanzania+entertainment&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  uganda: {
    all: [
      {
        name: "Google News UG",
        url: "https://news.google.com/rss/search?q=uganda&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "UG Politics",
        url: "https://news.google.com/rss/search?q=uganda+politics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "UG Business",
        url: "https://news.google.com/rss/search?q=uganda+business&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "UG Sports",
        url: "https://news.google.com/rss/search?q=uganda+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "UG Entertainment",
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

  // Filter out anomalies
  combinedArticles = combinedArticles.filter(
    (article) => article.title.split(" ").length >= 3,
  );

  // 2. STRICT NUMERIC SORTING ENFORCEMENT:
  // Subtracting raw integers removes date string processing glitches entirely
  if (combinedArticles.length > 0) {
    combinedArticles.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    return res.json([
      {
        id: "error-fb",
        title: "Updating regional feed alignment...",
        link: "#",
        source: "System",
        date: "Now",
        snippet: "Refreshing data streams. Toggle tabs or check back shortly!",
      },
    ]);
  }

  res.json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
