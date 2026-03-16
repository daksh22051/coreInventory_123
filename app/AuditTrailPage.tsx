"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, Search, Filter, Download, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, Package, Truck, ArrowRightLeft, ClipboardCheck, User, Settings,
  Calendar, Clock, Loader2, Activity, ShieldCheck, Boxes, Sparkles, SlidersHorizontal, Gauge,
} from "lucide-react";
import ExportButton from "./ExportButton";

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

interface ActivityLog {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  user: { _id: string; name: string; email: string } | string;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const actionIcons: Record<string, React.ElementType> = {
  product_created: Plus,
  product_updated: Edit,
  product_deleted: Trash2,
  receipt_created: Package,
  receipt_done: ClipboardCheck,
  delivery_created: Truck,
  delivery_delivered: Truck,
  transfer_created: ArrowRightLeft,
  transfer_completed: ArrowRightLeft,
  adjustment_created: ClipboardCheck,
  user_login: User,
  settings_updated: Settings,
};

const actionColors: Record<string, string> = {
  created: "bg-emerald-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  done: "bg-emerald-500",
  delivered: "bg-purple-500",
  completed: "bg-teal-500",
  login: "bg-sky-500",
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return "bg-gray-500";
}

function getActionIcon(action: string): React.ElementType {
  return actionIcons[action] || History;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettifyAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionQuickFilter, setActionQuickFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [liveMode, setLiveMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (entityFilter !== "all") params.set("entity", entityFilter);

      const res = await fetch(`${API_BASE}/api/analytics/activity-logs?${params}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!liveMode) {
      return;
    }

    const timer = window.setInterval(() => {
      fetchLogs();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [liveMode, fetchLogs]);

  const filteredAndSortedLogs = logs
    .filter((log) => {
      if (actionQuickFilter === "all") return true;
      if (actionQuickFilter === "created") return log.action.includes("created");
      if (actionQuickFilter === "updated") return log.action.includes("updated");
      if (actionQuickFilter === "deleted") return log.action.includes("deleted");
      if (actionQuickFilter === "auth") return log.action.includes("login") || log.action.includes("otp") || log.action.includes("password");
      if (actionQuickFilter === "transfer") return log.action.includes("transfer");
      return true;
    })
    .sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? tB - tA : tA - tB;
    });

  // Group logs by date
  const groupedLogs = filteredAndSortedLogs.reduce<Record<string, ActivityLog[]>>((groups, log) => {
    const date = formatDate(log.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {});

  const todayCount = groupedLogs[formatDate(new Date().toISOString())]?.length || 0;
  const transferEvents = filteredAndSortedLogs.filter((log) => log.entity === "Transfer").length;
  const uniqueUsers = new Set(
    filteredAndSortedLogs.map((log) => (typeof log.user === "object" ? log.user.name : "System"))
  ).size;
  const createdEvents = filteredAndSortedLogs.filter((log) => log.action.includes("created")).length;

  const entityTypes = ["all", "Product", "Receipt", "DeliveryOrder", "Transfer", "InventoryAdjustment", "User"];
  const quickActionFilters = [
    { id: "all", label: "All Events" },
    { id: "created", label: "Created" },
    { id: "updated", label: "Updated" },
    { id: "deleted", label: "Deleted" },
    { id: "transfer", label: "Transfers" },
    { id: "auth", label: "Auth" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <History size={22} className="text-indigo-400" />
            </div>
            Audit Trail
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Track all system activities and changes</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiveMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              liveMode
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-[var(--glass-border)] bg-[var(--card-bg)] text-[var(--text-secondary)]"
            }`}
          >
            <Gauge size={14} />
            {liveMode ? "Live ON" : "Live OFF"}
          </button>
          <ExportButton type="activity-logs" label="Export Logs" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--card-bg)]
              hover:border-[var(--glass-border-hover)] text-[var(--text-secondary)] transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[linear-gradient(125deg,rgba(79,70,229,0.12),rgba(6,182,212,0.08),rgba(236,72,153,0.08))] p-5"
      >
        <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles size={13} />
              Live Integrity Pulse
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{filteredAndSortedLogs.length} events currently in scope</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {lastUpdated ? `Last synced at ${formatTime(lastUpdated.toISOString())}` : "Sync pending"} · {createdEvents} create actions captured.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-200/70 bg-white/65 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Sort Mode</p>
            <div className="mt-2 inline-flex rounded-lg border border-[var(--glass-border)] bg-[var(--hover-bg)] p-1">
              <button
                onClick={() => setSortOrder("newest")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${sortOrder === "newest" ? "bg-white text-indigo-700 shadow-sm" : "text-[var(--text-secondary)]"}`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortOrder("oldest")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${sortOrder === "oldest" ? "bg-white text-indigo-700 shadow-sm" : "text-[var(--text-secondary)]"}`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 rounded-2xl"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/70 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Visible Logs</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <Activity size={16} className="text-indigo-500" />
              {filteredAndSortedLogs.length}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/70 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Today</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <Calendar size={16} className="text-emerald-500" />
              {todayCount}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/70 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Transfer Events</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <Boxes size={16} className="text-sky-500" />
              {transferEvents}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/70 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Actors</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
              <ShieldCheck size={16} className="text-violet-500" />
              {uniqueUsers}
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--hover-bg)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            <SlidersHorizontal size={12} />
            Quick Filters
          </span>
          {quickActionFilters.map((item) => (
            <button
              key={item.id}
              onClick={() => setActionQuickFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                actionQuickFilter === item.id
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-[var(--hover-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search activity logs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--hover-bg)] border border-[var(--glass-border)]
                text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
                focus:outline-none focus:border-[var(--neon-cyan)] transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)]
              bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--glass-border-hover)]
              text-sm font-medium transition-colors"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
                {entityTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { setEntityFilter(type); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      entityFilter === type
                        ? "bg-[var(--accent-color,#10b981)] text-white"
                        : "bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {type === "all" ? "All" : type.replace(/([A-Z])/g, " $1").trim()}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : filteredAndSortedLogs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 rounded-2xl text-center"
        >
          <History size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No activity logs found</h3>
          <p className="text-[var(--text-muted)] text-sm mt-1">Activity will appear here as actions are performed</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={14} className="text-[var(--text-muted)]" />
                <span className="text-sm font-semibold text-[var(--text-muted)]">{date}</span>
                <span className="rounded-full bg-[var(--hover-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                  {dateLogs.length} events
                </span>
                <div className="flex-1 h-px bg-[var(--glass-border)]" />
              </div>

              {/* Timeline Items */}
              <div className="relative pl-8 space-y-1">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--glass-border)]" />

                {dateLogs.map((log, index) => {
                  const Icon = getActionIcon(log.action);
                  const color = getActionColor(log.action);
                  const userName = typeof log.user === "object" ? log.user.name : "System";

                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="relative glass-card p-4 rounded-xl hover:border-[var(--glass-border-hover)]
                        transition-all group"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-8 top-5 w-[22px] h-[22px] rounded-full ${color}
                        flex items-center justify-center ring-4 ring-[var(--background)]`}>
                        <Icon size={10} className="text-white" />
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[var(--hover-bg)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                              {prettifyAction(log.action)}
                            </span>
                            {log.entityId && (
                              <span className="rounded-md border border-[var(--glass-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                                ID: {log.entityId.slice(-8)}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                            {log.details || log.action.replace(/_/g, " ")}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {userName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(log.createdAt)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--hover-bg)] font-medium">
                              {log.entity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-[var(--glass-border)] bg-[var(--card-bg)]
              text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--glass-border-hover)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-[var(--glass-border)] bg-[var(--card-bg)]
              text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--glass-border-hover)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
