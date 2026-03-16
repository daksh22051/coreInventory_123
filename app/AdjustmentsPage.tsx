"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Search,
  Plus,
  X,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Eye,
  AlertTriangle,
  FileText,
  ArrowUpRight,
} from "lucide-react";

type AdjustmentStatus = "pending" | "approved" | "rejected";
type AdjustmentType = "increase" | "decrease";

type AdjustmentRecord = {
  id: string;
  product: string;
  sku: string;
  type: AdjustmentType;
  systemQty: number;
  physicalQty: number;
  difference: number;
  reason: string;
  status: AdjustmentStatus;
  date: string;
  adjustedBy: string;
};

const adjustments: AdjustmentRecord[] = [
  {
    id: "ADJ-001",
    product: "Wireless Headphones",
    sku: "WH-001",
    type: "increase",
    systemQty: 150,
    physicalQty: 165,
    difference: 15,
    reason: "Found during audit",
    status: "approved",
    date: "2026-03-14",
    adjustedBy: "John Smith",
  },
  {
    id: "ADJ-002",
    product: "Smart Watch Pro",
    sku: "SW-002",
    type: "decrease",
    systemQty: 200,
    physicalQty: 185,
    difference: -15,
    reason: "Damaged items",
    status: "pending",
    date: "2026-03-14",
    adjustedBy: "Sarah Johnson",
  },
  {
    id: "ADJ-003",
    product: "USB-C Hub",
    sku: "UC-003",
    type: "decrease",
    systemQty: 500,
    physicalQty: 492,
    difference: -8,
    reason: "Inventory shrinkage",
    status: "approved",
    date: "2026-03-13",
    adjustedBy: "Mike Chen",
  },
  {
    id: "ADJ-004",
    product: "Laptop Stand",
    sku: "LS-004",
    type: "increase",
    systemQty: 80,
    physicalQty: 95,
    difference: 15,
    reason: "Unrecorded receipt",
    status: "pending",
    date: "2026-03-14",
    adjustedBy: "Emily Davis",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { bg: "bg-red-50", text: "text-red-700" },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type ProductOption = {
  _id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  warehouse?: string | { _id?: string };
};

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
    if (!headers.Authorization) {
      const fallback = localStorage.getItem("token");
      if (fallback) headers.Authorization = "Bearer " + fallback;
    }
  }
  return headers;
}

function getCurrentUserName(): string {
  if (typeof window === "undefined") return "Operations Desk";
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return "Operations Desk";
  try {
    const parsed = JSON.parse(stored);
    return parsed?.state?.user?.name || "Operations Desk";
  } catch {
    return "Operations Desk";
  }
}

