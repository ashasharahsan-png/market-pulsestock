import { TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatPercent, formatMarketCap } from "@/lib/api";
import type { MarketSummary } from "@/types/market";

interface TopMarketBarProps {
  summary: MarketSummary | null;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export function TopMarketBar({ summary, lastUpdated, isLoading }: TopMarketBarProps) {
  if (isLoading && !summary) {
    return (
      <div className="h-12 border-b border-border bg-card flex items-center gap-6 px-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 w-24 rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const marketUp = summary.marketCapChange24h >= 0;

  return (
    <div className="h-12 border-b border-border bg-card flex items-center overflow-x-auto">
      <div className="flex items-center gap-6 px-4 min-w-max">
        {/* Global Market Mood */}
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Market</span>
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              marketUp ? "text-emerald-500" : "text-red-500",
            )}
          >
            {marketUp ? "↑" : "↓"} {formatPercent(summary.marketCapChange24h)}
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Total Market Cap */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">MCap</span>
          <span className="text-xs font-medium tabular-nums">
            {formatMarketCap(summary.totalMarketCap)}
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* 24h Volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Vol</span>
          <span className="text-xs font-medium tabular-nums">
            {formatMarketCap(summary.totalVolume24h)}
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* BTC */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">BTC</span>
          <span className="text-xs font-medium tabular-nums">
            {formatPrice(summary.btcPrice)}
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              summary.btcChange24h >= 0 ? "text-emerald-500" : "text-red-500",
            )}
          >
            {formatPercent(summary.btcChange24h)}
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* ETH */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">ETH</span>
          <span className="text-xs font-medium tabular-nums">
            {formatPrice(summary.ethPrice)}
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              summary.ethChange24h >= 0 ? "text-emerald-500" : "text-red-500",
            )}
          >
            {formatPercent(summary.ethChange24h)}
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* BTC Dominance */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">BTC.D</span>
          <span className="text-xs font-medium tabular-nums">
            {summary.btcDominance.toFixed(1)}%
          </span>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Fear & Greed */}
        {summary.fearGreedIndex !== undefined && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Sentiment</span>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  summary.fearGreedIndex >= 60
                    ? "text-emerald-500"
                    : summary.fearGreedIndex <= 40
                      ? "text-red-500"
                      : "text-amber-500",
                )}
              >
                {summary.fearGreedIndex}
              </span>
              <span className="text-xs text-muted-foreground">
                {summary.fearGreedLabel}
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
          </>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {lastUpdated.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
