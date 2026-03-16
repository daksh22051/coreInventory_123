"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingDown, AlertTriangle, ShoppingCart, Package,
  ChevronRight, Loader2, RefreshCw, X, Zap, Clock,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) {
          headers.Authorization = "Bearer " + parsed.state.token;
        }
      } catch {}
    }
  }
  return headers;
}

interface Insight {
  type: "reorder" | "slow_mover" | "shortage" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
  productId?: string;
  productName?: string;
  metric?: string;
}

function getInsightIcon(type: string) {
  switch (type) {
    case "reorder": return ShoppingCart;
    case "slow_mover": return TrendingDown;
    case "shortage": return AlertTriangle;
    default: return Sparkles;
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
}

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/insights`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const parsed: Insight[] = [];

          // Reorder suggestions
          if (data.data.reorderSuggestions) {
            data.data.reorderSuggestions.slice(0, 3).forEach((item: Record<string, unknown>) => {
              parsed.push({
                type: "reorder",
                priority: "high",
                title: `Reorder: ${item.name}`,
                description: `Current stock: ${item.currentStock}. Suggested order: ${item.suggestedOrderQty} units.`,
                productName: item.name as string,
                productId: item._id as string,
                metric: `${item.daysUntilStockout} days left`,
              });
            });
          }

          // Slow movers
          if (data.data.slowMovers) {
            data.data.slowMovers.slice(0, 2).forEach((item: Record<string, unknown>) => {
              parsed.push({
                type: "slow_mover",
                priority: "medium",
                title: `Slow mover: ${item.name}`,
                description: `${item.currentStock} units in stock with low movement. Consider discounting.`,
                productName: item.name as string,
                productId: item._id as string,
              });
            });
          }

          // Shortage predictions
          if (data.data.shortagePredictions) {
            data.data.shortagePredictions.slice(0, 2).forEach((item: Record<string, unknown>) => {
              parsed.push({
                type: "shortage",
                priority: "high",
                title: `Stockout risk: ${item.name}`,
                description: `Predicted to run out in ${item.daysUntilStockout} days at current usage rate.`,
                productName: item.name as string,
                productId: item._id as string,
                metric: `${item.daysUntilStockout} days`,
              });
            });
          }

          setInsights(parsed.length > 0 ? parsed : getFallbackInsights());
        } else {
          setInsights(getFallbackInsights());
        }
      } else {
        setInsights(getFallbackInsights());
      }
    } catch {
      setInsights(getFallbackInsights());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const dismiss = (index: number) => {
    setDismissed(prev => new Set(prev).add(index));
  };

  const visibleInsights = insights.filter((_, i) => !dismissed.has(i));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-[var(--glass-border)]
        bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20
              border border-purple-500/30">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">AI Insights</h3>
              <p className="text-xs text-[var(--text-muted)]">Smart suggestions for your inventory</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchInsights}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]
              hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : visibleInsights.length === 0 ? (
          <div className="text-center py-6">
            <Zap size={32} className="mx-auto text-emerald-400 mb-2" />
            <p className="text-sm text-[var(--text-muted)]">All caught up! No action needed.</p>
          </div>
        ) : (
          <AnimatePresence>
            {visibleInsights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/50
                    hover:border-[var(--glass-border-hover)] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg ${getPriorityStyle(insight.priority)}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {insight.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                        {insight.description}
                      </p>
                      {insight.metric && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock size={10} className="text-[var(--text-muted)]" />
                          <span className="text-[10px] font-medium text-[var(--text-muted)]">{insight.metric}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(insights.indexOf(insight))}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--hover-bg)]
                        text-[var(--text-muted)] transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

function getFallbackInsights(): Insight[] {
  return [
    {
      type: "general",
      priority: "low",
      title: "Inventory is looking good",
      description: "No critical actions needed at this time. Keep monitoring stock levels.",
    },
  ];
}
