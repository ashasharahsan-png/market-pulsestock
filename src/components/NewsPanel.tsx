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
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
}

const CATEGORY_LABELS: Record<string, string> = {
  regulation: "Regulation",
  macro: "Macro",
  institutional: "Institutional",
  security: "Security",
  market: "Market",
  technology: "Technology",
  adoption: "Adoption",
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
      const res = await fetch(
        "https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&kind=news",
      );
      if (res.ok) {
        const data = await res.json();
        const items: NewsItem[] = (data.results || []).slice(0, 30).map(
          (post: Record<string, unknown>, idx: number) => ({
            id: post.id as string || `news-${idx}`,
            title: post.title as string,
            source: (post.source as { title: string })?.title || "Unknown",
            url: post.url as string,
            publishedAt: post.published_at as string,
            category: categorizeNews(post.title as string),
            sentiment: analyzeSentiment(post.title as string),
          }),
        );
        setNews(items);
      } else {
        // Fallback: generate placeholder news from trending coins
        setNews(generateFallbackNews(trending));
      }
    } catch {
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
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
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
                <p className="text-xs leading-relaxed text-foreground group-hover:text-foreground/90 line-clamp-2">
                  {item.title}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-0.5">
                <span>{item.source}</span>
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

function categorizeNews(title: string): string {
  const lower = title.toLowerCase();
  if (/regulat|sec |cftc|compliance|ban|legal/.test(lower)) return "regulation";
  if (/interest rate|inflation|fed |gdp|recession|treasury|bond/.test(lower)) return "macro";
  if (/etf|institutional|blackrock|fidelity|fund|grayscale/.test(lower)) return "institutional";
  if (/hack|exploit|stolen|scam|fraud|vulnerability/.test(lower)) return "security";
  if (/price|rally|crash|surge|drop|bull|bear|trading|volume/.test(lower)) return "market";
  if (/upgrade|protocol|layer|network|tech|smart contract/.test(lower)) return "technology";
  if (/adoption|partnership|integration|merchant|mainstream/.test(lower)) return "adoption";
  return "general";
}

function analyzeSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  const positive = /surge|rally|gain|rise|bull|high|record|growth|adoption|approve|launch/;
  const negative = /crash|drop|fall|bear|low|loss|hack|exploit|ban|fear|risk|warning|decline/;

  if (positive.test(lower)) return "positive";
  if (negative.test(lower)) return "negative";
  return "neutral";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function generateFallbackNews(trending: TrendingCoin[]): NewsItem[] {
  return trending.slice(0, 6).map((t, i) => ({
    id: `fallback-${i}`,
    title: `${t.item.name} (${t.item.symbol.toUpperCase()}) is trending in the market`,
    source: "Market Trending",
    url: "#",
    publishedAt: new Date().toISOString(),
    category: "market",
    sentiment: "neutral" as const,
  }));
}
