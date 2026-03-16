"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  X,
  Settings,
  Save,
  GripVertical,
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Users,
  Warehouse,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Truck,
  RefreshCw,
  Maximize2,
  Minimize2,
  Trash2,
  Check,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  }
  return headers;
}

interface Widget {
  id: string;
  type: string;
  title: string;
  size: "small" | "medium" | "large";
  data?: Record<string, unknown>;
}

interface WidgetTemplate {
  type: string;
  title: string;
  icon: React.ElementType;
  color: string;
  defaultSize: "small" | "medium" | "large";
  description: string;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  { type: "total_products", title: "Total Products", icon: Package, color: "from-blue-500 to-cyan-500", defaultSize: "small", description: "Show total product count" },
  { type: "total_revenue", title: "Total Revenue", icon: DollarSign, color: "from-emerald-500 to-green-500", defaultSize: "small", description: "Display revenue metrics" },
  { type: "low_stock_count", title: "Low Stock Items", icon: AlertTriangle, color: "from-amber-500 to-orange-500", defaultSize: "small", description: "Count of low stock products" },
  { type: "pending_orders", title: "Pending Orders", icon: ShoppingCart, color: "from-purple-500 to-pink-500", defaultSize: "small", description: "Orders awaiting fulfillment" },
  { type: "warehouse_usage", title: "Warehouse Usage", icon: Warehouse, color: "from-indigo-500 to-purple-500", defaultSize: "medium", description: "Warehouse capacity overview" },
  { type: "sales_chart", title: "Sales Chart", icon: BarChart3, color: "from-cyan-500 to-blue-500", defaultSize: "large", description: "Sales trend visualization" },
  { type: "category_breakdown", title: "Category Breakdown", icon: PieChart, color: "from-pink-500 to-rose-500", defaultSize: "medium", description: "Products by category" },
  { type: "recent_activity", title: "Recent Activity", icon: Activity, color: "from-violet-500 to-purple-500", defaultSize: "medium", description: "Latest system activity" },
  { type: "delivery_status", title: "Delivery Status", icon: Truck, color: "from-teal-500 to-emerald-500", defaultSize: "small", description: "Delivery order status" },
  { type: "top_products", title: "Top Products", icon: TrendingUp, color: "from-orange-500 to-red-500", defaultSize: "medium", description: "Best selling products" },
];

const DEFAULT_WIDGETS: Widget[] = [
  { id: "1", type: "total_products", title: "Total Products", size: "small" },
  { id: "2", type: "total_revenue", title: "Total Revenue", size: "small" },
  { id: "3", type: "low_stock_count", title: "Low Stock Items", size: "small" },
  { id: "4", type: "pending_orders", title: "Pending Orders", size: "small" },
  { id: "5", type: "sales_chart", title: "Sales Chart", size: "large" },
  { id: "6", type: "recent_activity", title: "Recent Activity", size: "medium" },
];

