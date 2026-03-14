"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  Search,
  Filter,
  Download,
  Package,
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  Scale,
  User,
  Calendar,
  Clock,
  ChevronDown,
  Eye,
} from "lucide-react";

const moveHistory = [
  {
    id: "MOV-001",
    type: "receipt",
    description: "Stock received from TechSupplies Inc.",
    product: "Wireless Headphones",
    quantity: 100,
    from: "Supplier",
    to: "Warehouse A - Rack A-12",
    user: "John Smith",
    date: "2026-03-14",
    time: "14:30",
  },
  {
    id: "MOV-002",
    type: "delivery",
    description: "Order shipped to Acme Corporation",
    product: "Smart Watch Pro",
    quantity: 25,
    from: "Warehouse B - Rack B-05",
    to: "Customer",
    user: "Sarah Johnson",
    date: "2026-03-14",
    time: "12:15",
  },
  {
    id: "MOV-003",
    type: "transfer",
    description: "Internal transfer between warehouses",
    product: "USB-C Hub",
    quantity: 50,
    from: "Warehouse A - Rack A-08",
    to: "Warehouse C - Rack C-01",
    user: "Mike Chen",
    date: "2026-03-14",
    time: "10:45",
  },
  {
    id: "MOV-004",
    type: "adjustment",
    description: "Stock correction after audit",
    product: "Laptop Stand",
    quantity: 15,
    from: "System",
    to: "Physical Count",
    user: "Emily Davis",
    date: "2026-03-13",
    time: "16:20",
  },
  {
    id: "MOV-005",
    type: "receipt",
    description: "Stock received from Global Electronics",
    product: "Mechanical Keyboard",
    quantity: 200,
    from: "Supplier",
    to: "Warehouse B - Rack B-12",
    user: "John Smith",
    date: "2026-03-13",
    time: "09:00",
  },
  {
    id: "MOV-006",
    type: "delivery",
    description: "Order shipped to Tech Solutions Ltd",
    product: "Monitor Stand",
    quantity: 10,
    from: "Warehouse A - Rack A-15",
    to: "Customer",
    user: "Sarah Johnson",
    date: "2026-03-13",
    time: "11:30",
  },
  {
    id: "MOV-007",
    type: "transfer",
    description: "Restock transfer to main warehouse",
    product: "Wireless Mouse",
    quantity: 75,
    from: "Warehouse C - Rack C-08",
    to: "Warehouse A - Rack A-03",
    user: "Mike Chen",
    date: "2026-03-12",
    time: "15:00",
  },
  {
    id: "MOV-008",
    type: "adjustment",
    description: "Damaged items write-off",
    product: "Screen Protector",
    quantity: -20,
    from: "Warehouse B - Rack B-22",
    to: "Write-off",
    user: "Emily Davis",
    date: "2026-03-12",
    time: "14:00",
  },
];

const typeConfig: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  receipt: { icon: PackagePlus, bg: "bg-emerald-50", text: "text-emerald-700", label: "Receipt" },
  delivery: { icon: PackageMinus, bg: "bg-purple-50", text: "text-purple-700", label: "Delivery" },
  transfer: { icon: ArrowLeftRight, bg: "bg-blue-50", text: "text-blue-700", label: "Transfer" },
  adjustment: { icon: Scale, bg: "bg-orange-50", text: "text-orange-700", label: "Adjustment" },
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

function StatCard({ title, value, icon: Icon, color, delay }: {
  title: string; value: string; icon: React.ElementType; color: string; delay: number;
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
          </div>
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>
    </FloatingCard>
  );
}

export default function MoveHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7d");

  const filteredHistory = moveHistory.filter((move) => {
    const matchesSearch = move.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      move.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      move.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || move.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <main className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Move History</h1>
            <p className="text-[var(--text-secondary)] mt-1">Activity log of all inventory movements</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] px-6 py-3 rounded-xl font-medium shadow-lg shadow-black/20"
          >
            <Download className="w-5 h-5" />
            Export Log
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Movements" value="1,248" icon={History} color="from-zinc-500 to-zinc-600" delay={0.1} />
          <StatCard title="Receipts" value="342" icon={PackagePlus} color="from-emerald-500 to-teal-500" delay={0.2} />
          <StatCard title="Deliveries" value="486" icon={PackageMinus} color="from-purple-500 to-pink-500" delay={0.3} />
          <StatCard title="Transfers" value="420" icon={ArrowLeftRight} color="from-indigo-500 to-purple-500" delay={0.4} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search movements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "receipt", "delivery", "transfer", "adjustment"].map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-xl font-medium capitalize transition-colors ${typeFilter === type
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-slate-50 text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"}`}
              >
                {type}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--glass-border)] px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-[var(--text-secondary)] text-sm focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </motion.div>

        {/* Timeline View */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
          {filteredHistory.map((move, index) => {
            const TypeIcon = typeConfig[move.type].icon;
            return (
              <motion.div
                key={move.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-6 rounded-2xl hover:bg-indigo-50/50 transition-colors group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-t-2xl" />
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${typeConfig[move.type].bg}`}>
                    <TypeIcon className={`w-6 h-6 ${typeConfig[move.type].text}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-[var(--text-muted)]">{move.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig[move.type].bg} ${typeConfig[move.type].text}`}>
                            {typeConfig[move.type].label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-1">{move.description}</h3>
                        <p className="text-[var(--text-secondary)] mt-1">
                          <span className="text-[var(--text-primary)] font-medium">{move.product}</span>
                          <span className="mx-2">•</span>
                          <span className={move.quantity > 0 ? "text-emerald-600" : "text-red-600"}>
                            {move.quantity > 0 ? "+" : ""}{move.quantity} units
                          </span>
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Calendar className="w-4 h-4" />
                          <span>{move.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{move.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-muted)]">From:</span>
                        <span className="text-[var(--text-secondary)]">{move.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-muted)]">To:</span>
                        <span className="text-[var(--text-secondary)]">{move.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-[var(--text-secondary)]">{move.user}</span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all"
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Load More */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex justify-center pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:text-slate-700 hover:bg-[var(--hover-bg)] transition-colors shadow-lg shadow-black/20"
          >
            Load More
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </main>
    </>
  );
}
