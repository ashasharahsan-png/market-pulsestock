import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import type { TrendingCoin } from "@/types/market";

interface NewsPanelProps {
  trending: TrendingCoin[];
  isLoading: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  url: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
}

const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

const RSS_FEEDS = [
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { name: "Reuters Business", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best" },
  { name: "Al Jazeera Economy", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { name: "Investing.com", url: "https://www.investing.com/rss/news.rss" },
];

const CATEGORY_LABELS: Record<string, string> = {
  regulation: "Regulation",
  macro: "Macro",
  crypto: "Crypto",
  market: "Market",
  stocks: "Stocks",
  economy: "Economy",
  geopolitics: "Geopolitics",
  general: "General",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  negative: "bg-red-500/10 text-red-600 dark:text-red-400",
  neutral: "bg-muted text-muted-foreground",
};

export function NewsPanel({ trending }: NewsPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const results = await Promise.allSettled(
        RSS_FEEDS.map(async (feed) => {
          const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.items || []).map((item: Record<string, string>) => ({
            id: item.guid || item.link || `${feed.name}-${Math.random().toString(36).slice(2)}`,
            title: item.title || "",
            description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 200),
            source: feed.name,
            sourceUrl: item.link || feed.url,
            url: item.link || "#",
            publishedAt: item.pubDate || new Date().toISOString(),
            category: categorizeNews(item.title || "", feed.name),
            sentiment: analyzeSentiment(item.title || ""),
          }));
        }),
      );

      const allItems = results
        .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      // Deduplicate by title similarity and sort by date
      const seen = new Set<string>();
      const unique = allItems.filter((item) => {
        const key = item.title.toLowerCase().slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setNews(unique.slice(0, 50));
    } catch {
      // Fallback: generate context-aware news from trending coins
      setNews(generateFallbackNews(trending));
    }
    setLoadingNews(false);
  }, [trending]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const categories = ["all", ...new Set(news.map((n) => n.category))];
  const filteredNews =
    activeCategory === "all"
      ? news
      : news.filter((n) => n.category === activeCategory);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Newspaper className="size-4 text-muted-foreground" />
          Market News
        </h2>
        <button
          onClick={fetchNews}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Refresh news"
        >
          <RefreshCw className={cn("size-3.5 text-muted-foreground", loadingNews && "animate-spin")} />
        </button>
      </div>

      {/* Source indicator */}
      <div className="flex items-center gap-1.5 mb-3 text-[10px] text-muted-foreground">
        <span>Sources:</span>
        {RSS_FEEDS.map((f) => (
          <span key={f.name} className="px-1.5 py-0.5 rounded bg-muted/50">{f.name}</span>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-2 py-1 rounded text-xs whitespace-nowrap transition-colors",
              activeCategory === cat
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* News list */}
      {loadingNews && news.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse p-3 rounded-lg border border-border">
              <div className="h-3 w-3/4 bg-muted rounded mb-2" />
              <div className="h-2.5 w-1/4 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No news available at the moment.
        </div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filteredNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 mt-0.5",
                    SENTIMENT_COLORS[item.sentiment],
                  )}
                >
                  {CATEGORY_LABELS[item.category] || item.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-foreground group-hover:text-foreground/90 line-clamp-2">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-0.5">
                <span className="font-medium">{item.source}</span>
                <span>·</span>
                <span>{formatTimeAgo(item.publishedAt)}</span>
                <ExternalLink className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeNews(title: string, source: string): string {
  const lower = title.toLowerCase();
  const sourceLower = source.toLowerCase();

  // Crypto-specific
  if (/bitcoin|btc|ethereum|eth|crypto|blockchain|defi|nft|web3|token|coinbase|binance|solana/.test(lower)) return "crypto";

  // Regulation
  if (/regulat|sec |cftc|compliance|ban|legal|law|legislat/.test(lower)) return "regulation";

  // Macro
  if (/interest rate|inflation|fed |gdp|recession|treasury|bond|central bank|monetary|federal reserve/.test(lower)) return "macro";

  // Geopolitics
  if (/war|geopolit|sanction|nato|china|russia|ukraine|conflict|tariff/.test(lower)) return "geopolitics";

  // Stocks
  if (/stock|share|equit|nasdaq|s&p|dow|earnings|quarterly|ipo/.test(lower) || sourceLower.includes("reuters")) return "stocks";

  // Economy
  if (/econom|trade|export|import|gdp|employment|jobs|retail|consumer|oil|energy|commodit/.test(lower)) return "economy";

  // Market
  if (/price|rally|crash|surge|drop|bull|bear|trading|volume|market|invest/.test(lower)) return "market";

  return "general";
}

function analyzeSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  const positive = /surge|rally|gain|rise|bull|high|record|growth|adopt|approve|launch|profit|beat|strong|optimism|recovery/;
  const negative = /crash|drop|fall|bear|low|loss|hack|exploit|ban|fear|risk|warn|decline|recession|crisis|tension|collapse|plunge/;

  if (positive.test(lower)) return "positive";
  if (negative.test(lower)) return "negative";
  return "neutral";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function generateFallbackNews(trending: TrendingCoin[]): NewsItem[] {
  const fallbackTitles = [
    "Global markets show mixed signals amid economic uncertainty",
    "Federal Reserve signals potential rate decision ahead",
    "Oil prices fluctuate as OPEC meeting approaches",
    "European markets navigate through geopolitical tensions",
    "Asian markets respond to overnight Wall Street movement",
    "Tech stocks lead market momentum in early trading",
    "Inflation data reveals mixed economic signals",
    "Investors eye central bank decisions this week",
  ];

  return [
    ...trending.slice(0, 4).map((t, i) => ({
      id: `trending-${i}`,
      title: `${t.item.name} (${t.item.symbol.toUpperCase()}) trending with increased market activity`,
      description: `${t.item.name} is currently trending in the crypto market`,
      source: "Market Trending",
      sourceUrl: "#",
      url: "#",
      publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
      category: "crypto",
      sentiment: "neutral" as const,
    })),
    ...fallbackTitles.map((title, i) => ({
      id: `fallback-news-${i}`,
      title,
      description: "",
      source: "Market Overview",
      sourceUrl: "#",
      url: "#",
      publishedAt: new Date(Date.now() - (4 + i) * 3600000).toISOString(),
      category: categorizeNews(title, "Market Overview"),
      sentiment: analyzeSentiment(title),
    })),
  ];
}
