/**
 * CoinGecko API Client
 *
 * Uses the free CoinGecko public API for crypto market data.
 * Implements client-side caching to respect rate limits.
 *
 * API docs: https://docs.coingecko.com/v3.0.1/reference/introduction
 * Free tier: ~10-30 calls/minute depending on endpoint.
 */

import type {
  CoinData,
  CoinDetail,
  GlobalData,
  MarketChartData,
  TrendingCoin,
} from "@/types/market";
import {
  FALLBACK_COINS,
  FALLBACK_GLOBAL_DATA,
  FALLBACK_FEAR_GREED,
  FALLBACK_TRENDING,
} from "@/lib/fallback-data";

// Flag set after first real API success so we can distinguish "never loaded"
// from "API failed" and show fallback gracefully.
let hasSuccessfullyFetched = false;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_TTL = 60_000; // 60 seconds — matches auto-refresh interval
const STALE_TTL = 300_000; // 5 minutes — serve stale data on failure

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null; // expired
}

function getStale<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp < STALE_TTL) return entry.data;
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Simple rate limiter — min 2s between calls to same endpoint group
const lastCallTime = new Map<string, number>();
const MIN_INTERVAL = 2000;

async function throttledFetch<T>(url: string, group = "default"): Promise<T> {
  const now = Date.now();
  const last = lastCallTime.get(group) || 0;
  const wait = Math.max(0, MIN_INTERVAL - (now - last));
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCallTime.set(group, Date.now());

  const response = await fetch(url);
  if (response.status === 429) {
    // Rate limited — throw to trigger fallback
    throw new Error("Rate limited");
  }
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  group = "default",
): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached !== null) return cached;

  try {
    const data = await throttledFetch<T>(url, group);
    setCache(cacheKey, data);
    hasSuccessfullyFetched = true;
    return data;
  } catch (err) {
    // Serve stale data if available
    const stale = getStale<T>(cacheKey);
    if (stale !== null) return stale;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Fetch top N coins by market cap with sparkline data.
 * Sparkline data gives us 7-day price history for mini charts.
 */
export async function fetchTopCoins(
  perPage = 100,
  page = 1,
): Promise<CoinData[]> {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h%2C24h%2C7d%2C30d`;
  try {
    return await cachedFetch<CoinData[]>(url, `top-coins-${perPage}-${page}`, "coins");
  } catch (error) {
    if (!hasSuccessfullyFetched) {
      console.warn("[Nexus] CoinGecko API unreachable — using fallback market data");
      return FALLBACK_COINS.slice(0, perPage);
    }
    throw error;
  }
}

/**
 * Fetch global cryptocurrency market data.
 */
export async function fetchGlobalData(): Promise<GlobalData> {
  const url = `${BASE_URL}/global`;
  try {
    const res = await cachedFetch<{ data: GlobalData }>(url, "global", "global");
    return res.data;
  } catch (error) {
    if (!hasSuccessfullyFetched) return FALLBACK_GLOBAL_DATA;
    throw error;
  }
}

/**
 * Fetch trending coins (search/trending endpoint).
 */
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  const url = `${BASE_URL}/search/trending`;
  try {
    const res = await cachedFetch<{ coins: TrendingCoin[] }>(
      url,
      "trending",
      "trending",
    );
    return res.coins;
  } catch (error) {
    if (!hasSuccessfullyFetched) return FALLBACK_TRENDING;
    throw error;
  }
}

/**
 * Fetch detailed info for a single coin.
 */
export async function fetchCoinDetail(coinId: string): Promise<CoinDetail> {
  const url = `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
  return cachedFetch<CoinDetail>(url, `coin-${coinId}`, "detail");
}

/**
 * Fetch market chart data (price, market cap, volume over time).
 * range: "1d", "7d", "30d", "90d", "1y"
 */
export async function fetchMarketChart(
  coinId: string,
  range: "1d" | "7d" | "30d" | "90d" | "1y" = "7d",
): Promise<MarketChartData> {
  const daysMap: Record<string, number> = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };
  const days = daysMap[range] || 7;
  const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  return cachedFetch<MarketChartData>(
    url,
    `chart-${coinId}-${range}`,
    `chart-${coinId}`,
  );
}

/**
 * Search for coins by query string.
 */
export async function searchCoins(
  query: string,
): Promise<{ id: string; name: string; symbol: string; market_cap_rank: number }[]> {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const res = await cachedFetch<{ coins: { id: string; name: string; symbol: string; market_cap_rank: number }[] }>(
    url,
    `search-${query}`,
    "search",
  );
  return res.coins;
}

// ---------------------------------------------------------------------------
// Fear & Greed Index (alternative API)
// ---------------------------------------------------------------------------

export interface FearGreedData {
  value: number | string;
  value_classification: string;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const res = await cachedFetch<{ data: FearGreedData[] }>(
      "https://api.alternative.me/fng/?limit=1",
      "fear-greed",
      "fear-greed",
    );
    return res.data?.[0] || null;
  } catch {
    if (!hasSuccessfullyFetched) return FALLBACK_FEAR_GREED;
    return null;
  }
}

// ---------------------------------------------------------------------------
// News (CryptoPanic free API — no key required for basic access)
// ---------------------------------------------------------------------------

export interface CryptoPanicPost {
  id: string;
  title: string;
  body: string | null;
  url: string;
  source: { title: string };
  published_at: string;
  votes: { positive: number; negative: number; important: number; liked: number };
  currencies?: { code: string }[];
  sentiment?: string;
}

export async function fetchCryptoNews(): Promise<CryptoPanicPost[]> {
  try {
    const url = "https://cryptopanic.com/api/free/v1/posts/?auth_token=&public=true&kind=news&filter=important";
    const res = await cachedFetch<{ results: CryptoPanicPost[] }>(
      url,
      "news",
      "news",
    );
    return res.results || [];
  } catch {
    // Fallback: try fetching from CoinGecko trending for news context
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format large numbers with appropriate suffixes. */
export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

/** Format price with appropriate decimal places. */
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (price >= 0.01) return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return price.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

/** Format percentage change with sign. */
export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Format volume. */
export function formatVolume(value: number): string {
  return formatMarketCap(value);
}

/** Clear all cached data (for manual refresh). */
export function clearCache(): void {
  cache.clear();
}
