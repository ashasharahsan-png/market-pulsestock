import { useState, useCallback, useMemo } from "react";
import type { PortfolioHolding, PortfolioCalculation } from "@/types/market";

const STORAGE_KEY = "nexus-portfolio";

function loadPortfolio(): PortfolioHolding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePortfolio(holdings: PortfolioHolding[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(loadPortfolio);

  const addHolding = useCallback(
    (holding: Omit<PortfolioHolding, "id" | "addedAt">) => {
      setHoldings((prev) => {
        const newHolding: PortfolioHolding = {
          ...holding,
          id: `${holding.coinId}-${Date.now()}`,
          addedAt: Date.now(),
        };
        const updated = [...prev, newHolding];
        savePortfolio(updated);
        return updated;
      });
    },
    [],
  );

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      savePortfolio(updated);
      return updated;
    });
  }, []);

  const updateHolding = useCallback(
    (id: string, updates: Partial<Pick<PortfolioHolding, "quantity" | "buyPrice">>) => {
      setHoldings((prev) => {
        const updated = prev.map((h) =>
          h.id === id ? { ...h, ...updates } : h,
        );
        savePortfolio(updated);
        return updated;
      });
    },
    [],
  );

  const calculations = useMemo((): PortfolioCalculation[] => {
    // We need current prices — these will be passed in from market data
    // For now, return empty; the component will merge with price data
    return holdings.map((h) => ({
      holding: h,
      currentPrice: 0,
      currentValue: 0,
      totalCost: h.buyPrice * h.quantity,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      allocationWeight: 0,
    }));
  }, [holdings]);

  // Calculate with real prices (called by component)
  const calculateWithPrices = useCallback(
    (priceMap: Map<string, number>): PortfolioCalculation[] => {
      let totalValue = 0;
      const totals = holdings.map((h) => {
        const currentPrice = priceMap.get(h.coinId) ?? 0;
        const currentValue = currentPrice * h.quantity;
        const totalCost = h.buyPrice * h.quantity;
        totalValue += currentValue;
        return {
          holding: h,
          currentPrice,
          currentValue,
          totalCost,
          unrealizedPL: currentValue - totalCost,
          unrealizedPLPercent: totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0,
          allocationWeight: 0, // calculated below
        };
      });

      // Calculate allocation weights
      return totals.map((t) => ({
        ...t,
        allocationWeight: totalValue > 0 ? (t.currentValue / totalValue) * 100 : 0,
      }));
    },
    [holdings],
  );

  // Portfolio summary
  const getSummary = useCallback(
    (calculations: PortfolioCalculation[]) => {
      const totalInvested = calculations.reduce((sum, c) => sum + c.totalCost, 0);
      const totalValue = calculations.reduce((sum, c) => sum + c.currentValue, 0);
      const totalPL = totalValue - totalInvested;
      const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

      const sorted = [...calculations].sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent);
      const topWinner = sorted[0];
      const topLoser = sorted[sorted.length - 1];

      // Concentration warnings
      const warnings: string[] = [];
      const maxAllocation = Math.max(...calculations.map((c) => c.allocationWeight), 0);
      if (maxAllocation > 40) {
        warnings.push("Large exposure to a single asset may increase risk.");
      }
      if (maxAllocation > 60) {
        warnings.push("Portfolio is heavily concentrated in one position.");
      }

      // High-volatility exposure
      const highVolCount = calculations.filter((c) => c.allocationWeight > 20).length;
      if (highVolCount >= 3) {
        warnings.push("Portfolio is heavily concentrated in high-volatility assets.");
      }

      // Diversification check
      if (calculations.length <= 2 && calculations.length > 0) {
        warnings.push("Current allocation appears more speculative than diversified.");
      }

      return {
        totalInvested,
        totalValue,
        totalPL,
        totalPLPercent,
        topWinner: topWinner?.unrealizedPLPercent > 0 ? topWinner : undefined,
        topLoser: topLoser?.unrealizedPLPercent < 0 ? topLoser : undefined,
        warnings,
        holdingsCount: calculations.length,
      };
    },
    [],
  );

  return {
    holdings,
    calculations,
    addHolding,
    removeHolding,
    updateHolding,
    calculateWithPrices,
    getSummary,
  };
}
