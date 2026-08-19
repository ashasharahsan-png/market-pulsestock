import { useState, useMemo } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertTriangle, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/api";
import type { RiskAssessment, RiskLabel } from "@/types/market";

interface RiskOpportunityProps {
  assessments: RiskAssessment[];
  onSelectCoin: (coinId: string) => void;
  isLoading: boolean;
}

const RISK_CONFIG: Record<
  RiskLabel,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  Safer: {
    icon: <Shield className="size-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20",
    description: "Relatively stronger liquidity, stronger market structure, lower extreme volatility.",
  },
  Riskier: {
    icon: <AlertTriangle className="size-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/20",
    description: "Elevated volatility, weak trend structure, uncertain catalyst strength.",
  },
  "Riskier but High Potential": {
    icon: <Zap className="size-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20",
    description: "High volatility but momentum and market attention suggest possible upside.",
  },
  "Do Not Invest": {
    icon: <TrendingDown className="size-4" />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/5",
    borderColor: "border-red-500/20",
    description: "Severe warning signals. Not recommended for new positions.",
  },
};

export function RiskOpportunity({ assessments, onSelectCoin, isLoading }: RiskOpportunityProps) {
  const [expandedLabel, setExpandedLabel] = useState<RiskLabel | null>(null);

  const grouped = useMemo(() => {
    const map: Record<RiskLabel, RiskAssessment[]> = {
      Safer: [],
      Riskier: [],
      "Riskier but High Potential": [],
      "Do Not Invest": [],
    };
    for (const a of assessments) {
      map[a.riskLabel].push(a);
    }
    // Sort each group by outlook score descending
    for (const key of Object.keys(map) as RiskLabel[]) {
      map[key].sort((a, b) => b.outlookScore - a.outlookScore);
    }
    return map;
  }, [assessments]);

  if (isLoading && assessments.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const labels: RiskLabel[] = [
    "Safer",
    "Riskier but High Potential",
    "Riskier",
    "Do Not Invest",
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <ShieldAlert className="size-4 text-muted-foreground" />
          Risk & Opportunity
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {assessments.length} assessed
        </span>
      </div>

      {/* Score Model Legend */}
      <div className="mb-4 p-3 rounded-lg border border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Outlook Score (0–100)</span> is a weighted composite of:
          momentum, volume trend, volatility, liquidity, market cap maturity, news sentiment, macro context,
          trend persistence, and drawdown behavior. Labels are decision-support signals, not predictions.
        </p>
      </div>

      {/* Risk Categories */}
      <div className="space-y-3">
        {labels.map((label) => {
          const items = grouped[label];
          const config = RISK_CONFIG[label];
          const isExpanded = expandedLabel === label;

          return (
            <div
              key={label}
              className={cn("rounded-lg border", config.borderColor, config.bgColor)}
            >
              <button
                onClick={() => setExpandedLabel(isExpanded ? null : label)}
                className="w-full flex items-center justify-between px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className={config.color}>{config.icon}</span>
                  <span className={cn("text-xs font-semibold", config.color)}>
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({items.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Description (always visible) */}
              <div className="px-3 pb-2">
                <p className="text-[10px] text-muted-foreground">{config.description}</p>
              </div>

              {/* Expanded list */}
              {isExpanded && items.length > 0 && (
                <div className="border-t border-border/50 divide-y divide-border/50">
                  {items.map((item) => (
                    <RiskRow
                      key={item.coinId}
                      assessment={item}
                      onClick={() => onSelectCoin(item.coinId)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskRow({
  assessment,
  onClick,
}: {
  assessment: RiskAssessment;
  onClick: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="px-3 py-2.5 hover:bg-muted/30 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <img src={assessment.image} alt="" className="size-5 rounded-full" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {assessment.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {assessment.symbol}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OutlookScore score={assessment.outlookScore} />
          <ConfidenceBadge level={assessment.confidence} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? "Less" : "Why"}
          </button>
        </div>
      </div>

      {/* Detail expansion */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {assessment.reasons.join(". ")}.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-emerald-500 font-medium">Bullish:</span>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                {assessment.bullishCase}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-red-500 font-medium">Bearish:</span>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                {assessment.bearishCase}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Short-term: {assessment.shortTermOutlook}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OutlookScore({ score }: { score: number }) {
  let color = "text-emerald-500";
  if (score < 30) color = "text-red-500";
  else if (score < 50) color = "text-amber-500";
  else if (score < 70) color = "text-blue-500";

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color.replace("text-", "bg-"))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-[10px] font-medium tabular-nums", color)}>
        {score}
      </span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    High: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Low: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
        colors[level] || colors.Medium,
      )}
    >
      {level}
    </span>
  );
}
