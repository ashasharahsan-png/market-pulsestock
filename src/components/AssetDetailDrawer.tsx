import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Shield,
  AlertTriangle,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  formatPercent,
  formatMarketCap,
  formatVolume,
  fetchCoinDetail,
  fetchMarketChart,
} from "@/lib/api";
import type { CoinData, CoinDetail, MarketChartData, RiskAssessment, RiskLabel } from "@/types/market";

interface AssetDetailDrawerProps {
  coinId: string | null;
  coin: CoinData | undefined;
  risk: RiskAssessment | undefined;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  onClose: () => void;
}

type ChartRange = "1d" | "7d" | "30d" | "90d" | "1y";

const RISK_ICONS: Record<RiskLabel, React.ReactNode> = {
  Safer: <Shield className="size-4" />,
  Riskier: <AlertTriangle className="size-4" />,
  "Riskier but High Potential": <Zap className="size-4" />,
  "Do Not Invest": <TrendingDown className="size-4" />,
};

const RISK_COLORS: Record<string, string> = {
  Safer: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Riskier: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "Riskier but High Potential": "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "Do Not Invest": "text-red-500 bg-red-500/10 border-red-500/20",
};

export function AssetDetailDrawer({
  coinId,
  coin,
  risk,
  isWatchlisted,
  onToggleWatchlist,
  onClose,
}: AssetDetailDrawerProps) {
  const [detail, setDetail] = useState<CoinDetail | null>(null);
  const [chartData, setChartData] = useState<MarketChartData | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coinId) return;
    setLoading(true);
    setDetail(null);
    setChartData(null);

    Promise.allSettled([
      fetchCoinDetail(coinId),
      fetchMarketChart(coinId, chartRange),
    ]).then(([detailRes, chartRes]) => {
      if (detailRes.status === "fulfilled") setDetail(detailRes.value);
      if (chartRes.status === "fulfilled") setChartData(chartRes.value);
      setLoading(false);
    });
  }, [coinId, chartRange]);

  if (!coinId || !coin) return null;

  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-lg bg-card border-l border-border overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt={coin.name} className="size-8 rounded-full" />
            <div>
              <h3 className="text-sm font-semibold">{coin.name}</h3>
              <span className="text-xs text-muted-foreground uppercase">
                {coin.symbol} · Rank #{coin.market_cap_rank}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleWatchlist}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              {isWatchlisted ? (
                <Star className="size-4 fill-amber-400 text-amber-400" />
              ) : (
                <StarOff className="size-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {formatPrice(coin.current_price)}
              </span>
              <span
                className={cn(
                  "text-sm font-medium tabular-nums",
                  isPositive ? "text-emerald-500" : "text-red-500",
                )}
              >
                {formatPercent(coin.price_change_percentage_24h)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              24h range: {formatPrice(coin.low_24h)} — {formatPrice(coin.high_24h)}
            </p>
          </div>

          {/* Chart */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              {(["1d", "7d", "30d", "90d", "1y"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                    chartRange === range
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            {loading && !chartData ? (
              <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
            ) : chartData ? (
              <MiniChart data={chartData} positive={isPositive} />
            ) : (
              <div className="h-40 rounded-lg bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                Chart data unavailable
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Market Cap" value={formatMarketCap(coin.market_cap)} />
            <MetricCard label="24h Volume" value={formatVolume(coin.total_volume)} />
            <MetricCard
              label="1h Change"
              value={formatPercent(coin.price_change_percentage_1h_in_currency)}
              className={
                (coin.price_change_percentage_1h_in_currency ?? 0) >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }
            />
            <MetricCard
              label="7d Change"
              value={formatPercent(coin.price_change_percentage_7d_in_currency)}
              className={
                (coin.price_change_percentage_7d_in_currency ?? 0) >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }
            />
            <MetricCard
              label="ATH"
              value={formatPrice(coin.ath)}
            />
            <MetricCard
              label="From ATH"
              value={formatPercent(coin.ath_change_percentage)}
              className="text-red-500"
            />
            {detail && (
              <>
                <MetricCard
                  label="Circulating Supply"
                  value={formatLargeNumber(detail.market_data.circulating_supply)}
                />
                <MetricCard
                  label="Total Supply"
                  value={
                    detail.market_data.total_supply
                      ? formatLargeNumber(detail.market_data.total_supply)
                      : "N/A"
                  }
                />
              </>
            )}
          </div>

          {/* Risk Assessment */}
          {risk && (
            <div className={cn("rounded-lg border p-3", RISK_COLORS[risk.riskLabel])}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {RISK_ICONS[risk.riskLabel]}
                  <span className="text-xs font-semibold">{risk.riskLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    Confidence: {risk.confidence}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-current"
                        style={{ width: `${risk.outlookScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums">
                      {risk.outlookScore}/100
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed mb-2">
                {risk.reasons.join(". ")}.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="font-medium text-emerald-500">Bull case:</span>
                  <p className="text-muted-foreground leading-relaxed mt-0.5">
                    {risk.bullishCase}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-red-500">Bear case:</span>
                  <p className="text-muted-foreground leading-relaxed mt-0.5">
                    {risk.bearishCase}
                  </p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  <Clock className="size-2.5 inline mr-1" />
                  Short-term: {risk.shortTermOutlook}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <BarChart3 className="size-2.5 inline mr-1" />
                  Medium-term: {risk.mediumTermOutlook}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <TrendingUp className="size-2.5 inline mr-1" />
                  Upside: {risk.mainUpsideCatalyst}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <TrendingDown className="size-2.5 inline mr-1" />
                  Downside: {risk.mainDownsideRisk}
                </p>
              </div>
            </div>
          )}

          {/* Score Factors Breakdown */}
          {risk && (
            <div>
              <h4 className="text-xs font-semibold mb-2">Score Factors</h4>
              <div className="space-y-1.5">
                {Object.entries(risk.factors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-28 shrink-0 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          value >= 70
                            ? "bg-emerald-500"
                            : value >= 40
                              ? "bg-amber-500"
                              : "bg-red-500",
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums w-8 text-right text-muted-foreground">
                      {Math.round(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {detail?.description?.en && (
            <div>
              <h4 className="text-xs font-semibold mb-2">About</h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                {detail.description.en.replace(/<[^>]*>/g, "")}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Risk labels and outlook scores are decision-support signals based on current market data.
              They are not financial advice and do not guarantee future performance.
              Always do your own research.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="p-2 rounded-md bg-muted/20 border border-border/50">
      <div className="text-[10px] text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-xs font-medium tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}

function MiniChart({ data, positive }: { data: MarketChartData; positive: boolean }) {
  const points = data.prices;
  if (!points || points.length < 2) return null;

  const prices = points.map((p) => p[1]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 440;
  const height = 160;
  const padding = 4;

  const pathPoints = prices.map((v, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (v - min) / range) * (height - 2 * padding);
    return { x, y };
  });

  const pathD = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pathPoints[pathPoints.length - 1].x} ${height} L ${pathPoints[0].x} ${height} Z`;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted/10">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
              stopOpacity="0.15"
            />
            <stop
              offset="100%"
              stopColor={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End point dot */}
        <circle
          cx={pathPoints[pathPoints.length - 1].x}
          cy={pathPoints[pathPoints.length - 1].y}
          r="3"
          fill={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
        />
      </svg>
    </div>
  );
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}
