import { useState, useCallback, useMemo } from "react";
import type { WatchlistItem } from "@/types/market";

const STORAGE_KEY = "nexus-watchlist";

function loadWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>(loadWatchlist);

  const toggle = useCallback(
    (coinId: string, symbol: string, name: string, image: string, currentPrice: number) => {
      setItems((prev) => {
        const exists = prev.find((i) => i.coinId === coinId);
        let updated: WatchlistItem[];
        if (exists) {
          updated = prev.filter((i) => i.coinId !== coinId);
        } else {
          updated = [
            ...prev,
            { coinId, symbol, name, image, addedAt: Date.now(), priceAtAdd: currentPrice },
          ];
        }
        saveWatchlist(updated);
        return updated;
      });
    },
    [],
  );

  const isWatchlisted = useCallback(
    (coinId: string) => items.some((i) => i.coinId === coinId),
    [items],
  );

  // Calculate change since added
  const getChangeSinceAdded = useCallback(
    (coinId: string, currentPrice: number) => {
      const item = items.find((i) => i.coinId === coinId);
      if (!item || item.priceAtAdd === 0) return null;
      return ((currentPrice - item.priceAtAdd) / item.priceAtAdd) * 100;
    },
    [items],
  );

  const watchlistIds = useMemo(() => new Set(items.map((i) => i.coinId)), [items]);

  return {
    items,
    watchlistIds,
    toggle,
    isWatchlisted,
    getChangeSinceAdded,
  };
}
