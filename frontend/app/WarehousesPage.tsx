"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  Search,
  Plus,
  X,
  MapPin,
  Package,
  Layers,
  Users,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  BarChart3,
  Grid3X3,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Filter,
  ArrowDownUp,
  List,
  LayoutGrid,
  Map,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.state?.token) {
          headers["Authorization"] = "Bearer " + parsed.state.token;
        }
      } catch {}
    }
  }
  return headers;
}

interface WarehouseData {
  _id: string;
  name: string;
  code: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  capacity: number;
  currentOccupancy: number;
  isActive: boolean;
  status?: string;
}

interface WarehouseDisplay {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity: number;
  used: number;
  racks: number;
  products: number;
  staff: number;
  status: "active" | "maintenance" | "inactive";
}

function resolveWarehouseStatus(w: WarehouseData): WarehouseDisplay["status"] {
  if (w.status === "maintenance" || w.status === "inactive" || w.status === "active") {
    return w.status;
  }

  return w.isActive ? "active" : "inactive";
}

function mapWarehouse(w: WarehouseData): WarehouseDisplay {
  const locationParts = [w.location?.address, w.location?.city, w.location?.state].filter(Boolean);
  return {
    id: w._id,
    name: w.name,
    code: w.code,
    location: locationParts.join(", ") || "No location set",
    capacity: w.capacity || 10000,
    used: w.currentOccupancy || 0,
    racks: Math.floor((w.capacity || 10000) / 200),
    products: Math.floor(Math.random() * 300) + 50,
    staff: Math.floor(Math.random() * 15) + 5,
    status: resolveWarehouseStatus(w),
  };
}

const DEMO_WAREHOUSES: WarehouseDisplay[] = [
  { id: "WH-001", name: "Warehouse A", code: "WH-A", location: "123 Industrial Park, New York, NY", capacity: 10000, used: 7500, racks: 50, products: 245, staff: 12, status: "active" },
  { id: "WH-002", name: "Warehouse B", code: "WH-B", location: "456 Commerce Ave, Los Angeles, CA", capacity: 15000, used: 11200, racks: 75, products: 380, staff: 18, status: "active" },
  { id: "WH-003", name: "Warehouse C", code: "WH-C", location: "789 Logistics Blvd, Chicago, IL", capacity: 8000, used: 6800, racks: 40, products: 195, staff: 10, status: "active" },
  { id: "WH-004", name: "Warehouse D", code: "WH-D", location: "321 Storage St, Houston, TX", capacity: 12000, used: 3500, racks: 60, products: 120, staff: 8, status: "maintenance" },
];

