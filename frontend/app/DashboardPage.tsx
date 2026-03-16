"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Clock,
  Zap,
  Sparkles,
  Activity,
  Plus,
  FileText,
  Truck,
  BarChart3,
  Target,
  Users,
  ShoppingCart,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Star,
  Flame,
  Crown,
  ChevronRight,
  Bell,
  X,
  Filter,
  MapPin,
  CircleDot,
  RotateCw,
  PackageCheck,
  Trophy,
  Medal,
  Timer,
  Building2,
  ThumbsUp,
  TrendingDown,
  Eye,
  Hash,
} from "lucide-react";
import StatsCard from "./StatsCard";
import InventoryCharts from "./InventoryCharts";
import AIInsightsPanel from "./AIInsightsPanel";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.state?.token) {
          headers.Authorization = "Bearer " + parsed.state.token;
          return headers;
        }
      } catch {}
    }

    const fallbackToken = localStorage.getItem("token");
    if (fallbackToken) headers.Authorization = "Bearer " + fallbackToken;
  }
  return headers;
}

// Recent activity data
const recentActivity = [
  {
    action: "Stock updated",
    item: "Widget Pro X",
    quantity: "+50 units",
    time: "2 min ago",
    icon: Package,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    action: "New product added",
    item: "Smart Gadget Z",
    quantity: "100 units",
    time: "15 min ago",
    icon: Zap,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    action: "Low stock alert",
    item: "Basic Widget",
    quantity: "5 units left",
    time: "1 hour ago",
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    action: "Order shipped",
    item: "Order #1234",
    quantity: "25 items",
    time: "2 hours ago",
    icon: ArrowUpRight,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

// Quick actions data
const quickActions = [
  { label: "New Product", icon: Plus, color: "from-emerald-500 to-teal-500", href: "?page=products" },
  { label: "Create Receipt", icon: FileText, color: "from-teal-500 to-cyan-500", href: "?page=receipts" },
  { label: "New Delivery", icon: Truck, color: "from-orange-500 to-amber-500", href: "?page=delivery-orders" },
  { label: "View Analytics", icon: BarChart3, color: "from-emerald-600 to-green-500", href: "?page=analytics" },
];

// Goals data
const goals = [
  { label: "Monthly Sales Target", current: 78500, target: 100000, unit: "$" },
  { label: "Orders Processed", current: 847, target: 1000, unit: "" },
  { label: "Customer Satisfaction", current: 94, target: 100, unit: "%" },
];

// Order status pipeline data
const orderPipeline = [
  { status: "Pending", count: 24, color: "from-amber-400 to-orange-500", iconColor: "text-amber-500", bgColor: "bg-amber-50", icon: Clock },
  { status: "Processing", count: 18, color: "from-blue-400 to-indigo-500", iconColor: "text-blue-500", bgColor: "bg-blue-50", icon: RotateCw },
  { status: "Shipped", count: 32, color: "from-teal-400 to-emerald-500", iconColor: "text-teal-500", bgColor: "bg-teal-50", icon: Truck },
  { status: "Delivered", count: 156, color: "from-emerald-400 to-green-500", iconColor: "text-emerald-500", bgColor: "bg-emerald-50", icon: PackageCheck },
];

// Low stock alerts data (fallback)
const defaultLowStockItems = [
  { name: "Wireless Mouse Pro", sku: "WMP-001", stock: 3, minStock: 25, category: "Electronics", urgency: "critical" },
  { name: "USB-C Cable 2m", sku: "UCC-204", stock: 8, minStock: 50, category: "Accessories", urgency: "critical" },
  { name: "Laptop Stand", sku: "LST-112", stock: 12, minStock: 30, category: "Furniture", urgency: "warning" },
  { name: "Screen Protector", sku: "SPR-089", stock: 15, minStock: 40, category: "Accessories", urgency: "warning" },
  { name: "Bluetooth Speaker", sku: "BTS-445", stock: 18, minStock: 35, category: "Electronics", urgency: "low" },
];

// Recent orders data (fallback)
const defaultRecentOrders = [
  { id: "#ORD-4523", customer: "Alex Thompson", items: 3, total: "$1,240.00", status: "Delivered", date: "2 hours ago" },
  { id: "#ORD-4522", customer: "Maria Garcia", items: 1, total: "$899.00", status: "Shipped", date: "4 hours ago" },
  { id: "#ORD-4521", customer: "James Wilson", items: 5, total: "$2,450.00", status: "Processing", date: "6 hours ago" },
  { id: "#ORD-4520", customer: "Sophie Liu", items: 2, total: "$567.00", status: "Pending", date: "8 hours ago" },
  { id: "#ORD-4519", customer: "David Kim", items: 4, total: "$1,890.00", status: "Delivered", date: "12 hours ago" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

type LowStockAlertItem = {
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  category: string;
  urgency: "critical" | "warning" | "low";
  updatedAt?: string;
};

type RecentOrderItem = {
  id: string;
  customer: string;
  items: number;
  total: string;
  status: string;
  date: string;
};

type TopProductItem = {
  name: string;
  sales: number;
  revenue: string;
  trend: string;
};

type TeamActivityEntry = {
  name: string;
  action: string;
  product: string;
  avatar: string;
  time: string;
};

type SupplierPerformanceEntry = {
  name: string;
  rating: number;
  onTime: number;
  quality: number;
  orders: number;
  trend: string;
  avatar: string;
};

type LiveFeedEntry = {
  id: string;
  message: string;
  detail: string;
  time: string;
  icon: typeof Activity;
  color: string;
  bg: string;
};

type LeaderboardEntry = {
  name: string;
  role: string;
  sales: string;
  avatar: string;
  trend: string;
};

function formatTimeAgo(value?: string | number | Date): string {
  if (!value) return "Just now";
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return "Just now";

  const diffMs = Date.now() - createdAt.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return `${Math.max(seconds, 1)}s ago`;
}

function toStatusLabel(status?: string): string {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name?: string): string {
  if (!name) return "NA";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatActionLabel(action?: string): string {
  if (!action) return "updated";
  return action.replace(/_/g, " ").toLowerCase();
}

function getFeedVisual(action?: string): Pick<LiveFeedEntry, "icon" | "color" | "bg"> {
  if (!action) {
    return { icon: Activity, color: "text-slate-600", bg: "bg-slate-100" };
  }
  if (action.startsWith("product") || action.startsWith("stock")) {
    return { icon: Package, color: "text-blue-500", bg: "bg-blue-50" };
  }
  if (action.startsWith("delivery")) {
    return { icon: Truck, color: "text-emerald-500", bg: "bg-emerald-50" };
  }
  if (action.startsWith("receipt")) {
    return { icon: FileText, color: "text-violet-500", bg: "bg-violet-50" };
  }
  if (action.startsWith("transfer")) {
    return { icon: ArrowLeftRight, color: "text-cyan-500", bg: "bg-cyan-50" };
  }
  if (action.startsWith("adjustment")) {
    return { icon: RotateCw, color: "text-amber-500", bg: "bg-amber-50" };
  }
  if (action.startsWith("user")) {
    return { icon: Users, color: "text-fuchsia-500", bg: "bg-fuchsia-50" };
  }
  return { icon: Activity, color: "text-slate-600", bg: "bg-slate-100" };
}

const STATUS_OPTIONS_BY_DOCUMENT: Record<string, Array<{ value: string; label: string }>> = {
  all: [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "waiting", label: "Waiting" },
    { value: "ready", label: "Ready" },
    { value: "done", label: "Done" },
    { value: "pending", label: "Pending" },
    { value: "picking", label: "Picking" },
    { value: "packing", label: "Packing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "in_transit", label: "In Transit" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "applied", label: "Applied" },
  ],
  receipts: [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "waiting", label: "Waiting" },
    { value: "ready", label: "Ready" },
    { value: "done", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
  ],
  delivery: [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "picking", label: "Picking" },
    { value: "packing", label: "Packing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ],
  internal: [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "in_transit", label: "In Transit" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],
  adjustments: [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "applied", label: "Applied" },
    { value: "cancelled", label: "Cancelled" },
  ],
};

// Animated counter component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Progress bar component
function AnimatedProgress({ value, color }: { value: number; color: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
}

// Notification banner
function NotificationBanner({ onClose, onExplore }: { onClose: () => void; onExplore: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 mb-6"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
          >
            <Bell className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <p className="text-white font-semibold">New Feature Available!</p>
            <p className="text-white/80 text-sm">Advanced analytics dashboard is now live. Check it out!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExplore}
            className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Explore Now
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Quick action card
function QuickActionCard({ action, index }: { action: typeof quickActions[0]; index: number }) {
  return (
    <motion.a
      href={action.href}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-200/60 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
      <div className="relative flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}>
          <action.icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 group-hover:text-slate-900">{action.label}</p>
          <p className="text-sm text-slate-500">Quick access</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.a>
  );
}

// Top product row
function TopProductRow({ product, index }: { product: TopProductItem; index: number }) {
  const rankIcons = [Crown, Star, Flame, Sparkles];
  const rankColors = ["text-amber-500", "text-slate-400", "text-orange-500", "text-purple-500"];
  const RankIcon = rankIcons[index] || Star;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      whileHover={{ x: 4, backgroundColor: "rgba(241, 245, 249, 0.8)" }}
      className="group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-slate-200/60 transition-all cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center ${rankColors[index]}`}>
        <RankIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
          {product.name}
        </p>
        <p className="text-sm text-slate-500">{product.sales} units sold</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-800">{product.revenue}</p>
        <p className="text-sm text-emerald-600 font-medium">{product.trend}</p>
      </div>
    </motion.div>
  );
}

// Goal progress card
function GoalCard({ goal, index }: { goal: typeof goals[0]; index: number }) {
  const percentage = Math.round((goal.current / goal.target) * 100);
  const colors = [
    "from-emerald-500 to-teal-500",
    "from-teal-500 to-cyan-500",
    "from-green-500 to-emerald-500",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="p-4 rounded-xl bg-slate-50/50 border border-slate-100"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{goal.label}</span>
        <span className="text-sm font-bold text-slate-800">{percentage}%</span>
      </div>
      <AnimatedProgress value={percentage} color={colors[index % colors.length]} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">
          {goal.unit}{goal.current.toLocaleString()} / {goal.unit}{goal.target.toLocaleString()}
        </span>
        {percentage >= 90 && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Almost there!
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Team member activity
function TeamActivityItem({ member, index }: { member: TeamActivityEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
        {member.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold text-slate-800">{member.name}</span>
          <span className="text-slate-500"> {member.action} </span>
          <span className="font-medium text-slate-700">{member.product}</span>
        </p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{member.time}</span>
    </motion.div>
  );
}

// Order Status Pipeline
function OrderPipeline() {
  const total = orderPipeline.reduce((sum, s) => sum + s.count, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-blue-500 via-teal-500 to-emerald-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Order Pipeline</h3>
                <p className="text-sm text-slate-500">{total} total orders in pipeline</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {orderPipeline.map((stage, index) => (
              <motion.div
                key={stage.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -2 }}
                className="relative p-4 rounded-xl bg-slate-50/50 border border-slate-100 group cursor-pointer hover:border-slate-200 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stage.bgColor}`}>
                    <stage.icon className={`w-4 h-4 ${stage.iconColor}`} />
                  </div>
                  {index < orderPipeline.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden md:block" />
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800">{stage.count}</p>
                <p className="text-sm text-slate-500 font-medium">{stage.status}</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.count / total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Low Stock Alerts Table
function LowStockAlerts({ items }: { items: LowStockAlertItem[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-orange-500 to-amber-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/25">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Low Stock Alerts</h3>
                <p className="text-sm text-slate-500">{items.length} items need attention</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {items.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                No low-stock products match the selected filters.
              </div>
            )}
            {items.map((item, index) => (
              <motion.div
                key={item.sku}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.08 }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.urgency === "critical" ? "bg-red-500 animate-pulse" :
                    item.urgency === "warning" ? "bg-amber-500" : "bg-yellow-400"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.sku} &middot; {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${item.urgency === "critical" ? "text-red-600" : "text-amber-600"}`}>
                      {item.stock} left
                    </p>
                    <p className="text-xs text-slate-400">min: {item.minStock}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Reorder
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Recent Orders List
function RecentOrdersList({ orders }: { orders: RecentOrderItem[] }) {
  const statusConfig: Record<string, { color: string; bg: string }> = {
    Delivered: { color: "text-emerald-700", bg: "bg-emerald-50" },
    Shipped: { color: "text-blue-700", bg: "bg-blue-50" },
    Processing: { color: "text-amber-700", bg: "bg-amber-50" },
    Pending: { color: "text-slate-700", bg: "bg-slate-100" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
                <p className="text-sm text-slate-500">Latest order activity</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all">
              View All
            </motion.button>
          </div>
          <div className="space-y-2">
            {orders.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                No delivery orders match the selected filters.
              </div>
            )}
            {orders.map((order, index) => {
              const sc = statusConfig[order.status] || statusConfig.Pending;
              return (
                <motion.div
                  key={`${order.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Hash className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{order.id}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{order.customer} &middot; {order.items} items</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{order.total}</p>
                    <p className="text-xs text-slate-400">{order.date}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Supplier Performance
function SupplierPerformance({ suppliers }: { suppliers: SupplierPerformanceEntry[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 shadow-lg shadow-sky-500/25">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Supplier Performance</h3>
                <p className="text-sm text-slate-500">Top suppliers ranked</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {suppliers.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                No supplier performance data available.
              </div>
            )}
            {suppliers.map((supplier, index) => (
              <motion.div
                key={`${supplier.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="p-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {supplier.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{supplier.name}</p>
                      <p className="text-xs text-slate-400">{supplier.orders} orders fulfilled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-slate-800">{supplier.rating}</span>
                    <span className={`text-xs font-medium ml-1 ${supplier.trend.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                      {supplier.trend}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">On-time: <span className="font-semibold text-slate-700">{supplier.onTime}%</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">Quality: <span className="font-semibold text-slate-700">{supplier.quality}%</span></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Live Activity Feed
function LiveActivityFeed({ events }: { events: LiveFeedEntry[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Live Activity Feed</h3>
                <p className="text-sm text-slate-500">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
              <span className="text-xs font-medium text-emerald-600">Live</span>
            </div>
          </div>
          <div className="space-y-1">
            {events.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                No recent activity found.
              </div>
            )}
            {events.map((event, index) => (
              <motion.div
                key={`${event.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors relative"
              >
                {index < events.length - 1 && (
                  <div className="absolute left-[1.65rem] top-12 bottom-0 w-px bg-slate-100" />
                )}
                <div className={`p-2 rounded-lg ${event.bg} flex-shrink-0`}>
                  <event.icon className={`w-3.5 h-3.5 ${event.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{event.message}</p>
                  <p className="text-xs text-slate-500">{event.detail}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{event.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Team Leaderboard
function TeamLeaderboard({ members }: { members: LeaderboardEntry[] }) {
  const medalColors = ["from-amber-400 to-yellow-500", "from-slate-300 to-slate-400", "from-orange-400 to-amber-500"];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Team Leaderboard</h3>
                <p className="text-sm text-slate-500">This month&apos;s performance</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {members.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                No team leaderboard data available.
              </div>
            )}
            {members.map((member, index) => (
              <motion.div
                key={`${member.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.08 }}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {/* Rank */}
                <div className="w-7 flex-shrink-0">
                  {index < 3 ? (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${medalColors[index]} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-500 text-xs font-bold">{index + 1}</span>
                    </div>
                  )}
                </div>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                  index === 0 ? "bg-gradient-to-br from-amber-500 to-yellow-500" :
                  index === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                  "bg-gradient-to-br from-emerald-500 to-teal-500"
                }`}>
                  {member.avatar}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.role}</p>
                </div>
                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">{member.sales}</p>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs text-emerald-600 font-medium">{member.trend}</span>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <motion.div className="flex flex-col items-center gap-4">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-[var(--text-secondary)] font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Dashboard...
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    activeTransfers: 0,
  });
  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [dashboardFilters, setDashboardFilters] = useState({
    documentType: "all",
    status: "all",
    warehouse: "all",
    category: "all",
  });
  const [lowStockList, setLowStockList] = useState<LowStockAlertItem[]>(defaultLowStockItems as LowStockAlertItem[]);
  const [recentOrdersList, setRecentOrdersList] = useState<RecentOrderItem[]>(defaultRecentOrders);
  const [topProductsList, setTopProductsList] = useState<TopProductItem[]>([]);
  const [teamActivityList, setTeamActivityList] = useState<TeamActivityEntry[]>([]);
  const [supplierPerformanceList, setSupplierPerformanceList] = useState<SupplierPerformanceEntry[]>([]);
  const [liveFeedList, setLiveFeedList] = useState<LiveFeedEntry[]>([]);
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const statusOptions = STATUS_OPTIONS_BY_DOCUMENT[dashboardFilters.documentType] || STATUS_OPTIONS_BY_DOCUMENT.all;

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    if (!mounted) return;

    setLoadingStats(true);
    try {
      // Compute inventory counters from inventory constrained by selected warehouse/category filters.
      const productParams = new URLSearchParams({ page: "1", limit: "10000" });
      if (dashboardFilters.warehouse !== "all") {
        productParams.set("warehouse", dashboardFilters.warehouse);
      }
      if (dashboardFilters.category !== "all") {
        productParams.set("category", dashboardFilters.category);
      }

      const shouldLoadDeliveries =
        dashboardFilters.documentType === "all" || dashboardFilters.documentType === "delivery";

      const deliveriesParams = new URLSearchParams({ limit: "5" });
      if (dashboardFilters.warehouse !== "all") {
        deliveriesParams.set("warehouse", dashboardFilters.warehouse);
      }
      if (dashboardFilters.status !== "all") {
        deliveriesParams.set("status", dashboardFilters.status);
      }

      // Analytics params for receipts/deliveries/transfers counts
      const analyticsParams = new URLSearchParams();
      analyticsParams.set("documentType", dashboardFilters.documentType);
      analyticsParams.set("status", dashboardFilters.status);
      analyticsParams.set("warehouse", dashboardFilters.warehouse);
      analyticsParams.set("category", dashboardFilters.category);

      const [productsRes, analyticsRes, deliveriesRes, topProductsRes, activityLogsRes, warehousePerfRes] = await Promise.all([
        fetch(`${API_BASE}/api/products?${productParams.toString()}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/analytics/dashboard?${analyticsParams.toString()}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        }),
        shouldLoadDeliveries
          ? fetch(`${API_BASE}/api/deliveries?${deliveriesParams.toString()}`, {
              headers: getAuthHeaders(),
              cache: "no-store",
            })
          : Promise.resolve(null),
        fetch(`${API_BASE}/api/analytics/top-products?period=30&limit=4`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/analytics/activity-logs?page=1&limit=20`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/analytics/warehouse-performance`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        }),
      ]);

      // Compute product stats directly from the full product list — same source as Products page
      let totalProducts = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const products: Array<{
          name?: string;
          sku?: string;
          category?: string;
          stockQuantity?: number;
          stock?: number;
          minStockLevel?: number;
          updatedAt?: string;
        }> =
          productsData.data || [];
        totalProducts = products.length;
        const computedLowStock: LowStockAlertItem[] = [];
        for (const p of products) {
          const stock = p.stockQuantity ?? p.stock ?? 0;
          const minStock = p.minStockLevel ?? 10;
          if (stock === 0) {
            outOfStockProducts++;
          } else if (stock <= minStock) {
            lowStockProducts++;
          }

          if (stock <= minStock) {
            const ratio = minStock > 0 ? stock / minStock : 0;
            const urgency: LowStockAlertItem["urgency"] =
              stock <= 0 || ratio <= 0.25 ? "critical" : ratio <= 0.6 ? "warning" : "low";

            computedLowStock.push({
              name: p.name || "Unnamed Product",
              sku: p.sku || "-",
              category: p.category || "Other",
              stock,
              minStock,
              urgency,
              updatedAt: p.updatedAt,
            });
          }
        }

        computedLowStock.sort((a, b) => {
          const score = (x: LowStockAlertItem) => {
            if (x.urgency === "critical") return 0;
            if (x.urgency === "warning") return 1;
            return 2;
          };
          const urgencyDelta = score(a) - score(b);
          if (urgencyDelta !== 0) return urgencyDelta;

          const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          if (updatedB !== updatedA) return updatedB - updatedA;

          return a.stock - b.stock;
        });

        setLowStockList(computedLowStock.slice(0, 10));
      }

      // Operational counts + filter options come from analytics
      let pendingReceipts = 0;
      let pendingDeliveries = 0;
      let activeTransfers = 0;

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success && analyticsData.data?.stats) {
          pendingReceipts = Number(analyticsData.data.stats.pendingReceipts || 0);
          pendingDeliveries = Number(analyticsData.data.stats.pendingDeliveries || 0);
          activeTransfers = Number(analyticsData.data.stats.activeTransfers || 0);
        }
        if (Array.isArray(analyticsData.data?.stockByCategory)) {
          const categories = analyticsData.data.stockByCategory
            .map((entry: { _id?: string }) => entry._id)
            .filter((entry: string | undefined) => Boolean(entry)) as string[];
          setCategoryOptions(categories);
        }
        if (Array.isArray(analyticsData.data?.stockByWarehouse)) {
          const warehouses = analyticsData.data.stockByWarehouse
            .filter((entry: { _id?: string; name?: string }) => Boolean(entry._id) && Boolean(entry.name))
            .map((entry: { _id?: string; name?: string }) => ({ id: String(entry._id), name: String(entry.name) }));
          setWarehouseOptions(warehouses);
        }
      }

      if (!shouldLoadDeliveries) {
        setRecentOrdersList([]);
      } else if (deliveriesRes?.ok) {
        const deliveriesData = await deliveriesRes.json();
        const deliveries = Array.isArray(deliveriesData.data) ? deliveriesData.data : [];
        const mappedOrders: RecentOrderItem[] = deliveries.slice(0, 5).map((order: {
          _id?: string;
          orderId?: string;
          orderNumber?: string;
          customer?: string;
          totalItems?: number;
          totalUnits?: number;
          totalAmount?: number;
          items?: Array<unknown>;
          status?: string;
          createdAt?: string;
        }) => {
          const itemCount = Number(order.totalItems ?? order.items?.length ?? 0);
          const totalLabel =
            typeof order.totalAmount === "number"
              ? `$${order.totalAmount.toLocaleString()}`
              : `${Number(order.totalUnits || 0)} units`;

          return {
            id: `#${String(order.orderId || order.orderNumber || order._id || "N/A")}`,
            customer: order.customer || "Walk-in Customer",
            items: itemCount,
            total: totalLabel,
            status: toStatusLabel(order.status),
            date: formatTimeAgo(order.createdAt),
          };
        });
        setRecentOrdersList(mappedOrders);
      }

      if (topProductsRes.ok) {
        const topProductsData = await topProductsRes.json();
        const topRows = Array.isArray(topProductsData.data) ? topProductsData.data : [];
        const mappedTopProducts: TopProductItem[] = topRows.map((row: {
          name?: string;
          totalSold?: number;
          totalRevenue?: number;
          orderCount?: number;
        }) => ({
          name: row.name || "Unnamed Product",
          sales: Number(row.totalSold || 0),
          revenue: `$${Number(row.totalRevenue || 0).toLocaleString()}`,
          trend: `${Number(row.orderCount || 0)} orders`,
        }));
        setTopProductsList(mappedTopProducts);
      }

      if (activityLogsRes.ok) {
        const activityData = await activityLogsRes.json();
        const logs = Array.isArray(activityData.data) ? activityData.data : [];

        const mappedTeam: TeamActivityEntry[] = logs.slice(0, 4).map((log: {
          user?: { name?: string };
          action?: string;
          details?: string;
          createdAt?: string;
        }) => {
          const userName = log.user?.name || "System User";
          return {
            name: userName,
            action: formatActionLabel(log.action),
            product: log.details || "inventory record",
            avatar: getInitials(userName),
            time: formatTimeAgo(log.createdAt),
          };
        });
        setTeamActivityList(mappedTeam);

        const mappedFeed: LiveFeedEntry[] = logs.slice(0, 6).map((log: {
          _id?: string;
          action?: string;
          details?: string;
          entity?: string;
          createdAt?: string;
        }) => {
          const visual = getFeedVisual(log.action);
          const actionText = formatActionLabel(log.action);
          return {
            id: String(log._id || `${log.action}-${log.createdAt || Date.now()}`),
            message: actionText.charAt(0).toUpperCase() + actionText.slice(1),
            detail: log.details || `${log.entity || "record"} updated`,
            time: formatTimeAgo(log.createdAt),
            icon: visual.icon,
            color: visual.color,
            bg: visual.bg,
          };
        });
        setLiveFeedList(mappedFeed);

        const userScoreMap = new Map<string, { name: string; count: number; lastAction?: string }>();
        for (const log of logs) {
          const userName = log?.user?.name || "System User";
          const existing = userScoreMap.get(userName) || { name: userName, count: 0, lastAction: undefined };
          existing.count += 1;
          existing.lastAction = log?.action || existing.lastAction;
          userScoreMap.set(userName, existing);
        }
        const totalActions = logs.length || 1;
        const leaderboard = Array.from(userScoreMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((entry) => ({
            name: entry.name,
            role: formatActionLabel(entry.lastAction || "operations"),
            sales: `${entry.count} actions`,
            avatar: getInitials(entry.name),
            trend: `+${Math.max(1, Math.round((entry.count / totalActions) * 100))}%`,
          }));
        setLeaderboardList(leaderboard);
      }

      if (warehousePerfRes.ok) {
        const warehouseData = await warehousePerfRes.json();
        const rows = Array.isArray(warehouseData.data) ? warehouseData.data : [];
        const mappedSuppliers: SupplierPerformanceEntry[] = rows.slice(0, 4).map((row: {
          name?: string;
          productCount?: number;
          lowStockCount?: number;
          throughput?: { total?: number; receiptsIn?: number; deliveriesOut?: number };
          utilizationPercent?: number;
        }) => {
          const orders = Number(row.throughput?.total || 0);
          const quality = row.productCount
            ? Math.max(0, Math.min(100, Math.round(((row.productCount - Number(row.lowStockCount || 0)) / row.productCount) * 100)))
            : 100;
          const onTime = Math.max(0, Math.min(100, Math.round(60 + (Number(row.throughput?.deliveriesOut || 0) * 40) / Math.max(orders, 1))));
          const rating = Number(Math.max(3, Math.min(5, (quality / 100) * 2 + 3)).toFixed(1));
          const trendValue = Number(row.utilizationPercent || 0) - 50;
          return {
            name: row.name || "Warehouse",
            rating,
            onTime,
            quality,
            orders,
            trend: `${trendValue >= 0 ? "+" : ""}${Math.round(trendValue / 10)}%`,
            avatar: getInitials(row.name || "WH"),
          };
        });
        setSupplierPerformanceList(mappedSuppliers);
      }

      setDashboardStats({
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        pendingReceipts,
        pendingDeliveries,
        activeTransfers,
      });
    } catch {
      // keep current values if both APIs are unavailable
    } finally {
      setLoadingStats(false);
    }
  }, [mounted, dashboardFilters]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (!mounted) return;

    const socket = io(API_BASE, { transports: ["websocket"] });
    socketRef.current = socket;

    const refresh = () => {
      void fetchDashboardStats();
    };

    socket.on("dashboard:refresh", refresh);
    socket.on("product_update", refresh);

    const onFocus = () => {
      void fetchDashboardStats();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboardStats();
      }
    };

    const poll = window.setInterval(() => {
      void fetchDashboardStats();
    }, 30000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      socket.off("dashboard:refresh", refresh);
      socket.off("product_update", refresh);
      socket.disconnect();
    };
  }, [mounted, fetchDashboardStats]);

  const handleExplore = () => {
    router.push("/?page=analytics");
    setShowBanner(false);
  };

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1800px] mx-auto">
      {/* Notification Banner */}
      <AnimatePresence>
        {showBanner && <NotificationBanner onClose={() => setShowBanner(false)} onExplore={handleExplore} />}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white backdrop-blur-sm border border-slate-200/60 shadow-sm"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={14} className="text-emerald-500" />
                </motion.div>
                <span className="text-sm font-semibold text-gradient">Live Dashboard</span>
              </motion.div>
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Activity size={14} className="text-emerald-500" />
                </motion.div>
                <span>Real-time updates</span>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="text-[var(--text-primary)]">Welcome back, </span>
              <span className="text-gradient">Admin</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              Here&apos;s your inventory overview for today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.label} action={action} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Dynamic Dashboard Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4" /> Dashboard Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={dashboardFilters.documentType}
            onChange={(e) => setDashboardFilters((prev) => ({ ...prev, documentType: e.target.value, status: "all" }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="all">All Documents</option>
            <option value="receipts">Receipts</option>
            <option value="delivery">Delivery</option>
            <option value="internal">Internal Transfers</option>
            <option value="adjustments">Adjustments</option>
          </select>

          <select
            value={dashboardFilters.status}
            onChange={(e) => setDashboardFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={dashboardFilters.warehouse}
            onChange={(e) => setDashboardFilters((prev) => ({ ...prev, warehouse: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="all">All Warehouses / Locations</option>
            {warehouseOptions.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>

          <select
            value={dashboardFilters.category}
            onChange={(e) => setDashboardFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8"
      >
        <StatsCard
          title="Total Products"
          value={dashboardStats.totalProducts.toLocaleString()}
          change="Current stock items"
          changeType="positive"
          icon={Package}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Low / Out Of Stock"
          value={`${dashboardStats.lowStockProducts}/${dashboardStats.outOfStockProducts}`}
          change="Low stock / Out of stock"
          changeType="negative"
          icon={AlertTriangle}
          color="orange"
          delay={0.1}
        />
        <StatsCard
          title="Pending Receipts"
          value={dashboardStats.pendingReceipts.toLocaleString()}
          change="Incoming stock documents"
          changeType="positive"
          icon={FileText}
          color="green"
          delay={0.2}
        />
        <StatsCard
          title="Pending Deliveries"
          value={dashboardStats.pendingDeliveries.toLocaleString()}
          change="Outgoing stock documents"
          changeType="positive"
          icon={Truck}
          color="purple"
          delay={0.3}
        />
        <StatsCard
          title="Transfers Scheduled"
          value={dashboardStats.activeTransfers.toLocaleString()}
          change="Internal transfer queue"
          changeType="positive"
          icon={ArrowLeftRight}
          color="blue"
          delay={0.4}
        />
      </motion.div>

      {/* Goals Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Monthly Goals</h3>
                  <p className="text-sm text-slate-500">Track your progress</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 rounded-xl transition-all"
              >
                View Details
              </motion.button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goals.map((goal, index) => (
                <GoalCard key={goal.label} goal={goal} index={index} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <InventoryCharts />

      {/* Order Status Pipeline */}
      <div className="mt-8">
        <OrderPipeline />
      </div>

      {/* Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentOrdersList orders={recentOrdersList} />
        <LowStockAlerts items={lowStockList} />
      </div>

      {/* Bottom Grid - Top Products, Team Activity, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Top Products</h3>
                    <p className="text-sm text-slate-500">Best sellers this month</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {topProductsList.length === 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                    No top product data available.
                  </div>
                )}
                {topProductsList.map((product, index) => (
                  <TopProductRow key={`${product.name}-${index}`} product={product} index={index} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Team Activity</h3>
                    <p className="text-sm text-slate-500">Recent team updates</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {teamActivityList.length === 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-500">
                    No recent team updates.
                  </div>
                )}
                {teamActivityList.map((member, index) => (
                  <TeamActivityItem key={`${member.name}-${member.time}-${index}`} member={member} index={index} />
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-3 text-sm font-medium text-slate-600 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                View All Activity
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="lg:col-span-1"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)] h-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                    <p className="text-sm text-slate-500">Latest updates</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ x: 4 }}
                      className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`p-2 rounded-lg ${activity.bgColor} ${activity.iconColor}`}
                        >
                          <activity.icon size={16} />
                        </motion.div>
                        <div>
                          <p className="font-medium text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {activity.action}
                          </p>
                          <p className="text-xs text-slate-500">{activity.item}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{activity.quantity}</p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Supplier Performance, Live Feed, Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <SupplierPerformance suppliers={supplierPerformanceList} />
        <LiveActivityFeed events={liveFeedList} />
        <AIInsightsPanel />
      </div>

      {/* Team Leaderboard */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <TeamLeaderboard members={leaderboardList} />
      </div>

      {/* Footer spacer */}
      <div className="h-10" />
    </div>
  );
}
