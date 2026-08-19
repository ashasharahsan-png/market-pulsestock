import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  Activity,
  Eye,
  Lock,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <Zap className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Nexus</span>
          </div>
          <button
            onClick={handleCTA}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] text-muted-foreground mb-8">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live market intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              Crypto market data,
              <br />
              <span className="text-muted-foreground">transparent risk analysis.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Track 100+ cryptocurrencies in real time. Understand risk through transparent scoring.
              Make informed decisions with clear data, not speculation.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCTA}
                className="flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {user ? "Open Dashboard" : "Start Tracking"}
                <ArrowRight className="size-4" />
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 px-6 py-3 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Learn more
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Preview Strip */}
      <section className="border-y border-border bg-muted/10 py-6 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <LiveTicker />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Built for informed investors
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every feature is designed to help you understand risk, track performance,
              and make data-driven decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Activity className="size-5" />}
              title="Real-time market data"
              description="Live prices, volume, market cap, and 7-day sparklines for 100+ cryptocurrencies. Auto-refreshes every 60 seconds."
            />
            <FeatureCard
              icon={<Shield className="size-5" />}
              title="Transparent risk scoring"
              description="Every asset gets a clear outlook score based on momentum, liquidity, volatility, and market structure. See exactly why."
            />
            <FeatureCard
              icon={<BarChart3 className="size-5" />}
              title="Portfolio analytics"
              description="Track holdings, calculate P&L, see allocation weights, and get concentration warnings. All client-side, always private."
            />
            <FeatureCard
              icon={<Eye className="size-5" />}
              title="Risk & opportunity view"
              description="Assets categorized as Safer, Riskier, High Potential, or Avoid — with confidence levels and plain-English reasoning."
            />
            <FeatureCard
              icon={<TrendingUp className="size-5" />}
              title="Movers & watchlist"
              description="Top gainers, top losers, and a personal watchlist with change-since-added tracking. Never miss an opportunity."
            />
            <FeatureCard
              icon={<Lock className="size-5" />}
              title="Private by default"
              description="Portfolio data stays in your browser. No accounts required for market data. No data sold. No tracking."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Start with clear data
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            No paid tiers. No gated features. Real market data with transparent analysis,
            built for people who want to understand risk before they invest.
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {user ? "Open Dashboard" : "Get Started Free"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-foreground text-background">
              <Zap className="size-3" />
            </div>
            <span className="text-xs font-medium">Nexus</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center sm:text-right max-w-md">
            For research and informational purposes only. Not financial advice.
            This platform does not guarantee returns. Predictions are probabilistic.
            Always do your own research.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="p-5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
    >
      <div className="size-9 rounded-md bg-muted flex items-center justify-center text-foreground mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function LiveTicker() {
  // A simple static ticker for the landing page
  const items = [
    { symbol: "BTC", price: "Loading...", change: "" },
    { symbol: "ETH", price: "Loading...", change: "" },
    { symbol: "SOL", price: "Loading...", change: "" },
    { symbol: "BNB", price: "Loading...", change: "" },
    { symbol: "XRP", price: "Loading...", change: "" },
  ];

  return (
    <div className="flex items-center gap-8 text-xs">
      {items.map((item) => (
        <div key={item.symbol} className="flex items-center gap-2">
          <span className="font-medium text-muted-foreground">{item.symbol}</span>
          <span className="tabular-nums text-foreground">{item.price}</span>
        </div>
      ))}
    </div>
  );
}
