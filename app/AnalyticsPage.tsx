"use client";

import { useState } from "react";
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
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Globe,
  Clock,
  AlertTriangle,
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleExport = () => {
    alert("Exporting analytics data...");
  };

  return (
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-xl font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Revenue"
                value="$818,000"
                change={12.5}
                icon={DollarSign}
                color="from-emerald-500 to-emerald-600"
                delay={0.1}
              />
              <KPICard
                title="Total Orders"
                value="2,480"
                change={8.2}
                icon={ShoppingCart}
                color="from-blue-500 to-blue-600"
                delay={0.2}
              />
              <KPICard
                title="Products Sold"
                value="5,420"
                change={-2.4}
                icon={Package}
                color="from-purple-500 to-purple-600"
                delay={0.3}
              />
              <KPICard
                title="Active Customers"
                value="1,250"
                change={18.7}
                icon={Users}
                color="from-indigo-500 to-purple-500"
                delay={0.4}
              />
            </div>

            {/* Revenue & Profit Chart */}
            <ChartCard title="Revenue & Profit Overview" delay={0.5}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      fill="url(#profitGradient)"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Profit"
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                      name="Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <ChartCard title="Sales by Category" delay={0.6}>
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Performance Radar */}
              <ChartCard title="Performance Metrics" delay={0.7}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#27272a" />
                      <PolarAngleAxis dataKey="metric" stroke="#71717a" />
                      <PolarRadiusAxis stroke="#71717a" />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name="Target"
                        dataKey="target"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.1}
                      />
                      <Legend />
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
                  {topProducts.map((product, index) => (
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
                  {inventoryHealth.map((item, index) => (
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
  );
}
