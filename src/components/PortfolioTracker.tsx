import { useState, useMemo } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit3,
  Check,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatPercent, formatMarketCap } from "@/lib/api";
import type { CoinData, PortfolioCalculation } from "@/types/market";

interface PortfolioTrackerProps {
  calculations: PortfolioCalculation[];
  coins: CoinData[];
  onAdd: (holding: {
    coinId: string;
    symbol: string;
    name: string;
    image: string;
    buyPrice: number;
    quantity: number;
  }) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: { quantity?: number; buyPrice?: number }) => void;
  getSummary: (calcs: PortfolioCalculation[]) => {
    totalInvested: number;
    totalValue: number;
    totalPL: number;
    totalPLPercent: number;
    topWinner?: PortfolioCalculation;
    topLoser?: PortfolioCalculation;
    warnings: string[];
    holdingsCount: number;
  };
}

export function PortfolioTracker({
  calculations,
  coins,
  onAdd,
  onRemove,
  onUpdate,
  getSummary,
}: PortfolioTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    coinId: "",
    quantity: "",
    buyPrice: "",
  });

  const summary = useMemo(() => getSummary(calculations), [calculations, getSummary]);

  const handleAdd = () => {
    const coin = coins.find((c) => c.id === form.coinId);
    if (!coin || !form.quantity || !form.buyPrice) return;
    onAdd({
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      buyPrice: parseFloat(form.buyPrice),
      quantity: parseFloat(form.quantity),
    });
    setForm({ coinId: "", quantity: "", buyPrice: "" });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          Portfolio
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="size-3" />
          Add Holding
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <SummaryCard
          label="Total Invested"
          value={formatPrice(summary.totalInvested)}
        />
        <SummaryCard
          label="Current Value"
          value={formatPrice(summary.totalValue)}
        />
        <SummaryCard
          label="Unrealized P/L"
          value={formatPrice(Math.abs(summary.totalPL))}
          suffix={summary.totalPL >= 0 ? "+" : "-"}
          className={summary.totalPL >= 0 ? "text-emerald-500" : "text-red-500"}
        />
        <SummaryCard
          label="P/L %"
          value={formatPercent(summary.totalPLPercent)}
          className={summary.totalPLPercent >= 0 ? "text-emerald-500" : "text-red-500"}
        />
      </div>

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {summary.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10"
            >
              <AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-600 dark:text-amber-400">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top winners/losers */}
      {summary.holdingsCount > 0 && (
        <div className="flex gap-2 mb-4">
          {summary.topWinner && summary.topWinner.unrealizedPL > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-xs">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Top: {summary.topWinner.holding.name}
              </span>
              <span className="text-emerald-500 tabular-nums">
                {formatPercent(summary.topWinner.unrealizedPLPercent)}
              </span>
            </div>
          )}
          {summary.topLoser && summary.topLoser.unrealizedPL < 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/5 border border-red-500/10 text-xs">
              <TrendingDown className="size-3 text-red-500" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                Worst: {summary.topLoser.holding.name}
              </span>
              <span className="text-red-500 tabular-nums">
                {formatPercent(summary.topLoser.unrealizedPLPercent)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-medium">Add New Holding</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={form.coinId}
              onChange={(e) => setForm((f) => ({ ...f, coinId: e.target.value }))}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select coin...</option>
              {coins.slice(0, 50).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.symbol.toUpperCase()})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              step="any"
              min="0"
            />
            <input
              type="number"
              placeholder="Buy Price (USD)"
              value={form.buyPrice}
              onChange={(e) => setForm((f) => ({ ...f, buyPrice: e.target.value }))}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              step="any"
              min="0"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={!form.coinId || !form.quantity || !form.buyPrice}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-foreground text-background disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Check className="size-3" />
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ coinId: "", quantity: "", buyPrice: "" });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="size-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {calculations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          <Briefcase className="size-8 mx-auto mb-2 opacity-30" />
          <p>No holdings yet. Add your first position to track your portfolio.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Asset</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Buy</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Current</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Value</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">P/L</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">%</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Weight</th>
                <th className="text-center px-3 py-2 font-medium text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody>
              {calculations.map((calc) => (
                <HoldingRow
                  key={calc.holding.id}
                  calc={calc}
                  isEditing={editingId === calc.holding.id}
                  onEdit={() => setEditingId(calc.holding.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(updates) => {
                    onUpdate(calc.holding.id, updates);
                    setEditingId(null);
                  }}
                  onRemove={() => onRemove(calc.holding.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Diversification Note */}
      {calculations.length >= 2 && (
        <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <span>
            {calculations.length} positions across your portfolio.
            {summary.warnings.length === 0
              ? " Allocation appears reasonably diversified."
              : " Review warnings above for concentration risks."}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  suffix,
  className,
}: {
  label: string;
  value: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className="p-2.5 rounded-lg border border-border bg-muted/20">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-sm font-medium tabular-nums", className)}>
        {suffix && <span className="text-xs mr-0.5">{suffix}</span>}
        {value}
      </div>
    </div>
  );
}

function HoldingRow({
  calc,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: {
  calc: PortfolioCalculation;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updates: { quantity?: number; buyPrice?: number }) => void;
  onRemove: () => void;
}) {
  const [editQty, setEditQty] = useState(calc.holding.quantity.toString());
  const [editPrice, setEditPrice] = useState(calc.holding.buyPrice.toString());

  if (isEditing) {
    return (
      <tr className="border-b border-border/50 bg-muted/20">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <img src={calc.holding.image} alt="" className="size-5 rounded-full" />
            <span className="font-medium">{calc.holding.name}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            className="w-16 h-6 rounded border border-border bg-card px-1 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            step="any"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="w-20 h-6 rounded border border-border bg-card px-1 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            step="any"
          />
        </td>
        <td className="px-3 py-2 text-right tabular-nums">{formatPrice(calc.currentPrice)}</td>
        <td className="px-3 py-2 text-right tabular-nums">{formatPrice(calc.currentValue)}</td>
        <td className="px-3 py-2 text-right tabular-nums" colSpan={2}></td>
        <td className="px-3 py-2 hidden sm:table-cell"></td>
        <td className="px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-1" onClick={() => onSave({
            quantity: parseFloat(editQty) || calc.holding.quantity,
            buyPrice: parseFloat(editPrice) || calc.holding.buyPrice,
          })}>
            <button className="p-1 rounded hover:bg-muted"><Check className="size-3 text-emerald-500" /></button>
            <button onClick={onCancelEdit} className="p-1 rounded hover:bg-muted"><X className="size-3 text-muted-foreground" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <img src={calc.holding.image} alt="" className="size-5 rounded-full" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{calc.holding.name}</span>
            <span className="text-[10px] text-muted-foreground">{calc.holding.symbol}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
        {calc.holding.quantity}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
        {formatPrice(calc.holding.buyPrice)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
        {formatPrice(calc.currentPrice)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-foreground font-medium">
        {formatPrice(calc.currentValue)}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right tabular-nums font-medium",
          calc.unrealizedPL >= 0 ? "text-emerald-500" : "text-red-500",
        )}
      >
        {calc.unrealizedPL >= 0 ? "+" : ""}
        {formatPrice(Math.abs(calc.unrealizedPL))}
      </td>
      <td
        className={cn(
          "px-3 py-2.5 text-right tabular-nums font-medium",
          calc.unrealizedPLPercent >= 0 ? "text-emerald-500" : "text-red-500",
        )}
      >
        {formatPercent(calc.unrealizedPLPercent)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
        {calc.allocationWeight.toFixed(1)}%
      </td>
      <td className="px-3 py-2.5 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onEdit} className="p-1 rounded hover:bg-muted transition-colors" title="Edit">
            <Edit3 className="size-3 text-muted-foreground" />
          </button>
          <button onClick={onRemove} className="p-1 rounded hover:bg-muted transition-colors" title="Remove">
            <Trash2 className="size-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}
