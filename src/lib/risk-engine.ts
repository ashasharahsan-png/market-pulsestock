/**
 * Risk & Opportunity Engine
 *
 * A transparent, explainable scoring model that converts current market data
 * into decision-support signals. This is NOT financial advice.
 *
 * The engine uses a weighted combination of observable market metrics to
 * produce:
 * - Risk Label: Safer / Riskier / Riskier but High Potential / Do Not Invest
 * - Confidence: Low / Medium / High
 * - Outlook Score: 0–100
 * - Outlook Category: Strong Setup / Watch Closely / Speculative / Avoid for Now
 * - Human-readable explanations
 *
 * Scoring Philosophy:
 * - We never predict future price movements with certainty.
 * - We use probability-style language and transparent logic.
 * - Lower confidence when evidence is weak.
 * - Show "Insufficient confidence" when data is unreliable.
 */

import type {
  CoinData,
  CoinDetail,
  RiskAssessment,
  ScoreFactors,
  RiskLabel,
  ConfidenceLevel,
  OutlookCategory,
} from "@/types/market";

// ---------------------------------------------------------------------------
// Factor Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  momentum: 0.15,
  volumeTrend: 0.10,
  volatility: 0.15,
  liquidity: 0.15,
  marketCapMaturity: 0.15,
  newsSentiment: 0.10,
  macroRisk: 0.05,
  trendPersistence: 0.10,
  drawdownBehavior: 0.05,
};

// ---------------------------------------------------------------------------
// Individual Factor Scoring (0–100, higher = better/less risky)
// ---------------------------------------------------------------------------

/**
 * Momentum: Based on 1h, 24h, 7d price changes.
 * Strong positive momentum scores higher, but extreme spikes may lower score
 * (parabolic moves often reverse).
 */
function scoreMomentum(coin: CoinData): number {
  const h1 = coin.price_change_percentage_1h_in_currency ?? 0;
  const d1 = coin.price_change_percentage_24h ?? 0;
  const d7 = coin.price_change_percentage_7d_in_currency ?? 0;

  // Weighted composite: 7d matters most, 24h medium, 1h least
  const composite = d7 * 0.5 + d1 * 0.35 + h1 * 0.15;

  // Map to 0-100: -30% → ~10, 0% → ~50, +30% → ~90
  let score = 50 + (composite / 30) * 40;
  score = Math.max(0, Math.min(100, score));

  // Penalize extreme parabolic moves (>50% in 7d)
  if (d7 > 50) score = Math.max(score - 20, 0);
  if (d7 < -50) score = Math.max(score - 15, 0);

  return score;
}

/**
 * Volume Trend: Compare current volume to market cap ratio.
 * Higher relative volume = more active market = better liquidity signal.
 */
function scoreVolumeTrend(coin: CoinData): number {
  if (!coin.market_cap || coin.market_cap === 0) return 20;
  const volumeRatio = coin.total_volume / coin.market_cap;

  // Typical range: 0.01 (low) to 0.3+ (high)
  // Higher volume relative to market cap means active trading
  let score = volumeRatio * 200; // 0.05 → 10, 0.15 → 30, 0.5 → 100
  score = Math.max(0, Math.min(100, score));
  return score;
}

/**
 * Volatility: Based on 24h range relative to price.
 * Lower volatility (within reason) = safer.
 * But very low volatility might mean low interest.
 */
function scoreVolatility(coin: CoinData): number {
  if (!coin.current_price || coin.current_price === 0) return 30;

  const range24h = coin.high_24h - coin.low_24h;
  const rangePercent = (range24h / coin.current_price) * 100;

  // Sweet spot: 2-8% daily range → high score
  // Very low (<1%) → moderate (low interest)
  // Very high (>20%) → low score (too volatile)
  if (rangePercent < 1) return 40;
  if (rangePercent < 2) return 60;
  if (rangePercent < 5) return 85;
  if (rangePercent < 8) return 75;
  if (rangePercent < 15) return 50;
  if (rangePercent < 25) return 30;
  return 15;
}

