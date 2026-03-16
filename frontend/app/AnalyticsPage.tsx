"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from "recharts";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
// Analytics Data
const revenueData = [
  { month: "Jan", revenue: 45000, orders: 120, profit: 12000 },
  { month: "Feb", revenue: 52000, orders: 145, profit: 15000 },
  { month: "Mar", revenue: 48000, orders: 130, profit: 13500 },
  { month: "Apr", revenue: 61000, orders: 180, profit: 18000 },
  { month: "May", revenue: 55000, orders: 160, profit: 16000 },
  { month: "Jun", revenue: 67000, orders: 200, profit: 20000 },
  { month: "Jul", revenue: 72000, orders: 220, profit: 22000 },
  { month: "Aug", revenue: 69000, orders: 210, profit: 21000 },
  { month: "Sep", revenue: 78000, orders: 245, profit: 24000 },
  { month: "Oct", revenue: 82000, orders: 260, profit: 26000 },
  { month: "Nov", revenue: 91000, orders: 290, profit: 29000 },
  { month: "Dec", revenue: 98000, orders: 320, profit: 32000 },
];

const categoryData = [
  { name: "Electronics", value: 35, color: "#3b82f6" },
  { name: "Clothing", value: 25, color: "#8b5cf6" },
  { name: "Food & Beverages", value: 20, color: "#a78bfa" },
  { name: "Home & Garden", value: 12, color: "#10b981" },
  { name: "Sports", value: 8, color: "#f59e0b" },
];

const topProducts = [
  { name: "Wireless Headphones", sales: 1250, revenue: 62500, growth: 15.2 },
  { name: "Smart Watch Pro", sales: 980, revenue: 147000, growth: 22.5 },
  { name: "Laptop Stand", sales: 850, revenue: 25500, growth: -3.2 },
  { name: "USB-C Hub", sales: 720, revenue: 28800, growth: 8.7 },
  { name: "Mechanical Keyboard", sales: 650, revenue: 58500, growth: 12.1 },
];

const regionData = [
  { region: "North America", sales: 45000, percentage: 35 },
  { region: "Europe", sales: 38000, percentage: 29 },
  { region: "Asia Pacific", sales: 28000, percentage: 22 },
  { region: "Latin America", sales: 12000, percentage: 9 },
  { region: "Middle East", sales: 6000, percentage: 5 },
];

const hourlyData = [
  { hour: "00:00", orders: 12 },
  { hour: "02:00", orders: 8 },
  { hour: "04:00", orders: 5 },
  { hour: "06:00", orders: 15 },
  { hour: "08:00", orders: 45 },
  { hour: "10:00", orders: 78 },
  { hour: "12:00", orders: 95 },
  { hour: "14:00", orders: 88 },
  { hour: "16:00", orders: 72 },
  { hour: "18:00", orders: 65 },
  { hour: "20:00", orders: 48 },
  { hour: "22:00", orders: 25 },
];

const performanceData = [
  { metric: "Revenue", current: 85, target: 100 },
  { metric: "Orders", current: 92, target: 100 },
  { metric: "Customers", current: 78, target: 100 },
  { metric: "Retention", current: 88, target: 100 },
  { metric: "Conversion", current: 65, target: 100 },
  { metric: "Satisfaction", current: 95, target: 100 },
];

const inventoryHealth = [
  { status: "Healthy Stock", count: 245, color: "#10b981" },
  { status: "Low Stock", count: 32, color: "#f59e0b" },
  { status: "Out of Stock", count: 8, color: "#ef4444" },
  { status: "Overstocked", count: 15, color: "#3b82f6" },
];

const forecastData = [
  { month: "Jan", actual: 98000, forecast: 95000 },
  { month: "Feb", actual: null, forecast: 102000 },
  { month: "Mar", actual: null, forecast: 108000 },
  { month: "Apr", actual: null, forecast: 115000 },
  { month: "May", actual: null, forecast: 122000 },
  { month: "Jun", actual: null, forecast: 130000 },
];

type ExportFormat = "csv" | "excel" | "pdf";

type ToastState = {
  message: string;
  type: "success" | "error";
};