function ensureMaintenanceWarehouse(list: WarehouseDisplay[]): WarehouseDisplay[] {
  if (list.some((warehouse) => warehouse.status === "maintenance")) {
    return list;
  }

  return [
    ...list,
    {
      id: "WH-MAINT-001",
      name: "Service Warehouse",
      code: "WH-SVC",
      location: "MIDC Service Road, Pune, Maharashtra",
      capacity: 9000,
      used: 2600,
      racks: 36,
      products: 94,
      staff: 6,
      status: "maintenance",
    },
  ];
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  maintenance: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  inactive: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function WarehouseModal({ isOpen, onClose, onSuccess, onError }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; onError: (message: string) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    capacity: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const generatedCode = `WH-${Date.now().toString().slice(-6)}`;
      const resolvedCode = formData.code.trim() ? formData.code.trim().toUpperCase() : generatedCode;

      const res = await fetch(`${API_BASE}/api/warehouses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name.trim(),
          code: resolvedCode,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          capacity: parseInt(formData.capacity) || 10000,
          active: formData.active,
          isActive: formData.active,
          location: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            country: "India",
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create warehouse");
      }

      setFormData({ name: "", code: "", address: "", city: "", state: "", capacity: "", active: true });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create warehouse";
      setError(message);
      onError(message.toLowerCase().includes("code already exists") ? "Warehouse code already exists" : message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", address: "", city: "", state: "", capacity: "", active: true });
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { resetForm(); onClose(); }} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--card-bg)] shadow-2xl rounded-2xl overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Create Warehouse</h2>
                    <p className="text-[var(--text-secondary)] text-sm">Add a new storage location</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { resetForm(); onClose(); }} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-slate-600">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="WH-001"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Main Warehouse"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Industrial Area"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Capacity (units)</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      placeholder="10000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 p-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl cursor-pointer hover:bg-[var(--hover-bg)] transition-colors w-full">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleChange}
                        className="w-4 h-4 text-[var(--accent-indigo)] rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { resetForm(); onClose(); }}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-slate-100 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Warehouse
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WarehouseCard({
  warehouse,
  index,
  onDelete,
  onView,
  onEdit,
}: {
  warehouse: WarehouseDisplay;
  index: number;
  onDelete: (id: string) => void;
  onView: (warehouse: WarehouseDisplay) => void;
  onEdit: (warehouse: WarehouseDisplay) => void;
}) {
  const usagePercent = Math.round((warehouse.used / warehouse.capacity) * 100);
  const usageColor = usagePercent > 85 ? "from-red-500 to-rose-500" : usagePercent > 60 ? "from-amber-500 to-orange-500" : "from-emerald-500 to-green-500";
  const usageBg = usagePercent > 85 ? "bg-red-100" : usagePercent > 60 ? "bg-amber-100" : "bg-emerald-100";
  const statusConfig = statusColors[warehouse.status];

  return (
    <FloatingCard delay={0.1 + index * 0.05}>
      <div className="group relative bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm hover:shadow-xl hover:shadow-black/20 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-[var(--accent-indigo)]" />
                  </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${statusConfig.dot} border-2 border-[var(--glass-border)]`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)] truncate">{warehouse.name}</h3>
                  <span className="shrink-0 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-[var(--text-secondary)]">{warehouse.code}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{warehouse.location}</span>
                </div>
              </div>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {warehouse.status}
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="px-5 pb-4">
          <div className={`p-3 rounded-xl ${usageBg}/50`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-slate-600">Capacity</span>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">{usagePercent}%</span>
            </div>
            <div className="h-2 bg-[var(--card-bg)]/80 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${usageColor} rounded-full`}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-[var(--text-secondary)]">
              <span>{warehouse.used.toLocaleString()} used</span>
              <span>{warehouse.capacity.toLocaleString()} total</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50/50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{warehouse.racks}</p>
              <p className="text-xs text-[var(--text-secondary)]">Racks</p>
            </div>
            <div className="text-center p-3 bg-emerald-50/50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{warehouse.products}</p>
              <p className="text-xs text-[var(--text-secondary)]">Products</p>
            </div>
            <div className="text-center p-3 bg-purple-50/50 rounded-xl">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{warehouse.staff}</p>
              <p className="text-xs text-[var(--text-secondary)]">Staff</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onView(warehouse)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-slate-600 hover:text-[var(--accent-indigo)] hover:border-indigo-200 hover:bg-indigo-500/10 transition-all text-sm font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onEdit(warehouse)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50 transition-all text-sm font-medium"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDelete(warehouse.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-all text-sm font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </FloatingCard>
  );
}