/**
 * Liquidity: Based on absolute volume and market cap.
 * Higher values = deeper markets = better liquidity.
 */
function scoreLiquidity(coin: CoinData): number {
  const volume = coin.total_volume;
  const mcap = coin.market_cap;

  // Volume-based score
  let volScore = 0;
  if (volume > 1_000_000_000) volScore = 90;
  else if (volume > 500_000_000) volScore = 80;
  else if (volume > 100_000_000) volScore = 65;
  else if (volume > 50_000_000) volScore = 50;
  else if (volume > 10_000_000) volScore = 35;
  else if (volume > 1_000_000) volScore = 20;
  else volScore = 5;

  // Market cap modifier
  let mcapBonus = 0;
  if (mcap > 100_000_000_000) mcapBonus = 10;
  else if (mcap > 10_000_000_000) mcapBonus = 7;
  else if (mcap > 1_000_000_000) mcapBonus = 4;
  else if (mcap > 100_000_000) mcapBonus = 0;
  else mcapBonus = -5;

  return Math.max(0, Math.min(100, volScore + mcapBonus));
}

/**
 * Market Cap Maturity: Larger, more established assets score higher.
 */
function scoreMarketCapMaturity(coin: CoinData): number {
  const mcap = coin.market_cap;
  const rank = coin.market_cap_rank;

  // Rank-based scoring (top 10 = high, top 50 = medium-high, etc.)
  let rankScore: number;
  if (rank <= 5) rankScore = 95;
  else if (rank <= 10) rankScore = 85;
  else if (rank <= 20) rankScore = 75;
  else if (rank <= 50) rankScore = 60;
  else if (rank <= 100) rankScore = 45;
  else if (rank <= 200) rankScore = 30;
  else rankScore = 15;

  // Market cap absolute score
  let mcapScore: number;
  if (mcap > 100_000_000_000) mcapScore = 95;
  else if (mcap > 10_000_000_000) mcapScore = 80;
  else if (mcap > 1_000_000_000) mcapScore = 60;
  else if (mcap > 100_000_000) mcapScore = 40;
  else if (mcap > 10_000_000) mcapScore = 25;
  else mcapScore = 10;

  return (rankScore + mcapScore) / 2;
}

/**
 * News Sentiment: Placeholder for when news data is available.
 * In v1, we use a neutral baseline; when news integration is live,
 * this function will use actual sentiment analysis.
 */
function scoreNewsSentiment(_coin: CoinData, _sentiment?: number): number {
  // If external sentiment score is provided (0-100), use it
  if (_sentiment !== undefined) return _sentiment;
  // Default neutral sentiment
  return 50;
}

/**
 * Macro Risk: Current market-wide risk context.
 * Used as a global modifier rather than per-asset.
 */
function scoreMacroRisk(marketCapChange24h: number): number {
  // Positive market movement = lower macro risk
  let score = 50 + marketCapChange24h * 5;
  return Math.max(10, Math.min(90, score));
}

/**
 * Trend Persistence: How consistent is the directional move?
 * Based on alignment of 1h, 24h, 7d changes.
 */
