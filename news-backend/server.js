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
      { name: "Nairobi Wire Live", url: "https://nairobiwire.com/feed" },
      {
        name: "KBC Nairobi Stream",
        url: "https://www.kbc.co.ke/category/county-news/nairobi/feed/",
      },
      { name: "K24 Metro News", url: "https://k24.digital/feed" },
      {
        name: "Google Nairobi Live",
        url: "https://news.google.com/rss/search?q=Nairobi+when:3d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    politics: [
      {
        name: "Nairobi Wire Politics",
        url: "https://nairobiwire.com/category/news/politics/feed",
      },
      {
        name: "KBC Politics Desk",
        url: "https://www.kbc.co.ke/category/news/politics/feed/",
      },
      {
        name: "Google Nairobi Politics",
        url: "https://news.google.com/rss/search?q=Nairobi+(politics+OR+governor+OR+county+assembly)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    business: [
      {
        name: "KBC Business Tech",
        url: "https://www.kbc.co.ke/category/business/feed/",
      },
      {
        name: "K24 Business Stream",
        url: "https://k24.digital/category/business/feed",
      },
      {
        name: "Google Nairobi Business",
        url: "https://news.google.com/rss/search?q=Nairobi+(business+OR+economy+OR+real+estate+OR+shilling)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    sports: [
      {
        name: "Nairobi Wire Sports",
        url: "https://nairobiwire.com/category/sports/feed",
      },
      {
        name: "KBC Sports Desk",
        url: "https://www.kbc.co.ke/category/sports/feed/",
      },
      {
        name: "Google Nairobi Sports",
        url: "https://news.google.com/rss/search?q=Nairobi+(sports+OR+stadium+OR+marathon+OR+football)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    entertainment: [
      { name: "Ghafla Kenya Showbiz", url: "https://ghafla.co.ke/ke/feed" },
      {
        name: "KBC Entertainment",
        url: "https://www.kbc.co.ke/category/entertainment/feed/",
      },
      {
        name: "Google Nairobi Culture",
        url: "https://news.google.com/rss/search?q=Nairobi+(entertainment+OR+showbiz+OR+music+OR+events)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
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
      { name: "K24 Digital Kenya", url: "https://k24.digital/feed" },
      { name: "Nairobi Wire Breaking", url: "https://nairobiwire.com/feed" },
      {
        name: "Google Kenya Top Stories",
        url: "https://news.google.com/rss/headlines/section/geo/Kenya?hl=en-KE&gl=KE&ceid=KE:en",
      },
      {
        name: "Google Kenya Breaking",
        url: "https://news.google.com/rss/search?q=Kenya+news+when:24h&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    politics: [
      {
        name: "KBC Politics Central",
        url: "https://www.kbc.co.ke/category/news/politics/feed/",
      },
      {
        name: "K24 Politics Stream",
        url: "https://k24.digital/category/news/politics/feed",
      },
      {
        name: "Google Kenya Politics",
        url: "https://news.google.com/rss/search?q=Kenya+(politics+OR+parliament+OR+ruto+OR+government)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    business: [
      {
        name: "KBC Financial News",
        url: "https://www.kbc.co.ke/category/business/feed/",
      },
      {
        name: "K24 Business Core",
        url: "https://k24.digital/category/business/feed",
      },
      {
        name: "Google Kenya Business",
        url: "https://news.google.com/rss/search?q=Kenya+(business+OR+shilling+OR+finance+OR+cbk+OR+taxes)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    sports: [
      {
        name: "KBC National Sports",
        url: "https://www.kbc.co.ke/category/sports/feed/",
      },
      {
        name: "K24 Sports Desk",
        url: "https://k24.digital/category/sports/feed",
      },
      {
        name: "Google Kenya Sports",
        url: "https://news.google.com/rss/search?q=Kenya+(sports+OR+athletics+OR+harambee+OR+safaricom+7s)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
    entertainment: [
      { name: "Ghafla Showbiz Kenya", url: "https://ghafla.co.ke/ke/feed" },
      {
        name: "KBC Lifestyle",
        url: "https://www.kbc.co.ke/category/entertainment/feed/",
      },
      {
        name: "Google Kenya Showbiz",
        url: "https://news.google.com/rss/search?q=Kenya+(entertainment+OR+celebrity+OR+music+OR+culture)+when:7d&hl=en-KE&gl=KE&ceid=KE:en",
      },
    ],
  },
  tanzania: {
    all: [
      {
        name: "The Citizen TZ Live",
        url: "https://www.thecitizen.co.tz/service/search/feed/ct/2304482/feed.rss",
      },
      {
        name: "Google Tanzania Live",
        url: "https://news.google.com/rss/search?q=Tanzania+when:3d&hl=en-US&gl=TZ&ceid=TZ:en",
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
      {
        name: "Google Business TZ",
        url: "https://news.google.com/rss/search?q=tanzania+(business+OR+economy+OR+shilling)&hl=en-US&gl=TZ&ceid=TZ:en",
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
      {
        name: "Google Uganda Live",
        url: "https://news.google.com/rss/search?q=Uganda+when:3d&hl=en-US&gl=UG&ceid=UG:en",
      },
    ],
    politics: [
      {
        name: "Daily Monitor Politics",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688326/feed.rss",
      },
      {
        name: "Google Politics UG",
        url: "https://news.google.com/rss/search?q=uganda+(politics+OR+parliament)&hl=en-US&gl=UG&ceid=UG:en",
      },
    ],
    business: [
      {
        name: "Daily Monitor Biz",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688330/feed.rss",
      },
      {
        name: "Google Business UG",
        url: "https://news.google.com/rss/search?q=uganda+(business+OR+economy+OR+shilling)&hl=en-US&gl=UG&ceid=UG:en",
      },
    ],
    sports: [
      {
        name: "Daily Monitor Sports",
        url: "https://www.monitor.co.ug/service/search/feed/dm/688338/feed.rss",
      },
      {
        name: "Google Sports UG",
        url: "https://news.google.com/rss/search?q=uganda+sports&hl=en-US&gl=UG&ceid=UG:en",
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
  // Clear any downstream proxy memory caps
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const { category, topic } = req.query;

  if (!FEED_CONFIG[category] || !FEED_CONFIG[category][topic]) {
    return res
      .status(400)
      .json({ error: "Invalid layout configuration parameters requested." });
  }

  const targetedFeeds = FEED_CONFIG[category][topic];
  let combinedArticles = [];
  const uniqueUrls = new Set(); // Prevents duplicate URLs from filling up slots

  for (const feed of targetedFeeds) {
    try {
      // Append a true system timestamp parameter to bypass target feed caching policies
      const freshUrl = `${feed.url}${feed.url.includes("?") ? "&" : "?"}_nocache=${Date.now()}`;
      const parsed = await parser.parseURL(freshUrl);

      if (parsed && parsed.items) {
        parsed.items.forEach((item, index) => {
          // Skip if we already added this exact article URL
          if (item.link && uniqueUrls.has(item.link)) return;
          if (item.link) uniqueUrls.add(item.link);

          let numericTimestamp = Date.now();
          const rawDateStr = item.pubDate || item.date || item.isoDate;
          if (rawDateStr) {
            const parsedMs = Date.parse(rawDateStr);
            if (!isNaN(parsedMs)) numericTimestamp = parsedMs;
          }

          combinedArticles.push({
            id: item.guid || item.id || `${feed.name}-${index}-${Date.now()}`,
            title: item.title || "Headline Unavailable",
            link: item.link || "#",
            snippet: item.contentSnippet || item.summary || item.content || "",
            source: feed.name,
            date: item.pubDate || item.date || "Live Now",
            timestamp: numericTimestamp,
          });
        });
      }
    } catch (feedError) {
      console.error(`[Feed Offline Bypass] ${feed.name}:`, feedError.message);
    }
  }

  // Strict Chronological Sort (Newest 2026 articles float to index 0)
  combinedArticles.sort((a, b) => b.timestamp - a.timestamp);

  // 🎯 THE FIX: Change your slice parameter to pull up to 50 items!
  const optimizedPayload = combinedArticles.slice(0, 50);

  console.log(
    `Successfully dispatched ${optimizedPayload.length} items for ${category}-${topic}`,
  );
  res.json(optimizedPayload);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Production Quality Filter active on port ${PORT}`),
);
