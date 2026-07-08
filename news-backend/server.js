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
    return res.status(400).json({ error: "Invalid parameters." });

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
          // Clean Google News' source tag formats if present
          const cleanTitle = item.title
            ? item.title.split(" - ")[0]
            : "Breaking Feed";

          return {
            id: item.link || item.guid || Math.random().toString(),
            title: cleanTitle,
            link: item.link || "#",
            source: feed.name,
            date: item.pubDate
              ? new Date(item.pubDate).toLocaleDateString()
              : "Just now",
            rawDate: item.pubDate ? new Date(item.pubDate) : new Date(), // Used for strict internal sorting
            snippet: item.contentSnippet
              ? item.contentSnippet.substring(0, 140) + "..."
              : "",
          };
        });
        combinedArticles = [...combinedArticles, ...parsedItems];
      }
    } catch (err) {
      console.error(`Skipped ${feed.name}:`, err.message);
    }
  }

  // Filter out low word-count bugs
  combinedArticles = combinedArticles.filter(
    (article) => article.title.split(" ").length >= 3,
  );

  // Chronological Sort: Ensures news from minutes ago appears at the top
  if (combinedArticles.length > 0) {
    combinedArticles.sort((a, b) => b.rawDate - a.rawDate);
  }

  res.json(combinedArticles);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