function scoreTrendPersistence(coin: CoinData): number {
  const h1 = coin.price_change_percentage_1h_in_currency ?? 0;
  const d1 = coin.price_change_percentage_24h ?? 0;
  const d7 = coin.price_change_percentage_7d_in_currency ?? 0;

  // Count how many timeframes agree in direction
  const signs = [Math.sign(h1), Math.sign(d1), Math.sign(d7)];
  const agreement = signs.filter((s) => s === signs[0]).length;

  // Perfect agreement (3/3) = high score
  let score = agreement === 3 ? 80 : agreement === 2 ? 55 : 30;

  // Boost if all positive, reduce if all negative
  if (signs[0] > 0 && agreement === 3) score = 90;
  if (signs[0] < 0 && agreement === 3) score = 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Drawdown Behavior: How much has the asset dropped from ATH?
 * Large drawdowns suggest higher risk but also potential recovery.
 */
function scoreDrawdownBehavior(coin: CoinData): number {
  const drawdown = Math.abs(coin.ath_change_percentage ?? 0);

  // Smaller drawdown from ATH = more resilient
  if (drawdown < 10) return 90;
  if (drawdown < 25) return 75;
  if (drawdown < 50) return 55;
  if (drawdown < 75) return 35;
  if (drawdown < 90) return 20;
  return 10;
}

// ---------------------------------------------------------------------------
// Composite Scoring
// ---------------------------------------------------------------------------

export function calculateScoreFactors(
  coin: CoinData,
  macroMarketChange: number,
  newsSentiment?: number,
): ScoreFactors {
  return {
    momentum: scoreMomentum(coin),
    volumeTrend: scoreVolumeTrend(coin),
    volatility: scoreVolatility(coin),
    liquidity: scoreLiquidity(coin),
    marketCapMaturity: scoreMarketCapMaturity(coin),
    newsSentiment: scoreNewsSentiment(coin, newsSentiment),
    macroRisk: scoreMacroRisk(macroMarketChange),
    trendPersistence: scoreTrendPersistence(coin),
    drawdownBehavior: scoreDrawdownBehavior(coin),
  };
}

/** Calculate weighted outlook score from factors. */
function calculateOutlookScore(factors: ScoreFactors): number {
  let total = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const factorKey = key as keyof ScoreFactors;
    total += factors[factorKey] * weight;
    totalWeight += weight;
  }

  return Math.round(total / totalWeight);
}

/** Map outlook score to category. */
function scoreToCategory(score: number): OutlookCategory {
  if (score >= 72) return "Strong Setup";
  if (score >= 50) return "Watch Closely";
  if (score >= 30) return "Speculative";
  return "Avoid for Now";
}

/** Determine confidence level based on data completeness and market position. */
function determineConfidence(coin: CoinData): ConfidenceLevel {
  let confidenceFactors = 0;

  // Data completeness
  if (coin.price_change_percentage_1h_in_currency !== undefined) confidenceFactors++;
  if (coin.price_change_percentage_7d_in_currency !== undefined) confidenceFactors++;
  if (coin.price_change_percentage_30d_in_currency !== undefined) confidenceFactors++;
  if (coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 0) confidenceFactors++;

  // Market position (higher rank = more data reliability)
  if (coin.market_cap_rank <= 10) confidenceFactors += 3;
  else if (coin.market_cap_rank <= 50) confidenceFactors += 2;
  else if (coin.market_cap_rank <= 100) confidenceFactors += 1;

  // Volume indicates active market
  if (coin.total_volume > 10_000_000) confidenceFactors++;

  if (confidenceFactors >= 7) return "High";
  if (confidenceFactors >= 4) return "Medium";
  return "Low";
}

/** Assign risk label based on score, factors, and market characteristics. */
function assignRiskLabel(
  outlookScore: number,
  factors: ScoreFactors,
  coin: CoinData,
): RiskLabel {
  // Do Not Invest: severe warning signals
  if (
    factors.liquidity < 15 ||
    factors.marketCapMaturity < 20 ||
    (coin.market_cap_rank > 300 && factors.volatility < 25) ||
    (coin.total_volume < 500_000 && coin.market_cap < 5_000_000)
  ) {
    return "Do Not Invest";
  }

  // Safer: strong fundamentals across the board
  if (
    outlookScore >= 68 &&
    factors.liquidity >= 60 &&
    factors.marketCapMaturity >= 60 &&
    factors.volatility >= 50
  ) {
    return "Safer";
  }

  // Riskier but High Potential: high volatility but strong momentum/catalysts
  if (
    factors.momentum >= 65 &&
    factors.volumeTrend >= 50 &&
    factors.volatility < 50 &&
    factors.liquidity >= 35
  ) {
    return "Riskier but High Potential";
  }

  // Default: Riskier
  if (outlookScore >= 35) return "Riskier";

  // Very low scores → still Riskier but might be Do Not Invest
  return outlookScore < 25 ? "Do Not Invest" : "Riskier";
}

