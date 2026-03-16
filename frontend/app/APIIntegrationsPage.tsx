"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  ShoppingBag,
  Store,
  Calculator,
  X,
  Check,
  Plus,
  Settings,
  RefreshCw,
  ExternalLink,
  Plug,
  Unplug,
  AlertCircle,
  CheckCircle,
  Key,
  Globe,
  Loader2,
  Shield,
  Zap,
  FileCode,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

function getAuthHeaders() {
  const token =
    (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("authToken"))) ||
    "";

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

type IntegrationCredentials = {
  apiKey?: string;
  storeUrl?: string;
  webhookUrl?: string;
};

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  features: string[];
  credentials?: IntegrationCredentials;
}

interface CustomIntegrationForm {
  name: string;
  webhookUrl: string;
  apiKey: string;
  description: string;
}

interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products, orders, and inventory with your Shopify store",
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    status: "disconnected",
    features: ["Product sync", "Order import", "Inventory updates", "Webhooks"],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WordPress WooCommerce store",
    icon: Store,
    color: "from-purple-500 to-violet-500",
    status: "disconnected",
    features: ["Product sync", "Order management", "Stock sync", "Category mapping"],
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync invoices, expenses, and financial data",
    icon: Calculator,
    color: "from-blue-500 to-cyan-500",
    status: "disconnected",
    features: ["Invoice sync", "Expense tracking", "Financial reports", "Tax automation"],
  },
  {
    id: "amazon",
    name: "Amazon Seller",
    description: "Manage Amazon marketplace inventory and orders",
    icon: ShoppingBag,
    color: "from-orange-500 to-amber-500",
    status: "disconnected",
    features: ["FBA integration", "Order sync", "Listing management", "Pricing updates"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 5000+ apps via Zapier automation",
    icon: Zap,
    color: "from-orange-400 to-red-500",
    status: "disconnected",
    features: ["Custom workflows", "Triggers", "Actions", "Multi-step Zaps"],
  },
  {
    id: "api",
    name: "Custom API",
    description: "Use our REST API for custom integrations",
    icon: Globe,
    color: "from-slate-500 to-zinc-600",
    status: "connected",
    lastSync: new Date().toISOString(),
    features: ["REST API", "Webhooks", "OAuth 2.0", "Rate limiting"],
    credentials: {
      apiKey: "ck_live_xxxxxxxxxxxxx",
    },
  },
];

