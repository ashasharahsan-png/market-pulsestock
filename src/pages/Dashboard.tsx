import { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useMarketData } from "@/hooks/use-market-data";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Sidebar, type SidebarSection } from "@/components/Sidebar";
import { TopMarketBar } from "@/components/TopMarketBar";
import { CryptoMarketBoard } from "@/components/CryptoMarketBoard";
import { NewsPanel } from "@/components/NewsPanel";
import { PortfolioTracker } from "@/components/PortfolioTracker";
import { RiskOpportunity } from "@/components/RiskOpportunity";
import { AssetDetailDrawer } from "@/components/AssetDetailDrawer";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, ShieldAlert, Star } from "lucide-react";
import { formatPrice, formatPercent, formatMarketCap } from "@/lib/api";

export default function Dashboard() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeSection, setActiveSection] = useState<SidebarSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);

  const market = useMarketData();
  const portfolio = usePortfolio();
  const watchlist = useWatchlist();

  // Price map for portfolio calculations
  const priceMap = useMemo(
    () => new Map(market.coins.map((c) => [c.id, c.current_price])),
    [market.coins],
  );

  const portfolioCalcs = useMemo(
    () => portfolio.calculateWithPrices(priceMap),
    [portfolio, priceMap],
  );

  // Selected coin data
  const selectedCoin = useMemo(
    () => market.coins.find((c) => c.id === selectedCoinId),
    [market.coins, selectedCoinId],
  );

  const selectedRisk = useMemo(
    () => market.riskAssessments.find((r) => r.coinId === selectedCoinId),
    [market.riskAssessments, selectedCoinId],
  );

  const handleToggleWatchlist = useCallback(() => {
    if (!selectedCoin) return;
    watchlist.toggle(
      selectedCoin.id,
      selectedCoin.symbol,
      selectedCoin.name,
      selectedCoin.image,
      selectedCoin.current_price,
    );
  }, [selectedCoin, watchlist]);

  return (
    <div className={cn("min-h-screen bg-background text-foreground")}>
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onRefresh={market.refresh}
        isRefreshing={market.isRefreshing}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-56",
        )}
      >
        {/* Top Market Bar */}
        <TopMarketBar
          summary={market.summary}
          lastUpdated={market.lastUpdated}
          isLoading={market.isLoading}
        />

        {/* Dashboard Content */}
        <main className="p-4 lg:p-6">
          {activeSection === "overview" && (
            <OverviewSection
              market={market}
              portfolioCalcs={portfolioCalcs}
              portfolio={portfolio}
              watchlist={watchlist}
              onSelectCoin={setSelectedCoinId}
            />
          )}

          {activeSection === "market" && (
            <CryptoMarketBoard
              coins={market.filteredCoins}
              riskAssessments={market.riskAssessments}
              watchlistIds={watchlist.watchlistIds}
              onToggleWatchlist={(id, sym, name, img, price) =>
                watchlist.toggle(id, sym, name, img, price)
              }
              onSelectCoin={setSelectedCoinId}
              isLoading={market.isLoading}
              sortField={market.filters.sortField}
              sortDir={market.filters.sortDir}
              search={market.filters.search}
              marketCapFilter={market.filters.marketCapFilter}
              trendFilter={market.filters.trendFilter}
              riskFilter={market.filters.riskFilter}
              onSort={(field) =>
                market.updateFilters({
                  sortField: field,
                  sortDir:
                    market.filters.sortField === field
                      ? market.filters.sortDir === "asc"
                        ? "desc"
                        : "asc"
                      : "desc",
                })
              }
              onSearch={(q) => market.updateFilters({ search: q })}
              onMarketCapFilter={(f) => market.updateFilters({ marketCapFilter: f })}
              onTrendFilter={(f) => market.updateFilters({ trendFilter: f })}
              onRiskFilter={(f) => market.updateFilters({ riskFilter: f })}
            />
          )}

          {activeSection === "portfolio" && (
            <div className="max-w-4xl">
              <PortfolioTracker
                calculations={portfolioCalcs}
                coins={market.coins}
                onAdd={portfolio.addHolding}
                onRemove={portfolio.removeHolding}
                onUpdate={portfolio.updateHolding}
                getSummary={portfolio.getSummary}
              />
            </div>
          )}

          {activeSection === "risk" && (
            <div className="max-w-4xl">
              <RiskOpportunity
                assessments={market.riskAssessments}
                onSelectCoin={setSelectedCoinId}
                isLoading={market.isLoading}
              />
            </div>
          )}

          {activeSection === "watchlist" && (
            <WatchlistSection
              watchlist={watchlist}
              coins={market.coins}
              onSelectCoin={setSelectedCoinId}
            />
          )}

          {activeSection === "news" && (
            <div className="max-w-3xl">
              <NewsPanel trending={[]} isLoading={market.isLoading} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            For research and informational purposes only. Not financial advice. This platform does not
            guarantee returns. Predictions are probabilistic. Risk labels are decision-support signals,
            not certainty. Always do your own research before making investment decisions.
          </p>
        </footer>
      </div>

      {/* Asset Detail Drawer */}
      {selectedCoinId && (
        <AssetDetailDrawer
          coinId={selectedCoinId}
          coin={selectedCoin}
          risk={selectedRisk}
          isWatchlisted={watchlist.isWatchlisted(selectedCoinId)}
          onToggleWatchlist={handleToggleWatchlist}
          onClose={() => setSelectedCoinId(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Section — the default view with summary cards + mini sections
// ---------------------------------------------------------------------------

function OverviewSection({
  market,
  portfolioCalcs,
  portfolio,
  watchlist,
  onSelectCoin,
}: {
  market: ReturnType<typeof useMarketData>;
  portfolioCalcs: ReturnType<typeof usePortfolio>["calculations"];
  portfolio: ReturnType<typeof usePortfolio>;
  watchlist: ReturnType<typeof useWatchlist>;
  onSelectCoin: (id: string) => void;
}) {
  const summary = portfolio.getSummary(portfolioCalcs);

  // Top gainers/losers
  const topGainers = useMemo(
    () =>
      [...market.coins]
        .sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0))
        .slice(0, 5),
    [market.coins],
  );

  const topLosers = useMemo(
    () =>
      [...market.coins]
        .sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0))
        .slice(0, 5),
    [market.coins],
  );

  // Watchlist coins
  const watchlistCoins = useMemo(
    () =>
      market.coins.filter((c) => watchlist.watchlistIds.has(c.id)),
    [market.coins, watchlist.watchlistIds],
  );

  // Risk category counts
  const riskCounts = useMemo(() => {
    const counts = { safer: 0, riskier: 0, highPotential: 0, avoid: 0 };
    for (const r of market.riskAssessments) {
      if (r.riskLabel === "Safer") counts.safer++;
      else if (r.riskLabel === "Riskier") counts.riskier++;
      else if (r.riskLabel === "Riskier but High Potential") counts.highPotential++;
      else if (r.riskLabel === "Do Not Invest") counts.avoid++;
    }
    return counts;
  }, [market.riskAssessments]);

  return (
    <div className="space-y-6">
      {/* Welcome & Portfolio Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Pulse */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <Activity className="size-3.5 text-muted-foreground" />
            Market Pulse
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PulseCard
              label="BTC Price"
              value={formatPrice(market.summary?.btcPrice ?? 0)}
              change={market.summary?.btcChange24h}
            />
            <PulseCard
              label="ETH Price"
              value={formatPrice(market.summary?.ethPrice ?? 0)}
              change={market.summary?.ethChange24h}
            />
            <PulseCard
              label="Total MCap"
              value={formatMarketCap(market.summary?.totalMarketCap ?? 0)}
              change={market.summary?.marketCapChange24h}
            />
            <PulseCard
              label="24h Volume"
              value={formatMarketCap(market.summary?.totalVolume24h ?? 0)}
            />
          </div>
        </div>

        {/* Risk Snapshot */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            <ShieldAlert className="size-3.5 text-muted-foreground" />
            Risk Snapshot
          </h3>
          <div className="space-y-2">
            <RiskCount
              label="Safer"
              count={riskCounts.safer}
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <RiskCount
              label="High Potential"
              count={riskCounts.highPotential}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <RiskCount
              label="Riskier"
              count={riskCounts.riskier}
              color="text-amber-500"
              bg="bg-amber-500/10"
            />
            <RiskCount
              label="Avoid"
              count={riskCounts.avoid}
              color="text-red-500"
              bg="bg-red-500/10"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
            Based on transparent scoring of {market.riskAssessments.length} assets using momentum,
            liquidity, volatility, and market structure.
          </p>
        </div>
      </div>

      {/* Portfolio Summary (if has holdings) */}
      {summary.holdingsCount > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3">Portfolio Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PulseCard label="Invested" value={formatPrice(summary.totalInvested)} />
            <PulseCard label="Current Value" value={formatPrice(summary.totalValue)} />
            <PulseCard
              label="Unrealized P/L"
              value={`${summary.totalPL >= 0 ? "+" : ""}${formatPrice(Math.abs(summary.totalPL))}`}
              change={summary.totalPLPercent}
            />
            <PulseCard
              label="Holdings"
              value={`${summary.holdingsCount}`}
            />
          </div>
        </div>
      )}

      {/* Top Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MoversCard
          title="Top Gainers (24h)"
          icon={<TrendingUp className="size-3.5 text-emerald-500" />}
          items={topGainers}
          onSelect={onSelectCoin}
          positive
        />
        <MoversCard
          title="Top Losers (24h)"
          icon={<TrendingDown className="size-3.5 text-red-500" />}
          items={topLosers}
          onSelect={onSelectCoin}
          positive={false}
        />
      </div>

      {/* Watchlist */}
      {watchlistCoins.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
            ⭐ Watchlist
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Asset</th>
                  <th className="text-right px-2 py-1.5 text-muted-foreground font-medium">Price</th>
                  <th className="text-right px-2 py-1.5 text-muted-foreground font-medium">24h</th>
                  <th className="text-right px-2 py-1.5 text-muted-foreground font-medium hidden sm:table-cell">Since Added</th>
                </tr>
              </thead>
              <tbody>
                {watchlistCoins.map((coin) => {
                  const change = watchlist.getChangeSinceAdded(coin.id, coin.current_price);
                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => onSelectCoin(coin.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt="" className="size-5 rounded-full" />
                          <span className="font-medium">{coin.name}</span>
                          <span className="text-muted-foreground uppercase">{coin.symbol}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums font-medium">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        <span
                          className={
                            (coin.price_change_percentage_24h ?? 0) >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        >
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums hidden sm:table-cell">
                        {change !== null ? (
                          <span className={change >= 0 ? "text-emerald-500" : "text-red-500"}>
                            {formatPercent(change)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News Preview */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold mb-3">Latest News</h3>
        <div className="text-center py-4 text-xs text-muted-foreground">
          Navigate to the News section for full coverage.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Watchlist Section
// ---------------------------------------------------------------------------

function WatchlistSection({
  watchlist,
  coins,
  onSelectCoin,
}: {
  watchlist: ReturnType<typeof useWatchlist>;
  coins: ReturnType<typeof useMarketData>["coins"];
  onSelectCoin: (id: string) => void;
}) {
  const watchlistCoins = useMemo(
    () => coins.filter((c) => watchlist.watchlistIds.has(c.id)),
    [coins, watchlist.watchlistIds],
  );

  if (watchlistCoins.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-xs">
        <Star className="size-8 mx-auto mb-2 opacity-30" />
        <p>Your watchlist is empty. Star assets in the market board to track them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-sm font-semibold tracking-tight mb-3">Watchlist</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Asset</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Price</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">24h</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">7d</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">MCap</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Since Added</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-12"></th>
            </tr>
          </thead>
          <tbody>
            {watchlistCoins.map((coin) => {
              const change = watchlist.getChangeSinceAdded(coin.id, coin.current_price);
              return (
                <tr
                  key={coin.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onSelectCoin(coin.id)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <img src={coin.image} alt="" className="size-6 rounded-full" />
                      <div className="flex flex-col">
                        <span className="font-medium">{coin.name}</span>
                        <span className="text-muted-foreground uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className={(coin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}>
                      {formatPercent(coin.price_change_percentage_24h)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">
                    <span className={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}>
                      {formatPercent(coin.price_change_percentage_7d_in_currency)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                    {formatMarketCap(coin.market_cap)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">
                    {change !== null ? (
                      <span className={change >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {formatPercent(change)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        watchlist.toggle(coin.id, coin.symbol, coin.name, coin.image, coin.current_price);
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    </button>
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
// Shared Sub-components
// ---------------------------------------------------------------------------

function PulseCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: number;
}) {
  return (
    <div className="p-3 rounded-md bg-muted/20">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      {change !== undefined && (
        <div
          className={cn(
            "text-[10px] tabular-nums font-medium mt-0.5",
            change >= 0 ? "text-emerald-500" : "text-red-500",
          )}
        >
          {formatPercent(change)}
        </div>
      )}
    </div>
  );
}

function RiskCount({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-2.5 py-1.5 rounded-md", bg)}>
      <span className={cn("text-[10px] font-medium", color)}>{label}</span>
      <span className={cn("text-xs font-semibold tabular-nums", color)}>{count}</span>
    </div>
  );
}

function MoversCard({
  title,
  icon,
  items,
  onSelect,
  positive,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; name: string; symbol: string; image: string; current_price: number; price_change_percentage_24h: number }[];
  onSelect: (id: string) => void;
  positive: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((coin) => (
          <div
            key={coin.id}
            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelect(coin.id)}
          >
            <div className="flex items-center gap-2">
              <img src={coin.image} alt="" className="size-5 rounded-full" />
              <span className="text-xs font-medium">{coin.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{coin.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums font-medium">{formatPrice(coin.current_price)}</span>
              <span
                className={cn(
                  "text-xs tabular-nums font-medium",
                  positive ? "text-emerald-500" : "text-red-500",
                )}
              >
                {formatPercent(coin.price_change_percentage_24h)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