// ---------------------------------------------------------------------------
// Explanation Generation
// ---------------------------------------------------------------------------

function generateBullishCase(
  coin: CoinData,
  factors: ScoreFactors,
  outlookScore: number,
): string {
  const parts: string[] = [];

  if (factors.momentum > 65)
    parts.push(`positive price momentum across multiple timeframes`);
  if (factors.liquidity > 65)
    parts.push(`strong liquidity and trading volume`);
  if (factors.marketCapMaturity > 70)
    parts.push(`established market position with large market cap`);
  if (factors.trendPersistence > 70)
    parts.push(`consistent directional trend`);
  if (factors.volumeTrend > 60)
    parts.push(`elevated trading activity relative to market cap`);

  if (parts.length === 0) {
    if (outlookScore >= 50) return `Market metrics suggest moderate stability.`;
    return `Limited positive signals detected in current data.`;
  }

  return `Potential strengths: ${parts.slice(0, 3).join("; ")}.`;
}

function generateBearishCase(
  coin: CoinData,
  factors: ScoreFactors,
): string {
  const parts: string[] = [];

  if (factors.volatility < 40) parts.push(`elevated volatility`);
  if (factors.liquidity < 40) parts.push(`limited liquidity`);
  if (factors.marketCapMaturity < 40) parts.push(`lower market cap maturity`);
  if (factors.momentum < 35) parts.push(`negative price momentum`);
  if (factors.trendPersistence < 35) parts.push(`inconsistent trend direction`);

  if (parts.length === 0) return `Risk factors appear moderate based on current data.`;

  return `Key concerns: ${parts.slice(0, 3).join("; ")}.`;
}

function generateReasons(
  coin: CoinData,
  factors: ScoreFactors,
  riskLabel: RiskLabel,
): string[] {
  const reasons: string[] = [];

  // Liquidity reasons
  if (factors.liquidity > 70)
    reasons.push(`Strong liquidity with $${(coin.total_volume / 1_000_000).toFixed(0)}M daily volume`);
  else if (factors.liquidity < 30)
    reasons.push(`Low liquidity — trading may face slippage`);

  // Volatility reasons
  if (factors.volatility > 75)
    reasons.push(`Stable price range over 24 hours`);
  else if (factors.volatility < 35)
    reasons.push(`High intraday price swings`);

  // Market cap reasons
  if (coin.market_cap_rank <= 10)
    reasons.push(`Top ${coin.market_cap_rank} cryptocurrency by market cap`);
  else if (coin.market_cap_rank > 200)
    reasons.push(`Ranked #${coin.market_cap_rank} — smaller market position`);

  // Momentum reasons
  const d1 = coin.price_change_percentage_24h ?? 0;
  if (d1 > 5) reasons.push(`Up ${d1.toFixed(1)}% in 24h`);
  if (d1 < -5) reasons.push(`Down ${Math.abs(d1).toFixed(1)}% in 24h`);

  // Risk label specific reasons
  if (riskLabel === "Do Not Invest")
    reasons.push(`Insufficient market depth or structural concerns`);
  if (riskLabel === "Safer")
    reasons.push(`Relatively stronger market structure and lower risk profile`);

  return reasons;
}

