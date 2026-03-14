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
    status: w.isActive ? "active" : "inactive",
  };
}

const DEMO_WAREHOUSES: WarehouseDisplay[] = [
  { id: "WH-001", name: "Warehouse A", code: "WH-A", location: "123 Industrial Park, New York, NY", capacity: 10000, used: 7500, racks: 50, products: 245, staff: 12, status: "active" },
  { id: "WH-002", name: "Warehouse B", code: "WH-B", location: "456 Commerce Ave, Los Angeles, CA", capacity: 15000, used: 11200, racks: 75, products: 380, staff: 18, status: "active" },
  { id: "WH-003", name: "Warehouse C", code: "WH-C", location: "789 Logistics Blvd, Chicago, IL", capacity: 8000, used: 6800, racks: 40, products: 195, staff: 10, status: "active" },
  { id: "WH-004", name: "Warehouse D", code: "WH-D", location: "321 Storage St, Houston, TX", capacity: 12000, used: 3500, racks: 60, products: 120, staff: 8, status: "maintenance" },
];

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

function WarehouseModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    capacity: "",
    isActive: true,
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
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Name and Code are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          location: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            country: "India",
          },
          capacity: parseInt(formData.capacity) || 10000,
          isActive: formData.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create warehouse");
      }

      setFormData({ name: "", code: "", address: "", city: "", state: "", capacity: "", isActive: true });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create warehouse");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", address: "", city: "", state: "", capacity: "", isActive: true });
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
                        name="isActive"
                        checked={formData.isActive}
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

function WarehouseCard({ warehouse, index, onDelete }: { warehouse: WarehouseDisplay; index: number; onDelete: (id: string) => void }) {
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
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-slate-600 hover:text-[var(--accent-indigo)] hover:border-indigo-200 hover:bg-indigo-500/10 transition-all text-sm font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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

export default function WarehousesPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouses, setWarehouses] = useState<WarehouseDisplay[]>(DEMO_WAREHOUSES);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.data || data).map(mapWarehouse);
        setWarehouses(mapped.length > 0 ? mapped : DEMO_WAREHOUSES);
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
      if (res.ok) {
        setWarehouses(prev => prev.filter(w => w.id !== id));
        setToast({ type: "success", message: "Warehouse deleted successfully" });
      }
    } catch {
      setToast({ type: "error", message: "Failed to delete warehouse" });
    }
  };

  const handleSuccess = () => {
    fetchWarehouses();
    setToast({ type: "success", message: "Warehouse created successfully!" });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filteredWarehouses = warehouses.filter((wh) =>
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCapacity = warehouses.reduce((sum, wh) => sum + wh.capacity, 0);
  const totalUsed = warehouses.reduce((sum, wh) => sum + wh.used, 0);
  const totalProducts = warehouses.reduce((sum, wh) => sum + wh.products, 0);
  const activeCount = warehouses.filter(w => w.status === "active").length;

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

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--card-bg)] border border-[var(--glass-border)]/80 shadow-sm p-4 rounded-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, code, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:bg-[var(--card-bg)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Warehouse Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[var(--accent-indigo)] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredWarehouses.map((warehouse, index) => (
                  <WarehouseCard key={warehouse.id} warehouse={warehouse} index={index} onDelete={handleDelete} />
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

      <WarehouseModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
    </>
  );
}
