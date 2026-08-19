export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  sparkline_in_7d?: {
    price: number[];
  };
  last_updated: string;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_percentage_1h_in_currency?: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency?: { usd: number };
    price_change_percentage_30d_in_currency?: { usd: number };
    circulating_supply: number;
    total_supply: number | null;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    ath_date: { usd: string };
    price_change_percentage_1y_in_currency?: { usd: number };
  };
  last_updated: string;
}

export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    score: number;
    data: {
      price: number;
      price_change_percentage_24h: {
        usd: number;
      };
      market_cap: string;
      total_volume: string;
    };
  };
}

export interface GlobalData {
  active_cryptocurrencies: number;
  markets: number;
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { btc: number; eth: number };
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
  relatedCoins?: string[];
}

export type NewsCategory =
  | "regulation"
  | "macro"
  | "institutional"
  | "security"
  | "market"
  | "technology"
  | "adoption"
  | "general";

export interface PortfolioHolding {
  id: string;
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  buyPrice: number;
  quantity: number;
  addedAt: number;
}

export interface PortfolioCalculation {
  holding: PortfolioHolding;
  currentPrice: number;
  currentValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  allocationWeight: number;
}

export interface WatchlistItem {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  addedAt: number;
  priceAtAdd: number;
}

export type RiskLabel = "Safer" | "Riskier" | "Riskier but High Potential" | "Do Not Invest";
export type ConfidenceLevel = "Low" | "Medium" | "High";
export type OutlookCategory = "Strong Setup" | "Watch Closely" | "Speculative" | "Avoid for Now";

export interface RiskAssessment {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  riskLabel: RiskLabel;
  confidence: ConfidenceLevel;
  outlookScore: number;
  outlookCategory: OutlookCategory;
  bullishCase: string;
  bearishCase: string;
  reasons: string[];
  factors: ScoreFactors;
  shortTermOutlook: string;
  mediumTermOutlook: string;
  mainUpsideCatalyst: string;
  mainDownsideRisk: string;
  newsSentiment: number;
}

export interface ScoreFactors {
  momentum: number;
  volumeTrend: number;
  volatility: number;
  liquidity: number;
  marketCapMaturity: number;
  newsSentiment: number;
  macroRisk: number;
  trendPersistence: number;
  drawdownBehavior: number;
}

export interface MarketSummary {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptos: number;
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
}

export type SortField =
  | "market_cap_rank"
  | "current_price"
  | "price_change_percentage_24h"
  | "price_change_percentage_1h_in_currency"
  | "price_change_percentage_7d_in_currency"
  | "total_volume"
  | "market_cap"
  | "name";

export type SortDirection = "asc" | "desc";

export type FilterMarketCap = "all" | "large" | "mid" | "small" | "micro";
export type FilterTrend = "all" | "gainers" | "losers" | "neutral";
export type FilterRisk = "all" | "safer" | "riskier" | "high-potential" | "avoid";
