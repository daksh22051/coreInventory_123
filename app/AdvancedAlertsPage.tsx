"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  AlertTriangle,
  Package,
  TrendingDown,
  Calendar,
  Settings,
  X,
  Check,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ShoppingCart,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) headers.Authorization = "Bearer " + parsed.state.token;
      } catch {}
    }
  }
  return headers;
}

interface AlertRule {
  id: string;
  _id?: string;
  name: string;
  type: "low_stock" | "overstock" | "expiry" | "reorder_point";
  condition: {
    threshold?: number;
    daysBeforeExpiry?: number;
    productIds?: string[];
    categoryIds?: string[];
  };
  enabled: boolean;
  notifyEmail: boolean;
  notifyDashboard: boolean;
  createdAt: string;
}

function normalizeRule(rule: Partial<AlertRule> & { _id?: string; id?: string }): AlertRule {
  return {
    id: String(rule.id || rule._id || Date.now()),
    _id: rule._id,
    name: String(rule.name || "Untitled Rule"),
    type: (rule.type as AlertRule["type"]) || "low_stock",
    condition: rule.condition || {},
    enabled: rule.enabled ?? true,
    notifyEmail: rule.notifyEmail ?? true,
    notifyDashboard: rule.notifyDashboard ?? true,
    createdAt: String(rule.createdAt || new Date().toISOString()),
  };
}

interface ActiveAlert {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  currentValue?: number;
  threshold?: number;
  createdAt: string;
  acknowledged: boolean;
}

const ALERT_TYPES = [
  { value: "low_stock", label: "Low Stock", icon: TrendingDown, color: "text-amber-500" },
  { value: "overstock", label: "Overstock", icon: Package, color: "text-blue-500" },
  { value: "expiry", label: "Expiry Warning", icon: Calendar, color: "text-red-500" },
  { value: "reorder_point", label: "Reorder Point", icon: ShoppingCart, color: "text-purple-500" },
];

const DEMO_ALERTS: ActiveAlert[] = [
  {
    id: "1",
    type: "low_stock",
    severity: "critical",
    title: "Critical Low Stock",
    message: "iPhone 15 Pro has only 3 units remaining",
    productName: "iPhone 15 Pro",
    currentValue: 3,
    threshold: 10,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    acknowledged: false,
  },
  {
    id: "2",
    type: "low_stock",
    severity: "warning",
    title: "Low Stock Warning",
    message: "MacBook Air M2 is below reorder point",
    productName: "MacBook Air M2",
    currentValue: 8,
    threshold: 15,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    acknowledged: false,
  },
  {
    id: "3",
    type: "overstock",
    severity: "info",
    title: "Overstock Alert",
    message: "USB-C Cables exceed optimal stock level",
    productName: "USB-C Cables",
    currentValue: 500,
    threshold: 200,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    acknowledged: true,
  },
  {
    id: "4",
    type: "expiry",
    severity: "warning",
    title: "Expiry Warning",
    message: "Batch #B2024-001 expires in 30 days",
    productName: "Organic Protein Powder",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    acknowledged: false,
  },
];