const exportOptions: { label: string; format: ExportFormat }[] = [
  { label: "Export CSV", format: "csv" },
  { label: "Export Excel", format: "excel" },
  { label: "Export PDF", format: "pdf" },
];

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
      } catch (error) {
        console.error("Unable to parse auth storage", error);
      }
    }
  }
  return headers;
}

// KPI Card Component
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card p-6 rounded-2xl relative overflow-hidden group"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2">{value}</h3>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-[var(--text-muted)] text-sm">vs last month</span>
          </div>
        </div>

        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`p-3 rounded-xl bg-gradient-to-br ${color}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Chart Card Component
function ChartCard({
  title,
  children,
  delay,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {actions}
      </div>
      {children}
    </motion.div>
  );
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-lg border border-[var(--glass-border)]">
        <p className="text-[var(--text-primary)] font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live data states (fallback to hardcoded)
  const [liveTopProducts, setLiveTopProducts] = useState(topProducts);
  const [liveStockMovement, setLiveStockMovement] = useState(revenueData);
  const [liveInventoryHealth, setLiveInventoryHealth] = useState(inventoryHealth);
  const [liveTurnover, setLiveTurnover] = useState<{ category: string; rate: number; color: string }[]>([]);
  const [liveDeadStock, setLiveDeadStock] = useState<{ name: string; sku: string; daysSinceMovement: number; stock: number }[]>([]);
  const [liveKpis, setLiveKpis] = useState({
    totalRevenue: "$818,000",
    totalOrders: "2,480",
    productsSold: "5,420",
    activeProducts: "1,250",
    revenueChange: 12.5,
    ordersChange: 8.2,
    productsChange: -2.4,
    customersChange: 18.7,
  });

  // Compute chart data with fallback to ensure data is always displayed
  const chartData = useMemo(() => {
    const hasData = liveStockMovement.some(
      (d) => (d.revenue || 0) > 0 || (d.orders || 0) > 0 || (d.profit || 0) > 0
    );
    return hasData ? liveStockMovement : revenueData;
  }, [liveStockMovement]);

  const fetchAnalytics = useCallback(async () => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    const headers = getAuthHeaders();

    try {
      const [turnoverRes, topRes, deadRes, movementRes, healthRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/analytics/turnover?period=${days}`, { headers }),
        fetch(`${API_BASE}/api/analytics/top-products?period=${days}`, { headers }),
        fetch(`${API_BASE}/api/analytics/dead-stock?days=60`, { headers }),
        fetch(`${API_BASE}/api/analytics/stock-movement?months=12`, { headers }),
        fetch(`${API_BASE}/api/analytics/warehouse-performance`, { headers }),
      ]);

      // Turnover
      if (turnoverRes.status === "fulfilled" && turnoverRes.value.ok) {
        const data = await turnoverRes.value.json();
        if (data.success && data.data) {
          const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
          if (Array.isArray(data.data)) {
            setLiveTurnover(data.data.map((d: { category?: string; turnoverRate?: number }, i: number) => ({
              category: d.category || "Unknown",
              rate: d.turnoverRate || 0,
              color: colors[i % colors.length],
            })));
          } else if (data.data.overallRate !== undefined) {
            setLiveKpis(prev => ({ ...prev, totalRevenue: `$${Math.round(data.data.totalCOGS || 0).toLocaleString()}` }));
          }
        }
      }

      // Top products
      if (topRes.status === "fulfilled" && topRes.value.ok) {
        const data = await topRes.value.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setLiveTopProducts(data.data.slice(0, 5).map((p: { name?: string; totalSold?: number; totalRevenue?: number; growth?: number }) => ({
            name: p.name || "Unknown",
            sales: p.totalSold || 0,
            revenue: p.totalRevenue || 0,
            growth: p.growth || 0,
          })));
        }
      }

      // Dead stock
      if (deadRes.status === "fulfilled" && deadRes.value.ok) {
        const data = await deadRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          setLiveDeadStock(
            data.data.slice(0, 10).map((item: { name?: string; sku?: string; stockQuantity?: number; stock?: number; daysDormant?: number; daysSinceMovement?: number }) => ({
              name: item.name || "Unknown",
              sku: item.sku || "-",
              stock: Number(item.stockQuantity ?? item.stock ?? 0),
              daysSinceMovement: Number(item.daysDormant ?? item.daysSinceMovement ?? 0),
            }))
          );
        }
      }

      // Stock movement
      if (movementRes.status === "fulfilled" && movementRes.value.ok) {
        const data = await movementRes.value.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const mappedData = data.data.map((d: { month?: number; receiptsIn?: number; deliveriesOut?: number }) => ({
            month: months[(d.month || 1) - 1],
            revenue: d.receiptsIn || 0,
            orders: d.deliveriesOut || 0,
            profit: Math.max(0, (d.receiptsIn || 0) - (d.deliveriesOut || 0)),
          }));
          // Only update if we have meaningful data (at least some non-zero values)
          const hasData = mappedData.some((d: { revenue: number; orders: number }) => d.revenue > 0 || d.orders > 0);
          if (hasData) {
            setLiveStockMovement(mappedData);
          }
          // If no meaningful data, keep the fallback revenueData
        }
      }

      // Warehouse performance → inventory health
      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const data = await healthRes.value.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const total = data.data.reduce((s: number, w: { productCount?: number }) => s + (w.productCount || 0), 0);
          setLiveKpis(prev => ({ ...prev, activeProducts: total.toLocaleString() }));
        }
      }
    } catch {
      // Keep fallback data on network errors
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  };

  const [exporting, setExporting] = useState(false);
  const [tooltip, setTooltip] = useState<ToastState | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!tooltip) return;
    const timer = setTimeout(() => setTooltip(null), 3000);
    return () => clearTimeout(timer);
  }, [tooltip]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const showToast = (message: string, type: ToastState["type"]) => {
    setTooltip({ message, type });
  };

  const exportButtonClass = exporting ? "opacity-70 pointer-events-none" : "";

  const triggerExport = async (format: ExportFormat) => {
    setExporting(true);
    setIsDropdownOpen(false);
    try {
      const reportDate = new Date();
      const reportRows = chartData.map((row: { month?: string; revenue?: number; orders?: number; profit?: number }) => ({
        Month: row.month || "-",
        Revenue: Number(row.revenue || 0),
        Orders: Number(row.orders || 0),
        Profit: Number(row.profit || 0),
      }));

      let blob: Blob;
      let extension: string = format;

      if (format === "csv") {
        const header = "Month,Revenue,Orders,Profit";
        const lines = reportRows.map((r) => `${r.Month},${r.Revenue},${r.Orders},${r.Profit}`);
        blob = new Blob(["\uFEFF" + header + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      } else if (format === "excel") {
        extension = "xlsx";
        const wb = XLSX.utils.book_new();
        const titleRows = [
          ["CoreInventory Analytics Report"],
          [`Generated At: ${reportDate.toLocaleString()}`],
          [],
          ["Month", "Revenue", "Orders", "Profit"],
        ];
        const bodyRows = reportRows.map((r) => [r.Month, r.Revenue, r.Orders, r.Profit]);
        const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...bodyRows]);
        ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
        ws["!cols"] = [
          { wch: 16 },
          { wch: 16 },
          { wch: 12 },
          { wch: 16 },
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet([
          ["KPI", "Value"],
          ["Total Revenue", liveKpis.totalRevenue],
          ["Total Orders", liveKpis.totalOrders],
          ["Products Sold", liveKpis.productsSold],
          ["Active Products", liveKpis.activeProducts],
        ]);
        summarySheet["!cols"] = [{ wch: 20 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Data");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
      } else {
        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(24, 58, 116);
        doc.rect(0, 0, pageWidth, 84, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("CoreInventory Analytics Report", 40, 48);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Generated: ${reportDate.toLocaleString()}`, 40, 68);

        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Key Metrics", 40, 120);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Total Revenue: ${liveKpis.totalRevenue}`, 40, 144);
        doc.text(`Total Orders: ${liveKpis.totalOrders}`, 40, 162);
        doc.text(`Products Sold: ${liveKpis.productsSold}`, 40, 180);
        doc.text(`Active Products: ${liveKpis.activeProducts}`, 40, 198);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Monthly Stock Movement", 40, 238);

        let y = 262;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Month", 40, y);
        doc.text("Revenue", 160, y);
        doc.text("Orders", 290, y);
        doc.text("Profit", 390, y);
        y += 14;
        doc.setDrawColor(203, 213, 225);
        doc.line(40, y, 540, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        for (const row of reportRows.slice(0, 12)) {
          if (y > 760) {
            doc.addPage();
            y = 56;
          }
          doc.text(String(row.Month), 40, y);
          doc.text(`$${row.Revenue.toLocaleString()}`, 160, y);
          doc.text(String(row.Orders), 290, y);
          doc.text(`$${row.Profit.toLocaleString()}`, 390, y);
          y += 18;
        }

        blob = doc.output("blob");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${reportDate.toISOString().slice(0, 10)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Report downloaded successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to download report", "error");
    } finally {
      setExporting(false);
    }
  };

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
                <h1 className="text-3xl font-bold text-gradient">Analytics</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Comprehensive insights and performance metrics
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Date Range Filter */}
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
                  <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-transparent text-slate-700 text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="12m">Last 12 months</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="glass p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-[var(--text-secondary)] ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </motion.button>

                {/* Export Button */}
                <motion.div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-xl font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-44 bg-[var(--card-bg)] border border-white/10 rounded-xl shadow-2xl z-20"
                    >
                      {exportOptions.map((option) => (
                        <button
                          key={option.format}
                          onClick={() => triggerExport(option.format)}
                          className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-white/10 transition-colors"
                        >
                          {exporting && <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />}
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Revenue"
                value={liveKpis.totalRevenue}
                change={liveKpis.revenueChange}
                icon={DollarSign}
                color="from-emerald-500 to-emerald-600"
                delay={0.1}
              />
              <KPICard
                title="Total Orders"
                value={liveKpis.totalOrders}
                change={liveKpis.ordersChange}
                icon={ShoppingCart}
                color="from-blue-500 to-blue-600"
                delay={0.2}
              />
              <KPICard
                title="Products Sold"
                value={liveKpis.productsSold}
                change={liveKpis.productsChange}
                icon={Package}
                color="from-purple-500 to-purple-600"
                delay={0.3}
              />
              <KPICard
                title="Active Products"
                value={liveKpis.activeProducts}
                change={liveKpis.customersChange}
                icon={Users}
                color="from-indigo-500 to-purple-500"
                delay={0.4}
              />
            </div>

            {/* Revenue & Profit Chart */}
            <ChartCard title="Stock Movement Overview" delay={0.5}>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#4b5563' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#9ca3af" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#4b5563' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#9ca3af" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      axisLine={{ stroke: '#4b5563' }}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                        border: '1px solid #374151',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                      }}
                      labelStyle={{ color: '#f3f4f6', fontWeight: 600, marginBottom: 8 }}
                      formatter={(value, name) => {
                        const numericValue = typeof value === "number" ? value : Number(value || 0);
                        if (name === "Orders") return [numericValue, name];
                        return [`$${numericValue.toLocaleString()}`, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 15 }}
                      iconType="circle"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Revenue"
                      dot={false}
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="profit"
                      fill="url(#profitGradient)"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Profit"
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="Orders"
                      opacity={0.7}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <ChartCard title="Sales by Category" delay={0.6}>
               <div className="h-72 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <defs>
                        {categoryData.map((entry, index) => (
                          <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#pieGradient-${index})`}
                            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}
                        formatter={(value, name) => {
                          const numericValue = typeof value === "number" ? value : Number(value || 0);
                          return [`${numericValue}%`, name];
                        }}
                      />
                      <Legend 
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 13 }}>{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Performance Radar */}
              <ChartCard title="Performance Metrics" delay={0.7}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <defs>
                        <linearGradient id="radarCurrentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="radarTargetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="#374151" opacity={0.5} />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        stroke="#4b5563"
                      />
                      <PolarRadiusAxis 
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        stroke="#4b5563"
                        axisLine={false}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#radarTargetGradient)"
                        strokeDasharray="4 4"
                      />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#radarCurrentGradient)"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 10 }}
                        iconType="circle"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          padding: '10px'
                        }}
                        formatter={(value) => {
                          const numericValue = typeof value === "number" ? value : Number(value || 0);
                          return [`${numericValue}%`, ""];
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Top Products & Regions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <ChartCard title="Top Selling Products" delay={0.8}>
                <div className="space-y-4">
                  {liveTopProducts.map((product, index) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">{product.name}</p>
                          <p className="text-[var(--text-secondary)] text-sm">{product.sales} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-primary)] font-medium">
                          ${product.revenue.toLocaleString()}
                        </p>
                        <p
                          className={`text-sm flex items-center justify-end gap-1 ${
                            product.growth >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {product.growth >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(product.growth)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ChartCard>

              {/* Regional Sales */}
              <ChartCard title="Sales by Region" delay={0.9}>
                <div className="space-y-4">
                  {regionData.map((region, index) => (
                    <motion.div
                      key={region.region}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-[var(--text-primary)]">{region.region}</span>
                        </div>
                        <span className="text-[var(--text-secondary)]">
                          ${region.sales.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${region.percentage}%` }}
                          transition={{ delay: 1 + index * 0.1, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Hourly Orders & Inventory Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Orders */}
              <ChartCard title="Orders by Hour (Today)" delay={1.0}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="hour" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {hourlyData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.orders > 70 ? "#10b981" : entry.orders > 40 ? "#3b82f6" : "#8b5cf6"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Inventory Health */}
              <ChartCard title="Inventory Health" delay={1.1}>
                <div className="grid grid-cols-2 gap-4">
                  {liveInventoryHealth.map((item, index) => (
                    <motion.div
                      key={item.status}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--glass-border)] text-center"
                    >
                      <div
                        className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        {item.status === "Healthy Stock" && (
                          <Package className="w-6 h-6" style={{ color: item.color }} />
                        )}
                        {item.status === "Low Stock" && (
                          <AlertTriangle className="w-6 h-6" style={{ color: item.color }} />
                        )}
                        {item.status === "Out of Stock" && (
                          <Zap className="w-6 h-6" style={{ color: item.color }} />
                        )}
                        {item.status === "Overstocked" && (
                          <Target className="w-6 h-6" style={{ color: item.color }} />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{item.count}</p>
                      <p className="text-[var(--text-secondary)] text-sm">{item.status}</p>
                    </motion.div>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Sales Forecast */}
            <ChartCard title="Sales Forecast (Next 6 Months)" delay={1.2}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      name="Actual"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#8b5cf6"
                      fill="url(#forecastGradient)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Dead Stock Alert */}
            {liveDeadStock.length > 0 && (
              <ChartCard title="Dead Stock Alert" delay={1.25}>
                <div className="space-y-3">
                  {liveDeadStock.map((item, index) => (
                    <motion.div
                      key={item.sku}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.25 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">{item.name}</p>
                          <p className="text-[var(--text-secondary)] text-xs font-mono">{item.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-primary)] font-medium">{item.stock} units</p>
                        <p className="text-red-400 text-xs">{item.daysSinceMovement} days idle</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* Turnover by Category */}
            {liveTurnover.length > 0 && (
              <ChartCard title="Inventory Turnover by Category" delay={1.3}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={liveTurnover}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="category" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" name="Turnover Rate" radius={[4, 4, 0, 0]}>
                        {liveTurnover.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Avg. Order Value", value: "$329", icon: DollarSign, color: "text-emerald-400" },
                { label: "Conversion Rate", value: "3.2%", icon: Target, color: "text-blue-400" },
                { label: "Return Rate", value: "2.1%", icon: RefreshCw, color: "text-purple-400" },
                { label: "Fulfillment Time", value: "1.8 days", icon: Clock, color: "text-indigo-400" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                  className="glass p-4 rounded-xl text-center"
                >
                  <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-[var(--text-secondary)] text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </main>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
              tooltip.type === "success"
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >
            {tooltip.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{tooltip.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
