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
        name: "Nairobi Metro News",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+nairobi&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Nairobi Politics",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+politics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Nairobi Business",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+business+OR+shilling&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "Nairobi Sports",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Nairobi Entertainment",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+entertainment+OR+lifestyle&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  kenya: {
    all: [
      {
        name: "Kenya National News",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Kenya Politics",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+politics+OR+ruto+OR+odinga&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Kenya Business",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+business+OR+economy+OR+tax&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "Kenya Sports",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+sports+OR+football+OR+athletics&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Kenya Entertainment",
        url: "https://news.google.com/rss/search?q=source:Kenyans.co.ke+OR+source:%22Capital+FM%22+entertainment+OR+celebrity&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  tanzania: {
    all: [
      {
        name: "Google News Tanzania",
        url: "https://news.google.com/rss/search?q=tanzania&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Tanzania Politics",
        url: "https://news.google.com/rss/search?q=tanzania+politics+government&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Tanzania Business",
        url: "https://news.google.com/rss/search?q=tanzania+business+economy&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "Tanzania Sports",
        url: "https://news.google.com/rss/search?q=tanzania+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Tanzania Lifestyle",
        url: "https://news.google.com/rss/search?q=tanzania+entertainment&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  uganda: {
    all: [
      {
        name: "Google News Uganda",
        url: "https://news.google.com/rss/search?q=uganda&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    politics: [
      {
        name: "Uganda Politics",
        url: "https://news.google.com/rss/search?q=uganda+politics+government&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    business: [
      {
        name: "Uganda Business",
        url: "https://news.google.com/rss/search?q=uganda+business+economy&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    sports: [
      {
        name: "Uganda Sports",
        url: "https://news.google.com/rss/search?q=uganda+sports&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    entertainment: [
      {
        name: "Uganda Culture",
        url: "https://news.google.com/rss/search?q=uganda+entertainment&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
};

app.get("/api/news", async (req, res) => {
  const { category, topic } = req.query;

  // Fallback defaults to keep the app functional
  const activeCategory = category || "kenya";
  const activeTopic = topic || "all";

  const regionConfig = FEED_CONFIG[activeCategory];
  if (!regionConfig) {
    return res
      .status(400)
      .json({ error: "Invalid country or city parameter." });
  }

  // Pick the target array based on the requested tab
  const feeds =
    regionConfig[activeTopic] && regionConfig[activeTopic].length > 0
      ? regionConfig[activeTopic]
      : regionConfig["all"];

  let combinedArticles = [];

  for (const feed of feeds) {
    try {
      const feedData = await parser.parseURL(feed.url);
      if (feedData && feedData.items) {
        const parsedItems = feedData.items.map((item) => ({
          id: item.link || item.guid || Math.random().toString(),
          title: item.title ? item.title.split(" - ")[0] : "Breaking News", // Strips trailing publication name strings
          link: item.link || "#",
          source: feed.name,
          date: item.pubDate
            ? new Date(item.pubDate).toLocaleDateString()
            : "Recent",
          snippet: item.contentSnippet
            ? item.contentSnippet.substring(0, 150) + "..."
            : "",
        }));
        combinedArticles = [...combinedArticles, ...parsedItems];
      }
    } catch (err) {
      console.error(`Fetch error on ${feed.name}:`, err.message);
    }
  }

  // Basic filtering for length and relevance
  combinedArticles = combinedArticles.filter(
    (article) => article.title.split(" ").length >= 3,
  );

  // Fallback logic to prevent a blank UI screen
  if (combinedArticles.length === 0) {
    return res.json([
      {
        id: "fallback-1",
        title: `Updating ${activeTopic} feed...`,
        link: "#",
        source: "System",
        date: "Now",
        snippet: "Live items are updating. Switch tabs or refresh in a moment.",
      },
    ]);
  }

  res.json(combinedArticles);
});