function generateOutlookTexts(
  factors: ScoreFactors,
  riskLabel: RiskLabel,
  outlookScore: number,
): {
  shortTerm: string;
  mediumTerm: string;
  upside: string;
  downside: string;
} {
  const isHighMomentum = factors.momentum > 65;
  const isHighVol = factors.volatility < 40;
  const isLiquid = factors.liquidity > 60;

  let shortTerm: string;
  let mediumTerm: string;
  let upside: string;
  let downside: string;

  if (riskLabel === "Safer") {
    shortTerm = "Likely to maintain relative stability in the near term.";
    mediumTerm = "Continued steady performance expected if market conditions hold.";
    upside = "Gradual appreciation if broader market sentiment improves.";
    downside = "Limited downside compared to more volatile assets, but macro shifts remain a factor.";
  } else if (riskLabel === "Riskier but High Potential") {
    shortTerm = isHighMomentum
      ? "Momentum may continue in the short term if volume sustains."
      : "Uncertain short-term direction; watch for volume confirmation.";
    mediumTerm = "Outcome depends heavily on whether current catalysts persist.";
    upside = "Could see significant gains if momentum and attention continue.";
    downside = "Volatility may lead to sharp pullbacks if sentiment shifts.";
  } else if (riskLabel === "Riskier") {
    shortTerm = "Heightened uncertainty; price may swing in either direction.";
    mediumTerm = "Requires improvement in market fundamentals to sustain gains.";
    upside = "Possible recovery if broader market turns bullish.";
    downside = "Elevated risk of continued decline under current conditions.";
  } else {
    // Do Not Invest
    shortTerm = "Not recommended for near-term positions given current risk signals.";
    mediumTerm = "Structural concerns need to be resolved before reassessing.";
    upside = "Speculative recovery is possible but not supported by current data.";
    downside = "Risk of further decline or illiquidity events remains elevated.";
  }

  return { shortTerm, mediumTerm, upside, downside };
}

function generateRiskExplanation(
  riskLabel: RiskLabel,
  coin: CoinData,
  factors: ScoreFactors,
): string {
  const name = coin.name;

  switch (riskLabel) {
    case "Safer":
      return `${name} shows relatively stronger liquidity, established market structure, and lower extreme volatility — more resilient under current market conditions.`;
    case "Riskier but High Potential":
      return `${name} shows strong short-term momentum and market attention, but volatility and uncertainty remain elevated. Upside exists if conditions hold, but risk of sharp pullbacks is real.`;
    case "Riskier":
      return `${name} has elevated volatility, uncertain trend strength, or weaker liquidity. Requires caution and position sizing discipline.`;
    case "Do Not Invest":
      return `${name} shows severe warning signals including very low liquidity, structural instability, or unfavorable risk-reward. Not recommended for new positions.`;
    default:
      return `Unable to provide assessment for ${name} due to insufficient data.`;
  }
}

// ---------------------------------------------------------------------------
// Main Assessment Function
// ---------------------------------------------------------------------------

export function assessRisk(
  coin: CoinData,
  macroMarketChange: number,
  newsSentiment?: number,
): RiskAssessment {
  const factors = calculateScoreFactors(coin, macroMarketChange, newsSentiment);
  const outlookScore = calculateOutlookScore(factors);
  const outlookCategory = scoreToCategory(outlookScore);
  const confidence = determineConfidence(coin);
  const riskLabel = assignRiskLabel(outlookScore, factors, coin);

  const bullishCase = generateBullishCase(coin, factors, outlookScore);
  const bearishCase = generateBearishCase(coin, factors);
  const reasons = generateReasons(coin, factors, riskLabel);
  const outlookTexts = generateOutlookTexts(factors, riskLabel, outlookScore);

  return {
    coinId: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    riskLabel,
    confidence,
    outlookScore,
    outlookCategory,
    bullishCase,
    bearishCase,
    reasons,
    factors,
    shortTermOutlook: outlookTexts.shortTerm,
    mediumTermOutlook: outlookTexts.mediumTerm,
    mainUpsideCatalyst: outlookTexts.upside,
    mainDownsideRisk: outlookTexts.downside,
    newsSentiment: factors.newsSentiment,
  };
}

/** Batch assess multiple coins. */
export function assessMultipleCoins(
  coins: CoinData[],
  macroMarketChange: number,
): RiskAssessment[] {
  return coins.map((coin) => assessRisk(coin, macroMarketChange));
}