function IntegrationCard({
  integration,
  onConfigure,
  onConnect,
  onDisconnect,
  connecting,
}: {
  integration: Integration;
  onConfigure: (id: string) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  connecting: boolean;
}) {
  const Icon = integration.icon;
  const isConnected = integration.status === "connected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${integration.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">{integration.name}</h3>
              <p className="text-xs text-white/80">{integration.description}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? "bg-white/20 text-white" 
              : "bg-black/20 text-white/80"
          }`}>
            {isConnected ? "Connected" : "Not Connected"}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {integration.features.map((feature, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-[var(--hover-bg)] rounded-lg text-xs text-[var(--text-secondary)]"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Status */}
        {isConnected && integration.lastSync && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            Last synced: {new Date(integration.lastSync).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onConfigure(integration.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
          >
            <Settings className="w-4 h-4" />
            Configure
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => (isConnected ? onDisconnect(integration.id) : onConnect(integration.id))}
            disabled={connecting}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
              isConnected
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            } disabled:opacity-60`}
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting
              </>
            ) : isConnected ? (
              <>
                <Unplug className="w-4 h-4" />
                Disconnect
              </>
            ) : (
              <>
                <Plug className="w-4 h-4" />
                Connect
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CustomIntegrationModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CustomIntegrationForm) => Promise<void>;
}) {
  const [form, setForm] = useState<CustomIntegrationForm>({ name: "", webhookUrl: "", apiKey: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setForm({ name: "", webhookUrl: "", apiKey: "", description: "" });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-xl bg-[var(--card-bg)] rounded-2xl border border-[var(--glass-border)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Create Custom Integration</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Integration Name" className="w-full px-4 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)]" />
              <input value={form.webhookUrl} onChange={(e) => setForm((prev) => ({ ...prev, webhookUrl: e.target.value }))} placeholder="Webhook URL" className="w-full px-4 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)]" />
              <input value={form.apiKey} onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))} placeholder="API Key" className="w-full px-4 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)]" />
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" className="w-full px-4 py-2.5 min-h-[96px] bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)]" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--glass-border)] text-[var(--text-primary)]">Cancel</button>
              <button onClick={handleSubmit} disabled={saving || !form.name || !form.webhookUrl || !form.apiKey} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save Integration"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfigurationModal({
  integration,
  onClose,
  onSave,
}: {
  integration: Integration;
  onClose: () => void;
  onSave: (id: string, credentials: IntegrationCredentials) => void;
}) {
  const [credentials, setCredentials] = useState<IntegrationCredentials>(
    integration.credentials || {}
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSave(integration.id, credentials);
    setSaving(false);
  };

  const Icon = integration.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--card-bg)] rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${integration.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Configure {integration.name}</h2>
                <p className="text-sm text-white/80">Enter your API credentials</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {integration.id === "shopify" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Shop URL
                </label>
                <input
                  type="url"
                  value={credentials.storeUrl || ""}
                  onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
                  placeholder="https://your-store.myshopify.com"
                  className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Access Token
                </label>
                <input
                  type="password"
                  value={credentials.apiKey || ""}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  placeholder="Enter Shopify access token"
                  className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
                />
              </div>
            </>
          ) : integration.id === "quickbooks" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Client ID
                </label>
                <input
                  type="text"
                  value={credentials.storeUrl || ""}
                  onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
                  placeholder="Enter QuickBooks Client ID"
                  className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Client Secret
                </label>
                <input
                  type="password"
                  value={credentials.apiKey || ""}
                  onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                  placeholder="Enter QuickBooks Client Secret"
                  className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </label>
              <input
                type="password"
                value={credentials.apiKey || ""}
                onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
              />
            </div>
          )}

          {/* Store URL (WooCommerce) */}
          {integration.id === "woocommerce" && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Store URL
              </label>
              <input
                type="url"
                value={credentials.storeUrl || ""}
                onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
                placeholder="https://your-store.myshopify.com"
                className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
              />
            </div>
          )}

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={credentials.webhookUrl || ""}
              onChange={(e) => setCredentials({ ...credentials, webhookUrl: e.target.value })}
              placeholder="https://your-server.com/webhook"
              className="w-full px-4 py-3 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400"
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl">
            <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Secure Connection</p>
              <p className="text-xs text-[var(--text-muted)]">
                Your credentials are encrypted and stored securely. We never share your data.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--glass-border)] flex justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-5 py-2.5 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] font-medium"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${integration.color} rounded-xl text-white font-medium shadow-lg disabled:opacity-50`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Configuration
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function APIIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: ToastMessage["type"], message: string) => {
    const toast = { id: crypto.randomUUID(), type, message };
    setToasts((prev) => [...prev, toast]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      setIntegrations((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        data.data.forEach((item: Record<string, unknown>) => {
          const id = String(item.id || "");
          const existing = map.get(id);
          if (existing) {
            map.set(id, {
              ...existing,
              status: (item.status as Integration["status"]) || existing.status,
              lastSync: (item.lastSync as string) || existing.lastSync,
              credentials: (item.credentials as IntegrationCredentials) || existing.credentials,
            });
          } else {
            map.set(id, {
              id,
              name: String(item.name || "Custom Integration"),
              description: String(item.description || "Custom API integration"),
              icon: FileCode,
              color: "from-slate-500 to-zinc-600",
              status: (item.status as Integration["status"]) || "connected",
              features: ["Webhook", "Custom API"],
              lastSync: item.lastSync as string | undefined,
              credentials: item.credentials as IntegrationCredentials,
            });
          }
        });
        return Array.from(map.values());
      });
    } catch {
      pushToast("error", "Could not load integrations");
    }
  }, [pushToast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConfigure = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (integration) setConfiguring(integration);
  };

  const handleConnect = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    setConnectingId(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: "connected" as const, lastSync: new Date().toISOString() } : i));
    try {
      await fetch(`${API_BASE}/api/integrations/${id}/connect`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      pushToast("success", "Integration connected");
    } catch {
      pushToast("error", "Failed to connect integration");
    }
    setConnectingId(null);
  };

  const handleDisconnect = async (id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, status: "disconnected" as const, lastSync: undefined, credentials: undefined } : i
    ));
    try {
      await fetch(`${API_BASE}/api/integrations/${id}/disconnect`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      pushToast("success", "Integration disconnected");
    } catch {
      pushToast("error", "Failed to disconnect integration");
    }
  };

  const handleSaveConfig = async (id: string, credentials: IntegrationCredentials) => {
    setIntegrations(prev => prev.map(i => 
      i.id === id 
        ? { ...i, status: "connected" as const, credentials, lastSync: new Date().toISOString() } 
        : i
    ));

    try {
      const res = await fetch(`${API_BASE}/api/integrations/${id}/configure`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ credentials }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      pushToast("success", "Integration configuration saved successfully");
    } catch (err) {
      console.error(err);
      pushToast("error", "Failed to save configuration");
    }

    setConfiguring(null);
  };

  const handleSaveCustomIntegration = async (payload: CustomIntegrationForm) => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/custom`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save custom integration");
      }

      const data = await res.json();
      if (data.success && data.data) {
        const record = data.data as Record<string, unknown>;
        setIntegrations((prev) => [
          {
            id: String(record.id),
            name: String(record.name),
            description: String(record.description),
            icon: FileCode,
            color: "from-slate-500 to-zinc-600",
            status: "connected",
            features: ["Webhook", "Custom API"],
            credentials: record.credentials as IntegrationCredentials,
            lastSync: new Date().toISOString(),
          },
          ...prev,
        ]);
        pushToast("success", "Integration connected");
      }
    } catch {
      pushToast("error", "Failed to create custom integration");
      throw new Error("Failed to create custom integration");
    }
  };

  const handleSyncAll = async () => {
    setSyncing("all");
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIntegrations(prev => prev.map(i => 
        i.status === "connected" ? { ...i, lastSync: new Date().toISOString() } : i
      ));
      pushToast("success", "Integrations synced");
    } catch {
      pushToast("error", "Failed to sync integrations");
    }
    setSyncing(null);
  };

  const connectedCount = integrations.filter(i => i.status === "connected").length;

  return (
    <>
    <main className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            API Integrations
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Connect your favorite tools and platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm font-medium">
            {connectedCount} Connected
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSyncAll}
            disabled={syncing === "all" || connectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing === "all" ? "animate-spin" : ""}`} />
            Sync All
          </motion.button>
        </div>
      </motion.div>

      {/* API Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 rounded-xl flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">API Status: Operational</p>
            <p className="text-sm text-[var(--text-muted)]">All systems running normally</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.open("/docs/api", "_blank")}
          className="flex items-center gap-2 text-sm text-[var(--accent-indigo)] hover:underline"
        >
          View API Docs
          <ExternalLink className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, idx) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <IntegrationCard
              integration={integration}
              onConfigure={handleConfigure}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              connecting={connectingId === integration.id}
            />
          </motion.div>
        ))}
      </div>

      {/* Custom Integration CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 rounded-2xl text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <Plus className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">Need a Custom Integration?</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-4">
          Use our REST API to build custom integrations with any platform. Full documentation available.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCustomModalOpen(true)}
          className="px-6 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] font-medium"
        >
          Need a Custom Integration
        </motion.button>
      </motion.div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {configuring && (
          <ConfigurationModal
            integration={configuring}
            onClose={() => setConfiguring(null)}
            onSave={handleSaveConfig}
          />
        )}
      </AnimatePresence>

      <CustomIntegrationModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleSaveCustomIntegration}
      />
    </main>
    <div className="fixed top-4 right-4 z-[70] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
    </>
  );
}
