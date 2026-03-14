"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  Search,
  Plus,
  X,
  Warehouse,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Eye,
  Check,
  ArrowUpRight,
  Layers,
} from "lucide-react";

const transfers = [
  {
    id: "TRF-001",
    from: "Warehouse A",
    fromRack: "A-12",
    to: "Warehouse B",
    toRack: "B-05",
    items: 3,
    totalQty: 150,
    status: "in-transit",
    date: "2026-03-14",
    initiatedBy: "John Smith",
  },
  {
    id: "TRF-002",
    from: "Warehouse B",
    fromRack: "B-08",
    to: "Warehouse C",
    toRack: "C-01",
    items: 5,
    totalQty: 280,
    status: "completed",
    date: "2026-03-13",
    initiatedBy: "Sarah Johnson",
  },
  {
    id: "TRF-003",
    from: "Warehouse A",
    fromRack: "A-05",
    to: "Warehouse A",
    toRack: "A-22",
    items: 2,
    totalQty: 100,
    status: "pending",
    date: "2026-03-14",
    initiatedBy: "Mike Chen",
  },
  {
    id: "TRF-004",
    from: "Warehouse C",
    fromRack: "C-15",
    to: "Warehouse A",
    toRack: "A-03",
    items: 4,
    totalQty: 200,
    status: "in-transit",
    date: "2026-03-14",
    initiatedBy: "Emily Davis",
  },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  "in-transit": { bg: "bg-blue-50", text: "text-blue-700" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX((y - rect.height / 2) / 25);
    setRotateY((rect.width / 2 - x) / 25);
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

function TransferModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[var(--card-bg)] shadow-2xl shadow-black/20 rounded-3xl p-8"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <ArrowLeftRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">New Transfer</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Move inventory between locations</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">From</h3>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-2">Warehouse</label>
                    <select className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                      <option value="">Select warehouse</option>
                      <option value="a">Warehouse A</option>
                      <option value="b">Warehouse B</option>
                      <option value="c">Warehouse C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-2">Rack/Location</label>
                    <input type="text" placeholder="e.g., A-12" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">To</h3>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-2">Warehouse</label>
                    <select className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                      <option value="">Select warehouse</option>
                      <option value="a">Warehouse A</option>
                      <option value="b">Warehouse B</option>
                      <option value="c">Warehouse C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-2">Rack/Location</label>
                    <input type="text" placeholder="e.g., B-05" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200">
                  <ArrowRight className="w-6 h-6 text-indigo-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Products to Transfer</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select className="px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                      <option value="">Select product</option>
                      <option value="1">Wireless Headphones</option>
                      <option value="2">Smart Watch Pro</option>
                    </select>
                    <input type="number" placeholder="Quantity" className="px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 py-3 px-6 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] font-medium hover:bg-[var(--hover-bg)]">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25">
                  Create Transfer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TransfersPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch = transfer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <main className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Transfers</h1>
            <p className="text-[var(--text-secondary)] mt-1">Move inventory between warehouses and racks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5" />
            New Transfer
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Pending Transfers" value="5" icon={Clock} color="from-amber-500 to-orange-500" delay={0.1} />
          <StatCard title="In Transit" value="8" icon={ArrowLeftRight} trend={12} color="from-indigo-500 to-purple-500" delay={0.2} />
          <StatCard title="Completed Today" value="15" icon={CheckCircle} trend={25} color="from-emerald-500 to-teal-500" delay={0.3} />
          <StatCard title="Items Moved" value="2,450" icon={Package} color="from-purple-500 to-pink-500" delay={0.4} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search transfers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "in-transit", "completed"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-colors ${statusFilter === status
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-50 text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"}`}
              >
                {status === "in-transit" ? "In Transit" : status}
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Transfer ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">From</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">To</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Items</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer, index) => (
                  <motion.tr
                    key={transfer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="border-b border-slate-100 hover:bg-indigo-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-[var(--accent-indigo)]">{transfer.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-[var(--text-muted)]" />
                        <div>
                          <p className="text-[var(--text-primary)]">{transfer.from}</p>
                          <p className="text-xs text-[var(--text-muted)]">Rack: {transfer.fromRack}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[var(--accent-indigo)]" />
                        <div>
                          <p className="text-[var(--text-primary)]">{transfer.to}</p>
                          <p className="text-xs text-[var(--text-muted)]">Rack: {transfer.toRack}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{transfer.items} items ({transfer.totalQty} units)</td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">{transfer.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[transfer.status].bg} ${statusColors[transfer.status].text}`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        {transfer.status === "in-transit" && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">
                            <Check className="w-4 h-4" />
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

      <TransferModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
