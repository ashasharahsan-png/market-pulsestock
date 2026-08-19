import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
  StarOff,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatPercent, formatVolume, formatMarketCap } from "@/lib/api";
import type {
  CoinData,
  RiskAssessment,
  SortField,
  SortDirection,
  FilterMarketCap,
  FilterTrend,
  FilterRisk,
  WatchlistItem,
} from "@/types/market";

interface CryptoMarketBoardProps {
  coins: CoinData[];
  riskAssessments: RiskAssessment[];
  watchlistIds: Set<string>;
  onToggleWatchlist: (coinId: string, symbol: string, name: string, image: string, price: number) => void;
  onSelectCoin: (coinId: string) => void;
  isLoading: boolean;
  // Filter state
  sortField: SortField;
  sortDir: SortDirection;
  search: string;
  marketCapFilter: FilterMarketCap;
  trendFilter: FilterTrend;
  riskFilter: FilterRisk;
  onSort: (field: SortField) => void;
  onSearch: (q: string) => void;
  onMarketCapFilter: (f: FilterMarketCap) => void;
  onTrendFilter: (f: FilterTrend) => void;
  onRiskFilter: (f: FilterRisk) => void;
}

const RISK_COLORS: Record<string, string> = {
  "Safer": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Riskier": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Riskier but High Potential": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Do Not Invest": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const RISK_SHORT: Record<string, string> = {
  "Safer": "Safer",
  "Riskier": "Riskier",
  "Riskier but High Potential": "High Pot.",
  "Do Not Invest": "Avoid",
};

export function CryptoMarketBoard({
  coins,
  riskAssessments,
  watchlistIds,
  onToggleWatchlist,
  onSelectCoin,
  isLoading,
  sortField,
  sortDir,
  search,
  marketCapFilter,
  trendFilter,
  riskFilter,
  onSort,
  onSearch,
  onMarketCapFilter,
  onTrendFilter,
  onRiskFilter,
}: CryptoMarketBoardProps) {
  const riskMap = useMemo(
    () => new Map(riskAssessments.map((r) => [r.coinId, r])),
    [riskAssessments],
  );

  if (isLoading && coins.length === 0) {
    return <BoardSkeleton />;
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight">Crypto Market</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {coins.length} assets
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coins..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-8 rounded-md border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Market Cap Filter */}
        <SelectFilter
          value={marketCapFilter}
          onChange={onMarketCapFilter}
          options={[
            { value: "all", label: "All Cap" },
            { value: "large", label: "Large (>$10B)" },
            { value: "mid", label: "Mid ($1-10B)" },
            { value: "small", label: "Small ($100M-1B)" },
            { value: "micro", label: "Micro (<$100M)" },
          ]}
        />

        {/* Trend Filter */}
        <SelectFilter
          value={trendFilter}
          onChange={onTrendFilter}
          options={[
            { value: "all", label: "All Trend" },
            { value: "gainers", label: "Gainers" },
            { value: "losers", label: "Losers" },
            { value: "neutral", label: "Neutral" },
          ]}
        />

        {/* Risk Filter */}
        <SelectFilter
          value={riskFilter}
          onChange={onRiskFilter}
          options={[
            { value: "all", label: "All Risk" },
            { value: "safer", label: "Safer" },
            { value: "riskier", label: "Riskier" },
            { value: "high-potential", label: "High Potential" },
            { value: "avoid", label: "Avoid" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">
                <SortHeader label="Asset" field="name" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                <SortHeader label="Price" field="current_price" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                <SortHeader label="1h" field="price_change_percentage_1h_in_currency" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">
                <SortHeader label="24h" field="price_change_percentage_24h" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                <SortHeader label="7d" field="price_change_percentage_7d_in_currency" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">
                <SortHeader label="Volume" field="total_volume" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">
                <SortHeader label="MCap" field="market_cap" current={sortField} dir={sortDir} onSort={onSort} />
              </th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Risk</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, idx) => {
              const risk = riskMap.get(coin.id);
              const isWatched = watchlistIds.has(coin.id);
              const change1h = coin.price_change_percentage_1h_in_currency;
              const change24h = coin.price_change_percentage_24h;
              const change7d = coin.price_change_percentage_7d_in_currency;

              return (
                <tr
                  key={coin.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => onSelectCoin(coin.id)}
                >
                  <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="size-6 rounded-full"
                        loading="lazy"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground truncate max-w-[120px]">
                          {coin.name}
                        </span>
                        <span className="text-muted-foreground uppercase">
                          {coin.symbol}
                        </span>
                      </div>
                      {/* Sparkline */}
                      {coin.sparkline_in_7d?.price && (
                        <div className="hidden sm:block ml-2">
                          <Sparkline
                            data={coin.sparkline_in_7d.price}
                            positive={change7d !== undefined ? change7d >= 0 : change24h >= 0}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">
                    <ChangeBadge value={change1h} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <ChangeBadge value={change24h} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums hidden md:table-cell">
                    <ChangeBadge value={change7d} />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                    {formatVolume(coin.total_volume)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground hidden lg:table-cell">
                    {formatMarketCap(coin.market_cap)}
                  </td>
                  <td className="px-3 py-2.5 text-center hidden md:table-cell">
                    {risk && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                          RISK_COLORS[risk.riskLabel],
                        )}
                      >
                        {RISK_SHORT[risk.riskLabel]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          onToggleWatchlist(
                            coin.id,
                            coin.symbol,
                            coin.name,
                            coin.image,
                            coin.current_price,
                          )
                        }
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        {isWatched ? (
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => onSelectCoin(coin.id)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="View details"
                      >
                        <Eye className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDirection;
  onSort: (f: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSort(field);
      }}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      {isActive ? (
        dir === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-30" />
      )}
    </button>
  );
}

function ChangeBadge({ value }: { value: number | undefined }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        "font-medium",
        value >= 0 ? "text-emerald-500" : "text-red-500",
      )}
    >
      {formatPercent(value)}
    </span>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: never) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as never)}
      className="h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  // Downsample to ~30 points for performance
  const step = Math.max(1, Math.floor(data.length / 30));
  const sampled = data.filter((_, i) => i % step === 0);

  if (sampled.length < 2) return null;

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = sampled
    .map((v, i) => {
      const x = (i / (sampled.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function BoardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-32 bg-muted rounded mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-8 w-24 bg-muted rounded" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="h-10 bg-muted/30 border-b border-border" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-border/50 flex items-center px-3 gap-4"
          >
            <div className="h-3 w-6 bg-muted rounded" />
            <div className="flex items-center gap-2.5">
              <div className="size-6 bg-muted rounded-full" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="ml-auto h-3 w-16 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
