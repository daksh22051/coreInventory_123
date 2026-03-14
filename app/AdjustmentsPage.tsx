"use client";

import { useState } from "react";
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

const adjustments = [
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

function AdjustmentModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
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
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Product</label>
                <select className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                  <option value="">Select product</option>
                  <option value="1">Wireless Headphones (WH-001)</option>
                  <option value="2">Smart Watch Pro (SW-002)</option>
                  <option value="3">USB-C Hub (UC-003)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">System Quantity</label>
                  <input type="number" placeholder="Current system qty" disabled className="w-full px-4 py-3 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-muted)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Physical Quantity</label>
                  <input type="number" placeholder="Actual count" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                    Increase
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]">
                    <TrendingDown className="w-4 h-4" />
                    Decrease
                  </motion.button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Reason</label>
                <select className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                  <option value="">Select reason</option>
                  <option value="audit">Found during audit</option>
                  <option value="damaged">Damaged items</option>
                  <option value="shrinkage">Inventory shrinkage</option>
                  <option value="unrecorded">Unrecorded receipt</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes</label>
                <textarea placeholder="Additional details..." rows={3} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 py-3 px-6 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] font-medium hover:bg-[var(--hover-bg)]">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25">
                  Submit Adjustment
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch = adj.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || adj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <main className="p-6 space-y-6">
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
          <StatCard title="Pending Review" value="8" icon={Clock} color="from-amber-500 to-orange-500" delay={0.1} />
          <StatCard title="Approved Today" value="12" icon={CheckCircle} trend={15} color="from-emerald-500 to-teal-500" delay={0.2} />
          <StatCard title="Stock Increased" value="+580" icon={TrendingUp} color="from-indigo-500 to-purple-500" delay={0.3} />
          <StatCard title="Stock Decreased" value="-245" icon={TrendingDown} color="from-red-500 to-pink-500" delay={0.4} />
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
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        {adj.status === "pending" && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">
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

      <AdjustmentModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