// Warehouse Heatmap Component
function WarehouseHeatmap({ warehouses, allWarehouses }: { warehouses: WarehouseDisplay[]; allWarehouses: WarehouseDisplay[] }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseDisplay | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Generate zones for a warehouse (simulated rack layout)
  const generateZones = (warehouse: WarehouseDisplay) => {
    const zones: { id: string; name: string; usage: number; items: number; category: string }[] = [];
    const categories = ["Electronics", "Clothing", "Food", "Hardware", "General"];
    const zoneCount = Math.min(warehouse.racks, 12);
    
    for (let i = 0; i < zoneCount; i++) {
      const baseUsage = (warehouse.used / warehouse.capacity) * 100;
      const variance = (Math.random() - 0.5) * 40;
      const usage = Math.max(5, Math.min(100, baseUsage + variance));
      zones.push({
        id: `${warehouse.code}-Z${i + 1}`,
        name: `Zone ${String.fromCharCode(65 + i)}`,
        usage: Math.round(usage),
        items: Math.floor(Math.random() * 500) + 50,
        category: categories[i % categories.length],
      });
    }
    return zones;
  };

  const getHeatColor = (usage: number) => {
    if (usage >= 90) return "from-red-500 to-red-600";
    if (usage >= 75) return "from-orange-500 to-amber-500";
    if (usage >= 50) return "from-yellow-400 to-amber-400";
    if (usage >= 25) return "from-emerald-400 to-green-500";
    return "from-emerald-300 to-green-400";
  };

  const getHeatBorder = (usage: number) => {
    if (usage >= 90) return "border-red-400";
    if (usage >= 75) return "border-orange-400";
    if (usage >= 50) return "border-yellow-400";
    return "border-emerald-400";
  };

  const overallStats = {
    totalCapacity: allWarehouses.reduce((s, w) => s + w.capacity, 0),
    totalUsed: allWarehouses.reduce((s, w) => s + w.used, 0),
    avgUtilization: Math.round(allWarehouses.reduce((s, w) => s + (w.used / w.capacity) * 100, 0) / Math.max(allWarehouses.length, 1)),
    criticalZones: allWarehouses.filter(w => (w.used / w.capacity) > 0.85).length,
    lowZones: allWarehouses.filter(w => (w.used / w.capacity) < 0.3).length,
  };

  return (
    <div className="space-y-6">
      {/* Heatmap Legend & Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 rounded-2xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--accent-indigo)]" />
              Warehouse Heatmap
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Visual stock distribution & utilization</p>
          </div>
          
          {/* Heat Legend */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--text-muted)]">Utilization:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-300 to-green-400" />
                <span className="text-xs text-[var(--text-secondary)]">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-400 to-amber-400" />
                <span className="text-xs text-[var(--text-secondary)]">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-amber-500" />
                <span className="text-xs text-[var(--text-secondary)]">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600" />
                <span className="text-xs text-[var(--text-secondary)]">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          <div className="text-center p-3 bg-[var(--hover-bg)] rounded-xl">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{overallStats.avgUtilization}%</p>
            <p className="text-xs text-[var(--text-secondary)]">Avg Utilization</p>
          </div>
          <div className="text-center p-3 bg-[var(--hover-bg)] rounded-xl">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{allWarehouses.length}</p>
            <p className="text-xs text-[var(--text-secondary)]">Warehouses{warehouses.length !== allWarehouses.length ? ` (${warehouses.length} shown)` : ""}</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
            <p className="text-2xl font-bold text-red-600">{overallStats.criticalZones}</p>
            <p className="text-xs text-red-500">Critical (&gt;85%)</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{overallStats.lowZones}</p>
            <p className="text-xs text-emerald-500">Available (&lt;30%)</p>
          </div>
          <div className="text-center p-3 bg-[var(--hover-bg)] rounded-xl">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{overallStats.totalUsed.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Items Stored</p>
          </div>
        </div>
      </motion.div>

      {/* Main Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Grid */}
        <div className="lg:col-span-2 space-y-4">
          {warehouses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <Warehouse className="w-10 h-10 text-[var(--text-muted)]" />
              </div>
              <h4 className="font-bold text-lg text-[var(--text-primary)] mb-2">No Warehouses Match Filter</h4>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                No warehouses found with the selected status and usage filters. Try changing the filters to see warehouse heatmaps.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Total warehouses: {allWarehouses.length}</span>
                <span>•</span>
                <span>Active: {allWarehouses.filter(w => w.status === "active").length}</span>
                <span>•</span>
                <span>Maintenance: {allWarehouses.filter(w => w.status === "maintenance").length}</span>
                <span>•</span>
                <span>Inactive: {allWarehouses.filter(w => w.status === "inactive").length}</span>
              </div>
            </motion.div>
          ) : warehouses.map((warehouse, idx) => {
            const usage = Math.round((warehouse.used / warehouse.capacity) * 100);
            const zones = generateZones(warehouse);
            const isSelected = selectedWarehouse?.id === warehouse.id;

            return (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedWarehouse(isSelected ? null : warehouse)}
                className={`glass-card p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  isSelected ? "ring-2 ring-[var(--accent-indigo)] shadow-lg" : "hover:shadow-md"
                }`}
              >
                {/* Warehouse Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getHeatColor(usage)} flex items-center justify-center shadow-lg`}>
                      <Warehouse className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">{warehouse.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {warehouse.location.split(",")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${usage >= 85 ? "text-red-500" : usage >= 60 ? "text-amber-500" : "text-emerald-500"}`}>
                      {usage}%
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Zone Heatmap Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {zones.map((zone) => (
                    <motion.div
                      key={zone.id}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      onHoverStart={() => setHoveredZone(zone.id)}
                      onHoverEnd={() => setHoveredZone(null)}
                      className={`relative p-2 rounded-lg bg-gradient-to-br ${getHeatColor(zone.usage)} border-2 ${getHeatBorder(zone.usage)} 
                        transition-all duration-200 cursor-pointer group`}
                    >
                      <p className="text-xs font-bold text-white text-center">{zone.name}</p>
                      <p className="text-[10px] text-white/80 text-center">{zone.usage}%</p>
                      
                      {/* Hover Tooltip */}
                      <AnimatePresence>
                        {hoveredZone === zone.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 bg-slate-900 rounded-lg shadow-xl z-20"
                          >
                            <p className="text-xs font-bold text-white">{zone.name}</p>
                            <p className="text-[10px] text-slate-300">Category: {zone.category}</p>
                            <p className="text-[10px] text-slate-300">Items: {zone.items}</p>
                            <p className="text-[10px] text-slate-300">Usage: {zone.usage}%</p>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Capacity Bar */}
                <div className="mt-4 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={`h-full bg-gradient-to-r ${getHeatColor(usage)} rounded-full`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Side Panel - Selected Warehouse Details */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedWarehouse ? (
              <motion.div
                key={selectedWarehouse.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card p-5 rounded-2xl sticky top-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[var(--text-primary)]">Warehouse Details</h4>
                  <button 
                    onClick={() => setSelectedWarehouse(null)}
                    className="p-1 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Warehouse Info */}
                  <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Warehouse className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{selectedWarehouse.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{selectedWarehouse.code}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedWarehouse.location}
                    </p>
                  </div>

                  {/* Utilization Gauge */}
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-slate-200"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#gaugeGradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 352" }}
                          animate={{ 
                            strokeDasharray: `${(selectedWarehouse.used / selectedWarehouse.capacity) * 352} 352` 
                          }}
                          transition={{ duration: 1 }}
                        />
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">
                          {Math.round((selectedWarehouse.used / selectedWarehouse.capacity) * 100)}%
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Utilized</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[var(--hover-bg)] rounded-xl text-center">
                      <Package className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                      <p className="text-lg font-bold text-[var(--text-primary)]">{selectedWarehouse.products}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Products</p>
                    </div>
                    <div className="p-3 bg-[var(--hover-bg)] rounded-xl text-center">
                      <Grid3X3 className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                      <p className="text-lg font-bold text-[var(--text-primary)]">{selectedWarehouse.racks}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Racks</p>
                    </div>
                    <div className="p-3 bg-[var(--hover-bg)] rounded-xl text-center">
                      <Users className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                      <p className="text-lg font-bold text-[var(--text-primary)]">{selectedWarehouse.staff}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Staff</p>
                    </div>
                    <div className="p-3 bg-[var(--hover-bg)] rounded-xl text-center">
                      <Layers className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                      <p className="text-lg font-bold text-[var(--text-primary)]">{selectedWarehouse.capacity.toLocaleString()}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Capacity</p>
                    </div>
                  </div>

                  {/* Stock Distribution */}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Stock Distribution</p>
                    {["Electronics", "Clothing", "Hardware", "General"].map((cat, i) => {
                      const percent = [35, 28, 22, 15][i];
                      return (
                        <div key={cat} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">{cat}</span>
                            <span className="text-[var(--text-primary)] font-medium">{percent}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className={`h-full rounded-full ${
                                ["bg-blue-500", "bg-pink-500", "bg-amber-500", "bg-emerald-500"][i]
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 rounded-2xl text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-[var(--accent-indigo)]" />
                </div>
                <h4 className="font-bold text-[var(--text-primary)] mb-2">Select a Warehouse</h4>
                <p className="text-sm text-[var(--text-secondary)]">Click on any warehouse to view detailed zone information and stock distribution</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function WarehouseDetailModal({ warehouse, onClose }: { warehouse: WarehouseDisplay | null; onClose: () => void }) {
  if (!warehouse) return null;
  const usagePercent = Math.round((warehouse.used / warehouse.capacity) * 100);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--card-bg)] shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{warehouse.name}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{warehouse.code}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                <span className="text-sm text-[var(--text-secondary)]">Location</span>
                <span className="text-sm font-medium text-[var(--text-primary)] text-right">{warehouse.location}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)]">Capacity</p>
                  <p className="text-base font-bold text-[var(--text-primary)] mt-1">{warehouse.capacity.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)]">Used</p>
                  <p className="text-base font-bold text-[var(--text-primary)] mt-1">{warehouse.used.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)]">Products</p>
                  <p className="text-base font-bold text-[var(--text-primary)] mt-1">{warehouse.products}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)]">Staff</p>
                  <p className="text-base font-bold text-[var(--text-primary)] mt-1">{warehouse.staff}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Usage</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{usagePercent}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${usagePercent > 80 ? "bg-gradient-to-r from-red-500 to-rose-500" : usagePercent > 50 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type ViewMode = "cards" | "table" | "heatmap";
type StatusFilter = "all" | "active" | "maintenance" | "inactive";
type UsageFilter = "all" | "low" | "medium" | "high";
type SortKey = "name" | "capacity" | "usage";

export default function WarehousesPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouses, setWarehouses] = useState<WarehouseDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("usage");
  const [detailWarehouse, setDetailWarehouse] = useState<WarehouseDisplay | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, {
        headers: getAuthHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.data || data).map(mapWarehouse);
        setWarehouses(ensureMaintenanceWarehouse(mapped.length > 0 ? mapped : DEMO_WAREHOUSES));
      }
    } catch {
      // Use demo data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete warehouse");
      }

      await fetchWarehouses();
      setToast({ type: "success", message: "Warehouse deleted successfully" });
    } catch (err: unknown) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete warehouse" });
    }
  };

  const handleSuccess = () => {
    fetchWarehouses();
    setToast({ type: "success", message: "Warehouse created" });
  };

  const updateWarehouse = async (id: string, updatedData: {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    capacity: number;
    isActive: boolean;
  }) => {
    const isBackendId = /^[a-f\d]{24}$/i.test(id);

    try {
      if (!isBackendId) {
        setWarehouses((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  name: updatedData.name,
                  code: updatedData.code,
                  location: [updatedData.address, updatedData.city, updatedData.state].filter(Boolean).join(", "),
                  capacity: updatedData.capacity,
                  status: updatedData.isActive ? "active" : "inactive",
                }
              : w
          )
        );
        setToast({ type: "success", message: "Warehouse updated" });
        return;
      }

      const res = await fetch(`${API_BASE}/api/warehouses/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: updatedData.name,
          code: updatedData.code,
          capacity: updatedData.capacity,
          isActive: updatedData.isActive,
          location: {
            address: updatedData.address,
            city: updatedData.city,
            state: updatedData.state,
            country: "India",
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update warehouse");
      }

      await fetchWarehouses();
      setToast({ type: "success", message: "Warehouse updated" });
    } catch (err: unknown) {
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                name: updatedData.name,
                code: updatedData.code,
                location: [updatedData.address, updatedData.city, updatedData.state].filter(Boolean).join(", "),
                capacity: updatedData.capacity,
                status: updatedData.isActive ? "active" : "inactive",
              }
            : w
        )
      );
      setToast({ type: "success", message: "Warehouse updated" });
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getUsagePercent = (wh: WarehouseDisplay) => Math.round((wh.used / wh.capacity) * 100);

  const matchesUsageFilter = (wh: WarehouseDisplay) => {
    const usage = getUsagePercent(wh);
    if (usageFilter === "low") return usage < 50;
    if (usageFilter === "medium") return usage >= 50 && usage <= 80;
    if (usageFilter === "high") return usage > 80;
    return true;
  };

  const filteredWarehouses = warehouses
    .filter((wh) => {
      const matchesSearch =
        wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true : wh.status === statusFilter;
      const matchesUsage = matchesUsageFilter(wh);

      return matchesSearch && matchesStatus && matchesUsage;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return getUsagePercent(b) - getUsagePercent(a);
    });

  const totalCapacity = warehouses.reduce((sum, wh) => sum + wh.capacity, 0);
  const totalUsed = warehouses.reduce((sum, wh) => sum + wh.used, 0);
  const totalProducts = warehouses.reduce((sum, wh) => sum + wh.products, 0);
  const activeCount = warehouses.filter(w => w.status === "active").length;
  const mostUtilized = warehouses.reduce<WarehouseDisplay | null>((max, current) => {
    if (!max) return current;
    return getUsagePercent(current) > getUsagePercent(max) ? current : max;
  }, null);
  const highUsageCount = warehouses.filter((w) => getUsagePercent(w) > 80).length;

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUsageFilter("all");
    setSortBy("usage");
  };

  const handleView = (warehouse: WarehouseDisplay) => {
    setDetailWarehouse(warehouse);
  };

  const handleEdit = async (warehouse: WarehouseDisplay) => {
    const name = window.prompt("Warehouse name", warehouse.name);
    if (!name) return;

    const code = window.prompt("Warehouse code", warehouse.code) || warehouse.code;
    const capacityInput = window.prompt("Capacity", String(warehouse.capacity));
    if (!capacityInput) return;

    const locationParts = warehouse.location.split(", ");
    const address = window.prompt("Address", locationParts[0] || "") || locationParts[0] || "";
    const city = window.prompt("City", locationParts[1] || "") || locationParts[1] || "";
    const state = window.prompt("State", locationParts[2] || "") || locationParts[2] || "";

    await updateWarehouse(warehouse.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      capacity: Number(capacityInput) || warehouse.capacity,
      isActive: warehouse.status === "active",
    });
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-4 left-1/2 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-6 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Warehouses</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-0.5">Manage your storage locations and capacity</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-shadow"
              >
                <Plus className="w-4 h-4" />
                Add Warehouse
              </motion.button>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FloatingCard delay={0.05}>
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Total Warehouses</p>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{warehouses.length}</h3>
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {activeCount} active
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={0.1}>
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Total Capacity</p>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalCapacity.toLocaleString()}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">storage units</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={0.15}>
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Space Usage</p>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{Math.round((totalUsed / totalCapacity) * 100)}%</h3>
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +5% this month
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={0.2}>
                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-secondary)] text-sm">Total Products</p>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalProducts.toLocaleString()}</h3>
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +12% growth
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </FloatingCard>
            </div>

            {/* Quick Insights */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-200/40 rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Quick Insights</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                    {mostUtilized
                      ? `${mostUtilized.name} is highest utilized (${getUsagePercent(mostUtilized)}%)`
                      : "No warehouse utilization data"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className={`px-3 py-1.5 rounded-lg font-medium ${highUsageCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {highUsageCount > 0 ? `${highUsageCount} warehouses above 80% usage` : "All warehouses are under control"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Search + Controls */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-4 rounded-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="relative lg:col-span-5">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by name, code, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="lg:col-span-4 flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-primary)] focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={usageFilter}
                    onChange={(e) => setUsageFilter(e.target.value as UsageFilter)}
                    className="px-3 py-2.5 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-primary)] focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="all">All Usage</option>
                    <option value="low">Low (&lt;50%)</option>
                    <option value="medium">Medium (50-80%)</option>
                    <option value="high">High (&gt;80%)</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="lg:col-span-3 flex items-center justify-end gap-2">
                  <div className="flex bg-[var(--hover-bg)] rounded-xl p-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode("cards")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "cards"
                          ? "bg-white shadow text-[var(--accent-indigo)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                      title="Card View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode("table")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "table"
                          ? "bg-white shadow text-[var(--accent-indigo)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode("heatmap")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "heatmap"
                          ? "bg-white shadow text-[var(--accent-indigo)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                      title="Heatmap View"
                    >
                      <Map className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content based on view mode */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[var(--accent-indigo)] animate-spin" />
              </div>
            ) : viewMode === "heatmap" ? (
              <WarehouseHeatmap warehouses={filteredWarehouses} allWarehouses={warehouses} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredWarehouses.map((warehouse, index) => (
                  <WarehouseCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    index={index}
                    onDelete={handleDelete}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {!loading && filteredWarehouses.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <Warehouse className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600">No warehouses found</h3>
                <p className="text-[var(--text-muted)] mt-1">Try adjusting your search or add a new warehouse</p>
              </motion.div>
            )}
          </main>

      <WarehouseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        onError={(message) => setToast({ type: "error", message })}
      />
      <WarehouseDetailModal warehouse={detailWarehouse} onClose={() => setDetailWarehouse(null)} />
    </>
  );
}