// Widget Components
function StatWidget({ widget, data }: { widget: Widget; data: Record<string, unknown> }) {
  const template = WIDGET_TEMPLATES.find(t => t.type === widget.type);
  const Icon = template?.icon || Package;
  
  const value = data.value ?? Math.floor(Math.random() * 1000);
  const change = Number(data.change ?? (Math.random() * 20 - 10).toFixed(1));
  const isPositive = change >= 0;

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{widget.title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
            {widget.type === "total_revenue" ? `₹${Number(value).toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${template?.color || "from-blue-500 to-cyan-500"}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
        <TrendingUp className={`w-4 h-4 ${!isPositive ? "rotate-180" : ""}`} />
        <span>{isPositive ? "+" : ""}{change.toFixed(1)}% from last month</span>
      </div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: Widget }) {
  // Simulated chart data
  const data = [65, 45, 78, 52, 88, 72, 95, 68, 82, 75, 90, 85];
  const max = Math.max(...data);

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4">{widget.title}</h3>
      <div className="flex-1 flex items-end gap-2">
        {data.map((value, idx) => (
          <motion.div
            key={idx}
            initial={{ height: 0 }}
            animate={{ height: `${(value / max) * 100}%` }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            title={`Month ${idx + 1}: ${value}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

function ActivityWidget({ widget }: { widget: Widget }) {
  const activities = [
    { action: "Product added", item: "iPhone 15 Pro", time: "2 min ago", icon: Package },
    { action: "Order shipped", item: "ORD-2024-001", time: "15 min ago", icon: Truck },
    { action: "Low stock alert", item: "MacBook Air", time: "1 hour ago", icon: AlertTriangle },
    { action: "New order", item: "ORD-2024-002", time: "2 hours ago", icon: ShoppingCart },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-[var(--text-primary)] mb-3">{widget.title}</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {activities.map((activity, idx) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              <div className="p-2 rounded-lg bg-[var(--hover-bg)]">
                <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{activity.action}</p>
                <p className="text-xs text-[var(--text-muted)]">{activity.item}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{activity.time}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PieChartWidget({ widget }: { widget: Widget }) {
  const data = [
    { label: "Electronics", value: 35, color: "#3b82f6" },
    { label: "Clothing", value: 25, color: "#ec4899" },
    { label: "Hardware", value: 20, color: "#f59e0b" },
    { label: "Other", value: 20, color: "#6b7280" },
  ];

  let cumulative = 0;

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4">{widget.title}</h3>
      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            {data.map((item, idx) => {
              const start = cumulative;
              cumulative += item.value;
              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={`${item.value} ${100 - item.value}`}
                  strokeDashoffset={-start + 25}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[var(--text-secondary)]">{item.label}</span>
              <span className="ml-auto font-medium text-[var(--text-primary)]">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WarehouseWidget({ widget }: { widget: Widget }) {
  const warehouses = [
    { name: "Main Warehouse", usage: 75 },
    { name: "Warehouse B", usage: 45 },
    { name: "Storage Unit C", usage: 90 },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-[var(--text-primary)] mb-3">{widget.title}</h3>
      <div className="flex-1 space-y-3">
        {warehouses.map((wh, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-secondary)]">{wh.name}</span>
              <span className={`font-medium ${wh.usage > 80 ? "text-red-500" : "text-[var(--text-primary)]"}`}>
                {wh.usage}%
              </span>
            </div>
            <div className="h-2 bg-[var(--hover-bg)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${wh.usage}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={`h-full rounded-full ${
                  wh.usage > 80 ? "bg-red-500" : wh.usage > 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsWidget({ widget }: { widget: Widget }) {
  const products = [
    { name: "iPhone 15 Pro", sales: 245, revenue: 244755 },
    { name: "MacBook Air M2", sales: 128, revenue: 166272 },
    { name: "AirPods Pro", sales: 312, revenue: 77688 },
    { name: "iPad Pro 12.9", sales: 89, revenue: 97911 },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-[var(--text-primary)] mb-3">{widget.title}</h3>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {products.map((product, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--hover-bg)]">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--hover-bg)] text-xs font-medium text-[var(--text-secondary)]">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">{product.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{product.sales} sales</p>
            </div>
            <span className="text-sm font-medium text-emerald-500">₹{product.revenue.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetRenderer({ widget, data }: { widget: Widget; data: Record<string, unknown> }) {
  switch (widget.type) {
    case "total_products":
    case "total_revenue":
    case "low_stock_count":
    case "pending_orders":
    case "delivery_status":
      return <StatWidget widget={widget} data={data} />;
    case "sales_chart":
      return <ChartWidget widget={widget} />;
    case "recent_activity":
      return <ActivityWidget widget={widget} />;
    case "category_breakdown":
      return <PieChartWidget widget={widget} />;
    case "warehouse_usage":
      return <WarehouseWidget widget={widget} />;
    case "top_products":
      return <TopProductsWidget widget={widget} />;
    default:
      return <StatWidget widget={widget} data={data} />;
  }
}

const WIDGET_SIZE_CLASSES = {
  small: "col-span-1 row-span-1",
  medium: "col-span-1 md:col-span-2 row-span-1",
  large: "col-span-1 md:col-span-2 lg:col-span-3 row-span-1",
};

export default function CustomDashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [widgetData, setWidgetData] = useState<Record<string, Record<string, unknown>>>({});
  const [toast, setToast] = useState<string | null>(null);

  // Fetch real data for widgets
  const fetchWidgetData = useCallback(async () => {
    try {
      const [productsRes, lowStockRes] = await Promise.all([
        fetch(`${API_BASE}/api/products?limit=1`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/products?lowStock=true&limit=1`, { headers: getAuthHeaders() }),
      ]);

      const productsData = await productsRes.json();
      const lowStockData = await lowStockRes.json();

      setWidgetData({
        total_products: { value: productsData.total || productsData.data?.length || 1284, change: 12.5 },
        total_revenue: { value: 4825000, change: 8.2 },
        low_stock_count: { value: lowStockData.total || lowStockData.data?.length || 18, change: -5.3 },
        pending_orders: { value: 23, change: 15.7 },
        delivery_status: { value: 45, change: 3.2 },
      });
    } catch {
      // Use demo data
    }
  }, []);

  useEffect(() => {
    fetchWidgetData();
  }, [fetchWidgetData]);

  // Load saved layout
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-layout");
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveLayout = () => {
    localStorage.setItem("dashboard-layout", JSON.stringify(widgets));
    setIsEditing(false);
    setToast("Dashboard layout saved!");
    setTimeout(() => setToast(null), 3000);
  };

  const addWidget = (template: WidgetTemplate) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type: template.type,
      title: template.title,
      size: template.defaultSize,
    };
    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const updateWidgetSize = (id: string, size: Widget["size"]) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, size } : w));
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("dashboard-layout");
    setToast("Layout reset to default!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <main className="p-6 space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            Custom Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Drag and drop widgets to personalize your view
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchWidgetData}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
          {isEditing ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddWidget(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetLayout}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/30 rounded-xl text-red-500 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
                Reset
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveLayout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl text-white font-medium"
            >
              <Settings className="w-4 h-4" />
              Customize
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Editing Banner */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3"
          >
            <Settings className="w-5 h-5 text-violet-500 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-sm text-[var(--text-primary)]">
              <strong>Edit Mode:</strong> Drag widgets to reorder, resize, or remove them. Click Save when done.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget, idx) => (
          <motion.div
            key={widget.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card rounded-2xl p-4 relative group ${WIDGET_SIZE_CLASSES[widget.size]} ${
              widget.size === "small" ? "min-h-[140px]" : "min-h-[200px]"
            }`}
          >
            {/* Edit Controls */}
            {isEditing && (
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateWidgetSize(widget.id, widget.size === "small" ? "medium" : widget.size === "medium" ? "large" : "small")}
                  className="p-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)]"
                  title="Resize"
                >
                  {widget.size === "large" ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeWidget(widget.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-500"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </div>
            )}

            {/* Drag Handle */}
            {isEditing && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            )}

            {/* Widget Content */}
            <WidgetRenderer widget={widget} data={widgetData[widget.type] || {}} />
          </motion.div>
        ))}

        {/* Add Widget Placeholder */}
        {isEditing && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddWidget(true)}
            className="col-span-1 min-h-[140px] border-2 border-dashed border-[var(--glass-border)] rounded-2xl flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:border-violet-500 hover:text-violet-500 transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Add Widget</span>
          </motion.button>
        )}
      </div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showAddWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddWidget(false)} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[var(--card-bg)] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--glass-border)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Add Widget</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddWidget(false)}
                    className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {WIDGET_TEMPLATES.map((template, idx) => {
                    const Icon = template.icon;
                    const isAdded = widgets.some(w => w.type === template.type);

                    return (
                      <motion.button
                        key={template.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => !isAdded && addWidget(template)}
                        disabled={isAdded}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isAdded 
                            ? "border-emerald-500/30 bg-emerald-500/5 opacity-60 cursor-not-allowed" 
                            : "border-[var(--glass-border)] hover:border-violet-500 hover:bg-violet-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${template.color}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[var(--text-primary)]">{template.title}</p>
                              {isAdded && <Check className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{template.description}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-[var(--hover-bg)] rounded text-xs text-[var(--text-secondary)]">
                              {template.defaultSize}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
