import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchTopCoins,
  fetchGlobalData,
  fetchFearGreedIndex,
  fetchTrendingCoins,
  clearCache,
} from "@/lib/api";
import { assessMultipleCoins } from "@/lib/risk-engine";
import type {
  CoinData,
  GlobalData,
  MarketSummary,
  RiskAssessment,
  SortField,
  SortDirection,
  FilterMarketCap,
  FilterTrend,
  FilterRisk,
} from "@/types/market";

const REFRESH_INTERVAL = 60_000; // 60 seconds

interface MarketState {
  coins: CoinData[];
  globalData: GlobalData | null;
  summary: MarketSummary | null;
  riskAssessments: RiskAssessment[];
  trending: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface MarketFilters {
  sortField: SortField;
  sortDir: SortDirection;
  search: string;
  marketCapFilter: FilterMarketCap;
  trendFilter: FilterTrend;
  riskFilter: FilterRisk;
}

export function useMarketData() {
  const [state, setState] = useState<MarketState>({
    coins: [],
    globalData: null,
    summary: null,
    riskAssessments: [],
    trending: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
  });

  const [filters, setFilters] = useState<MarketFilters>({
    sortField: "market_cap_rank",
    sortDir: "asc",
    search: "",
    marketCapFilter: "all",
    trendFilter: "all",
    riskFilter: "all",
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!mountedRef.current) return;

    setState((prev) => ({
      ...prev,
      isLoading: !isRefresh && prev.coins.length === 0,
      isRefreshing: isRefresh,
      error: null,
    }));

    try {
      // Fetch core data in parallel
      const [coins, globalData, fearGreed, trending] = await Promise.allSettled([
        fetchTopCoins(100),
        fetchGlobalData(),
        fetchFearGreedIndex(),
        fetchTrendingCoins(),
      ]);

      if (!mountedRef.current) return;

      const coinsData = coins.status === "fulfilled" ? coins.value : [];
      const global = globalData.status === "fulfilled" ? globalData.value : null;
      const fg = fearGreed.status === "fulfilled" ? fearGreed.value : null;
      const trendingCoins = trending.status === "fulfilled" ? trending.value : [];

      // Build market summary
      const btcCoin = coinsData.find((c) => c.id === "bitcoin");
      const ethCoin = coinsData.find((c) => c.id === "ethereum");

      const summary: MarketSummary = {
        totalMarketCap: global?.total_market_cap?.usd ?? 0,
        totalVolume24h: global?.total_volume?.usd ?? 0,
        btcDominance: global?.market_cap_percentage?.btc ?? 0,
        ethDominance: global?.market_cap_percentage?.eth ?? 0,
        marketCapChange24h: global?.market_cap_change_percentage_24h_usd ?? 0,
        activeCryptos: global?.active_cryptocurrencies ?? 0,
        fearGreedIndex: fg?.value ? Number(fg.value) : undefined,
        fearGreedLabel: fg?.value_classification ?? undefined,
        btcPrice: btcCoin?.current_price ?? 0,
        btcChange24h: btcCoin?.price_change_percentage_24h ?? 0,
        ethPrice: ethCoin?.current_price ?? 0,
        ethChange24h: ethCoin?.price_change_percentage_24h ?? 0,
      };

      // Run risk engine
      const macroChange = global?.market_cap_change_percentage_24h_usd ?? 0;
      const riskAssessments = assessMultipleCoins(coinsData, macroChange);

      setState({
        coins: coinsData,
        globalData: global,
        summary,
        riskAssessments,
        trending: trendingCoins.map((t) => t.item.id),
        isLoading: false,
        isRefreshing: false,
        error: coins.status === "rejected" ? "Failed to load some market data" : null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: "Failed to load market data. Retrying...",
      }));
    }
  }, []);

  // Initial load and refresh interval
  useEffect(() => {
    mountedRef.current = true;
    loadData(false);

    intervalRef.current = setInterval(() => {
      clearCache();
      loadData(true);
    }, REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  // Manual refresh
  const refresh = useCallback(() => {
    clearCache();
    loadData(true);
  }, [loadData]);

  // Update filters
  const updateFilters = useCallback((partial: Partial<MarketFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Filtered and sorted coins
  const filteredCoins = applyFilters(state.coins, state.riskAssessments, filters);

  return {
    ...state,
    filters,
    filteredCoins,
    refresh,
    updateFilters,
  };
}

// ---------------------------------------------------------------------------
// Filter Logic
// ---------------------------------------------------------------------------

function applyFilters(
  coins: CoinData[],
  risks: RiskAssessment[],
  filters: MarketFilters,
): CoinData[] {
  let result = [...coins];

  // Search filter
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    );
  }

  // Market cap filter
  if (filters.marketCapFilter !== "all") {
    result = result.filter((c) => {
      switch (filters.marketCapFilter) {
        case "large": return c.market_cap >= 10_000_000_000;
        case "mid": return c.market_cap >= 1_000_000_000 && c.market_cap < 10_000_000_000;
        case "small": return c.market_cap >= 100_000_000 && c.market_cap < 1_000_000_000;
        case "micro": return c.market_cap < 100_000_000;
        default: return true;
      }
    });
  }

  // Trend filter
  if (filters.trendFilter !== "all") {
    result = result.filter((c) => {
      const change = c.price_change_percentage_24h ?? 0;
      switch (filters.trendFilter) {
        case "gainers": return change > 0.5;
        case "losers": return change < -0.5;
        case "neutral": return Math.abs(change) <= 0.5;
        default: return true;
      }
    });
  }

  // Risk filter
  if (filters.riskFilter !== "all") {
    const riskMap = new Map(risks.map((r) => [r.coinId, r.riskLabel]));
    result = result.filter((c) => {
      const label = riskMap.get(c.id);
      switch (filters.riskFilter) {
        case "safer": return label === "Safer";
        case "riskier": return label === "Riskier";
        case "high-potential": return label === "Riskier but High Potential";
        case "avoid": return label === "Do Not Invest";
        default: return true;
      }
    });
  }

  // Sort
  result.sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (filters.sortField) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        return filters.sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      default:
        aVal = (a as unknown as Record<string, number>)[filters.sortField] ?? 0;
        bVal = (b as unknown as Record<string, number>)[filters.sortField] ?? 0;
        return filters.sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
  });

  return result;
}