const DEMO_RULES: AlertRule[] = [
  {
    id: "1",
    name: "Default Low Stock Alert",
    type: "low_stock",
    condition: { threshold: 10 },
    enabled: true,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: "2",
    name: "Electronics Reorder",
    type: "reorder_point",
    condition: { threshold: 15, categoryIds: ["electronics"] },
    enabled: true,
    notifyEmail: false,
    notifyDashboard: true,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "3",
    name: "Overstock Warning",
    type: "overstock",
    condition: { threshold: 500 },
    enabled: false,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

function AlertCard({ alert, onAcknowledge }: { alert: ActiveAlert; onAcknowledge: (id: string) => void }) {
  const typeConfig = ALERT_TYPES.find(t => t.value === alert.type) || ALERT_TYPES[0];
  const Icon = typeConfig.icon;
  
  const severityColors = {
    critical: "border-red-500/50 bg-red-500/5",
    warning: "border-amber-500/50 bg-amber-500/5",
    info: "border-blue-500/50 bg-blue-500/5",
  };

  const severityBadge = {
    critical: "bg-red-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border-l-4 ${severityColors[alert.severity]} ${alert.acknowledged ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-[var(--hover-bg)] ${typeConfig.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-[var(--text-primary)]">{alert.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge[alert.severity]}`}>
              {alert.severity}
            </span>
            {alert.acknowledged && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                Acknowledged
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">{alert.message}</p>
          {alert.currentValue !== undefined && alert.threshold !== undefined && (
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>Current: <strong className="text-[var(--text-primary)]">{alert.currentValue}</strong></span>
              <span>Threshold: <strong className="text-[var(--text-primary)]">{alert.threshold}</strong></span>
            </div>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(alert.createdAt).toLocaleString()}
          </p>
        </div>
        {!alert.acknowledged && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAcknowledge(alert.id)}
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          >
            <Check className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function RuleEditor({
  rule,
  onSave,
  onCancel,
}: {
  rule?: AlertRule;
  onSave: (rule: Partial<AlertRule>) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    type: rule?.type || "low_stock",
    threshold: rule?.condition?.threshold || 10,
    daysBeforeExpiry: rule?.condition?.daysBeforeExpiry || 30,
    enabled: rule?.enabled ?? true,
    notifyEmail: rule?.notifyEmail ?? true,
    notifyDashboard: rule?.notifyDashboard ?? true,
  });

  const handleSubmit = async () => {
    await onSave({
      id: rule?.id,
      name: formData.name,
      type: formData.type as AlertRule["type"],
      condition: {
        threshold: formData.threshold,
        daysBeforeExpiry: formData.daysBeforeExpiry,
      },
      enabled: formData.enabled,
      notifyEmail: formData.notifyEmail,
      notifyDashboard: formData.notifyDashboard,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--hover-bg)] rounded-xl p-4 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rule Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Low Stock Alert"
            className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Alert Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AlertRule["type"] })}
            className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
          >
            {ALERT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {formData.type !== "expiry" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              {formData.type === "overstock" ? "Maximum Stock" : "Minimum Stock"}
            </label>
            <input
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Days Before Expiry</label>
            <input
              type="number"
              value={formData.daysBeforeExpiry}
              onChange={(e) => setFormData({ ...formData, daysBeforeExpiry: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
            />
          </div>
        )}
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-[var(--text-primary)]">Enabled</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.notifyEmail}
            onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-[var(--text-primary)]">Email Notifications</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.notifyDashboard}
            onChange={(e) => setFormData({ ...formData, notifyDashboard: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-[var(--text-primary)]">Dashboard Notifications</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-4 py-2 border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-secondary)]"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!formData.name}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-sm text-white font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save Rule
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function AdvancedAlertsPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "rules">("alerts");
  const [alerts, setAlerts] = useState<ActiveAlert[]>(DEMO_ALERTS);
  const [rules, setRules] = useState<AlertRule[]>(DEMO_RULES);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>(undefined);
  const [filter, setFilter] = useState<"all" | "unacknowledged">("all");
  const [savingRule, setSavingRule] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/rules`, { headers: getAuthHeaders() });
      if (!res.ok) {
        setRules(DEMO_RULES);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((rule: Partial<AlertRule> & { _id?: string }) => normalizeRule(rule));
        setRules(mapped.length > 0 ? mapped : DEMO_RULES);
        return;
      }

      setRules(DEMO_RULES);
    } catch {
      setRules(DEMO_RULES);
    }
  }, []);

  const fetchAcks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/acks`, { headers: getAuthHeaders() });
      if (!res.ok) return new Set<string>();
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return new Set<string>();
      return new Set<string>(data.data.map((ack: { alertId?: string }) => String(ack.alertId || "")));
    } catch {
      return new Set<string>();
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [res, ackSet] = await Promise.all([
        fetch(`${API_BASE}/api/products?lowStock=true&limit=20`, {
          headers: getAuthHeaders(),
        }),
        fetchAcks(),
      ]);

      // Try to fetch real low stock alerts
      if (res.ok) {
        const data = await res.json();
        const products = data.data || [];

        const realAlerts: ActiveAlert[] = products.map((p: Record<string, unknown>, idx: number) => {
          const alertId = `real-${p._id || idx}`;
          return {
            id: alertId,
            type: "low_stock",
            severity: ((p.stockQuantity as number) || 0) < 5 ? "critical" : "warning",
            title: "Low Stock Alert",
            message: `${p.name} has only ${p.stockQuantity || 0} units remaining`,
            productId: p._id as string,
            productName: p.name as string,
            currentValue: (p.stockQuantity as number) || 0,
            threshold: (p.minStockLevel as number) || 10,
            createdAt: new Date().toISOString(),
            acknowledged: ackSet.has(alertId),
          };
        });

        setAlerts(realAlerts.length > 0 ? realAlerts : DEMO_ALERTS);
      }
    } catch {
      // Use demo data
      setAlerts(DEMO_ALERTS);
    } finally {
      setLoading(false);
    }
  }, [fetchAcks]);

  useEffect(() => {
    fetchAlerts();
    fetchRules();
  }, [fetchAlerts, fetchRules]);

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/alerts/acks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ alertId: id }),
      });

    } catch {}

    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, acknowledged: true } : a
    ));
  };

  const handleSaveRule = async (ruleData: Partial<AlertRule>) => {
    setSavingRule(true);
    try {
      if (ruleData.id) {
        const res = await fetch(`${API_BASE}/api/alerts/rules/${ruleData.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(ruleData),
        });
        if (!res.ok) throw new Error("Failed to update rule");
      } else {
        const res = await fetch(`${API_BASE}/api/alerts/rules`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(ruleData),
        });
        if (!res.ok) throw new Error("Failed to create rule");
      }

      await fetchRules();
      setShowEditor(false);
      setEditingRule(undefined);
    } catch {
      // Fallback local behavior
      if (ruleData.id) {
        setRules(prev => prev.map(r => 
          r.id === ruleData.id ? { ...r, ...ruleData } as AlertRule : r
        ));
      } else {
        const newRule: AlertRule = normalizeRule({ ...ruleData, id: Date.now().toString() });
        setRules(prev => [...prev, newRule]);
      }

      setShowEditor(false);
      setEditingRule(undefined);
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/alerts/rules/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await fetchRules();
    } catch {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleToggleRule = async (id: string) => {
    const target = rules.find((rule) => rule.id === id);
    if (!target) return;

    try {
      await fetch(`${API_BASE}/api/alerts/rules/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled: !target.enabled }),
      });
      await fetchRules();
    } catch {
      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ));
    }
  };

  const filteredAlerts = filter === "all" 
    ? alerts 
    : alerts.filter(a => !a.acknowledged);

  const criticalCount = alerts.filter(a => a.severity === "critical" && !a.acknowledged).length;
  const warningCount = alerts.filter(a => a.severity === "warning" && !a.acknowledged).length;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Advanced Alerts
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Monitor stock levels, expiry dates, and reorder points</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{criticalCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Critical Alerts</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{warningCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Warnings</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{alerts.filter(a => a.acknowledged).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Acknowledged</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{rules.filter(r => r.enabled).length}</p>
              <p className="text-xs text-[var(--text-muted)]">Active Rules</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "alerts"
              ? "bg-[var(--accent-indigo)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          }`}
        >
          Active Alerts ({alerts.filter(a => !a.acknowledged).length})
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "rules"
              ? "bg-[var(--accent-indigo)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          }`}
        >
          Alert Rules ({rules.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "alerts" ? (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filter === "all" ? "bg-[var(--hover-bg)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unacknowledged")}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filter === "unacknowledged" ? "bg-[var(--hover-bg)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                }`}
              >
                Unacknowledged
              </button>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-[var(--text-primary)] font-medium">All clear!</p>
                  <p className="text-sm text-[var(--text-muted)]">No active alerts at the moment</p>
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="rules"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Add Rule Button */}
            {!showEditor && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingRule(undefined); setShowEditor(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Alert Rule
              </motion.button>
            )}

            {/* Rule Editor */}
            <AnimatePresence>
              {showEditor && (
                <RuleEditor
                  rule={editingRule}
                  onSave={handleSaveRule}
                  onCancel={() => { setShowEditor(false); setEditingRule(undefined); }}
                />
              )}
            </AnimatePresence>

            {savingRule && (
              <div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving rule...
              </div>
            )}

            {/* Rules List */}
            <div className="space-y-3">
              {rules.map(rule => {
                const typeConfig = ALERT_TYPES.find(t => t.value === rule.type) || ALERT_TYPES[0];
                const Icon = typeConfig.icon;

                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`glass-card p-4 rounded-xl ${!rule.enabled ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-[var(--hover-bg)] ${typeConfig.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[var(--text-primary)]">{rule.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            rule.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                          }`}>
                            {rule.enabled ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">
                          {rule.type === "expiry" 
                            ? `Alert ${rule.condition.daysBeforeExpiry} days before expiry`
                            : `Threshold: ${rule.condition.threshold} units`
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleRule(rule.id)}
                          className={`p-2 rounded-lg ${
                            rule.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {rule.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditingRule(rule); setShowEditor(true); }}
                          className="p-2 rounded-lg bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