function appendMoveHistoryEntry(entry: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const key = "coreinventory_movements";
  const currentRaw = localStorage.getItem(key);
  const current = currentRaw ? JSON.parse(currentRaw) : [];
  const next = [entry, ...(Array.isArray(current) ? current : [])];
  localStorage.setItem(key, JSON.stringify(next));
}

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRotateX((e.clientY - rect.top - rect.height / 2) / 25);
    setRotateY((rect.width / 2 - (e.clientX - rect.left)) / 25);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      style={{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
      className="transition-transform duration-200"
    >
      {children}
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, delay }: {
  title: string; value: string; icon: React.ElementType; trend?: number; color: string; delay: number;
}) {
  return (
    <FloatingCard delay={delay}>
      <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-6 rounded-2xl overflow-hidden group cursor-pointer">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className={`w-4 h-4 ${trend >= 0 ? "text-emerald-600" : "text-red-600 rotate-90"}`} />
                <span className={`text-sm ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>
    </FloatingCard>
  );
}

function AdjustmentModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: AdjustmentRecord) => void;
}) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [physicalQty, setPhysicalQty] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("increase");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find((p) => p._id === selectedProductId) || null;
  const systemQty = selectedProduct?.stockQuantity ?? 0;
  const physicalQtyNumber = Number(physicalQty);
  const difference = Number.isFinite(physicalQtyNumber) ? physicalQtyNumber - systemQty : 0;

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products?limit=300`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const list = (data.data || data || []) as ProductOption[];
        setProducts(Array.isArray(list) ? list : []);
      } catch {
        setProducts([]);
      }
    };
    loadProducts();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!selectedProductId) {
      setPhysicalQty("");
      return;
    }
    if (selectedProduct) setPhysicalQty(String(selectedProduct.stockQuantity));
  }, [selectedProductId, selectedProduct]);

  const resetState = () => {
    setSelectedProductId("");
    setPhysicalQty("");
    setAdjustmentType("increase");
    setReason("");
    setNotes("");
    setError("");
    setSubmitting(false);
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const isSubmitDisabled =
    !selectedProductId ||
    !physicalQty ||
    Number.isNaN(Number(physicalQty)) ||
    !reason ||
    !adjustmentType ||
    submitting;

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct) return;
    if (Number.isNaN(physicalQtyNumber)) {
      setError("Physical quantity is required");
      return;
    }

    if (adjustmentType === "increase" && difference < 0) {
      setError("Increase type must have physical quantity greater than or equal to system quantity");
      return;
    }
    if (adjustmentType === "decrease" && difference > 0) {
      setError("Decrease type must have physical quantity lower than or equal to system quantity");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updateRes = await fetch(`${API_BASE}/api/products/${selectedProduct._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stockQuantity: physicalQtyNumber }),
      });
      if (!updateRes.ok) throw new Error("Unable to update product stock");

      const warehouseId = typeof selectedProduct.warehouse === "string"
        ? selectedProduct.warehouse
        : selectedProduct.warehouse?._id;

      if (warehouseId) {
        const adjustmentRes = await fetch(`${API_BASE}/api/adjustments`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            warehouse: warehouseId,
            reason,
            notes,
            items: [
              {
                product: selectedProduct._id,
                systemQuantity: systemQty,
                actualQuantity: physicalQtyNumber,
              },
            ],
          }),
        });
        if (!adjustmentRes.ok) throw new Error("Unable to create adjustment record");
      }

      const today = new Date();
      const record: AdjustmentRecord = {
        id: `ADJ-${today.getTime().toString().slice(-6)}`,
        product: selectedProduct.name,
        sku: selectedProduct.sku,
        type: adjustmentType,
        systemQty,
        physicalQty: physicalQtyNumber,
        difference,
        reason,
        status: "approved",
        date: today.toISOString().slice(0, 10),
        adjustedBy: getCurrentUserName(),
      };

      appendMoveHistoryEntry({
        id: `MOV-ADJ-${today.getTime().toString().slice(-6)}`,
        type: "adjustment",
        description: `Stock adjusted (${adjustmentType})`,
        product: selectedProduct.name,
        quantity: difference,
        from: "System",
        to: "Physical Count",
        user: getCurrentUserName(),
        warehouse: typeof selectedProduct.warehouse === "string" ? selectedProduct.warehouse : "Warehouse",
        date: today.toISOString().slice(0, 10),
        time: today.toTimeString().slice(0, 5),
        stockAfter: physicalQtyNumber,
        trigger: record.id,
      });

      onCreated(record);
      closeModal();
    } catch {
      setError("Failed to submit adjustment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl bg-[var(--card-bg)] shadow-2xl shadow-black/20 rounded-3xl p-8"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Stock Adjustment</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Correct inventory discrepancy</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Product</label>
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">System Quantity</label>
                  <input type="number" value={systemQty} placeholder="Current system qty" disabled className="w-full px-4 py-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-muted)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Physical Quantity</label>
                  <input type="number" value={physicalQty} onChange={(e) => setPhysicalQty(e.target.value)} placeholder="Actual count" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => setAdjustmentType("increase")} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${adjustmentType === "increase" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-slate-50 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"}`}>
                    <TrendingUp className="w-4 h-4" />
                    Increase
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={() => setAdjustmentType("decrease")} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${adjustmentType === "decrease" ? "bg-red-50 border border-red-200 text-red-700" : "bg-slate-50 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"}`}>
                    <TrendingDown className="w-4 h-4" />
                    Decrease
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                  <option value="">Select reason</option>
                  <option value="counting_error">Found during audit</option>
                  <option value="damage">Damaged items</option>
                  <option value="theft">Inventory shrinkage</option>
                  <option value="quality_issue">Unrecorded receipt</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional details..." rows={3} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeModal} className="flex-1 py-3 px-6 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] font-medium hover:bg-[var(--hover-bg)]">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: isSubmitDisabled ? 1 : 1.02 }} whileTap={{ scale: isSubmitDisabled ? 1 : 0.98 }} disabled={isSubmitDisabled} onClick={() => void handleSubmitAdjustment()} className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "Submitting..." : "Submit Adjustment"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AdjustmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [adjustmentRecords, setAdjustmentRecords] = useState<AdjustmentRecord[]>(adjustments);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredAdjustments = adjustmentRecords.filter((adj) => {
    const matchesSearch = adj.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || adj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date().toISOString().slice(0, 10);
  const pendingReviewCount = adjustmentRecords.filter((adj) => adj.status === "pending").length;
  const approvedTodayCount = adjustmentRecords.filter((adj) => adj.status === "approved" && adj.date === today).length;
  const stockIncreased = adjustmentRecords
    .filter((adj) => adj.difference > 0)
    .reduce((sum, adj) => sum + Math.abs(adj.difference), 0);
  const stockDecreased = adjustmentRecords
    .filter((adj) => adj.difference < 0)
    .reduce((sum, adj) => sum + Math.abs(adj.difference), 0);

  const approveAdjustment = (id: string) => {
    setAdjustmentRecords((prev) => prev.map((adj) => (
      adj.id === id ? { ...adj, status: "approved", date: new Date().toISOString().slice(0, 10) } : adj
    )));
    setToast(`Adjustment ${id} approved`);
  };

  const viewAdjustment = (adj: AdjustmentRecord) => {
    setToast(`Viewed ${adj.id}: ${adj.product} (${adj.difference > 0 ? "+" : ""}${adj.difference})`);
  };

  return (
    <>
      <main className="p-6 space-y-6">
        {toast && (
          <div className="fixed right-6 top-20 z-50 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30">
            {toast}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Adjustments</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manual stock corrections and reconciliation</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5" />
            New Adjustment
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pending Review" value={String(pendingReviewCount)} icon={Clock} color="from-amber-500 to-orange-500" delay={0.1} />
          <StatCard title="Approved Today" value={String(approvedTodayCount)} trend={approvedTodayCount > 0 ? 10 : 0} icon={CheckCircle} color="from-emerald-500 to-teal-500" delay={0.2} />
          <StatCard title="Stock Increased" value={`+${stockIncreased}`} icon={TrendingUp} color="from-indigo-500 to-purple-500" delay={0.3} />
          <StatCard title="Stock Decreased" value={`-${stockDecreased}`} icon={TrendingDown} color="from-red-500 to-pink-500" delay={0.4} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search adjustments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-colors ${statusFilter === status
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-50 text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"}`}
              >
                {status}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">System Qty</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Physical Qty</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Difference</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Reason</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.map((adj, index) => (
                  <motion.tr
                    key={adj.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-[var(--accent-indigo)]">{adj.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-[var(--text-primary)]">{adj.product}</p>
                        <p className="text-xs text-[var(--text-muted)]">{adj.sku}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{adj.systemQty}</td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{adj.physicalQty}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {adj.type === "increase" ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={adj.type === "increase" ? "text-emerald-600" : "text-red-600"}>
                          {adj.type === "increase" ? "+" : ""}{adj.difference}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{adj.reason}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[adj.status].bg} ${statusColors[adj.status].text}`}>
                        {adj.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => viewAdjustment(adj)} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        {adj.status === "pending" && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => approveAdjustment(adj.id)} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      <AdjustmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(record) => {
          setAdjustmentRecords((prev) => [record, ...prev]);
          setToast("Stock adjusted successfully");
        }}
      />
    </>
  );
}
