"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageCheck,
  Search,
  Plus,
  X,
  Truck,
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Play,
  ArrowUpRight,
  Box,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const directToken = localStorage.getItem("token");
    if (directToken) {
      headers["Authorization"] = "Bearer " + directToken;
      return headers;
    }

    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.state?.token) headers["Authorization"] = "Bearer " + parsed.state.token;
      } catch {}
    }
  }
  return headers;
}

interface DeliveryItem {
  product: string | { _id: string; name: string; sku?: string };
  productId?: string;
  quantity: number;
  unitPrice?: number;
}

interface DeliveryOrder {
  _id?: string;
  id?: string;
  orderId?: string;
  orderNumber?: string;
  customer: string;
  address?: string;
  shippingAddress?: string;
  priority: "low" | "normal" | "high";
  status: "pending" | "picking" | "packing" | "shipped" | "delivered" | "cancelled";
  items: DeliveryItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProductOption {
  _id: string;
  name: string;
  sku?: string;
  stockQuantity?: number;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: "bg-slate-100", text: "text-slate-600", icon: Clock },
  picking: { bg: "bg-amber-100", text: "text-amber-600", icon: Package },
  packing: { bg: "bg-blue-100", text: "text-blue-600", icon: Box },
  shipped: { bg: "bg-purple-100", text: "text-purple-600", icon: Truck },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-600", icon: CheckCircle },
  cancelled: { bg: "bg-red-100", text: "text-red-600", icon: AlertCircle },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-red-100", text: "text-red-600" },
  normal: { bg: "bg-blue-100", text: "text-blue-600" },
  low: { bg: "bg-slate-100", text: "text-slate-600" },
};

function FloatingCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 25);
    setRotateY((centerX - x) / 25);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }}
      className="transition-transform duration-200"
    >
      {children}
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
  delay: number;
}) {
  return (
    <FloatingCard delay={delay}>
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden group cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className={`w-4 h-4 ${trend >= 0 ? "text-emerald-400" : "text-red-400 rotate-90"}`} />
                <span className={`text-sm ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className={`p-3 rounded-xl bg-gradient-to-br ${color}`}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>
    </FloatingCard>
  );
}

const DEMO_PRODUCTS: ProductOption[] = [
  { _id: "demo-1", name: "Prod A", sku: "SKU-001", stockQuantity: 100 },
  { _id: "demo-2", name: "Prod B", sku: "SKU-002", stockQuantity: 50 },
  { _id: "demo-3", name: "Prod C", sku: "SKU-003", stockQuantity: 120 },
];

function OrderModal({
  isOpen,
  onClose,
  products,
  onSuccess,
  fallbackMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: ProductOption[];
  onSuccess: () => void;
  fallbackMode?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    customer: "",
    address: "",
    priority: "normal",
    items: [{ product: "", quantity: "" }],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: "" }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: "product" | "quantity", value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.customer.trim()) {
      setError("Customer is required");
      return;
    }
    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    const validItems = formData.items.filter((item) => item.product && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setError("At least one product with quantity is required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (fallbackMode) {
        onSuccess();
        onClose();
        setFormData({
          customer: "",
          address: "",
          priority: "normal",
          items: [{ product: "", quantity: "" }],
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        customer: formData.customer,
        address: formData.address,
        priority: formData.priority,
        items: validItems.map((item) => ({
          productId: item.product,
          quantity: Number(item.quantity),
        })),
      };

      const res = await fetch(`${API_BASE}/api/delivery-orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
        setFormData({
          customer: "",
          address: "",
          priority: "normal",
          items: [{ product: "", quantity: "" }],
        });
      } else {
        setError(data.message || "Failed to create order");
      }
    } catch {
      setError("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl glass-card rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                  <PackageCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">New Delivery Order</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Create outgoing shipment</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Customer</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Delivery Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter delivery address"
                  className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-600">Products</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </motion.button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="grid grid-cols-12 gap-3"
                    >
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(index, "product", e.target.value)}
                        className="col-span-7 px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-blue-500/50 focus:outline-none"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} {p.sku ? `(${p.sku})` : ""}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        placeholder="Quantity"
                        min="1"
                        className="col-span-4 px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-blue-500/50 focus:outline-none"
                      />
                      {formData.items.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(index)}
                          className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 border border-[var(--glass-border)] rounded-xl text-slate-700 font-medium hover:bg-[var(--hover-bg)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Order"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OrderDetailsModal({
  isOpen,
  order,
  products,
  onClose,
}: {
  isOpen: boolean;
  order: DeliveryOrder | null;
  products: ProductOption[];
  onClose: () => void;
}) {
  if (!order) return null;

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const orderId = order.orderId || order.orderNumber || order._id || order.id || "-";
  const address = order.address || order.shippingAddress || "-";
  const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : "-";
  const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="text-lg font-bold">Order Details</h2>
                <p className="text-xs text-slate-300 mt-0.5">Complete shipment information</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-76px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Order ID</p>
                  <p className="font-mono text-sm mt-1">{orderId}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Customer</p>
                  <p className="text-sm mt-1">{order.customer}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:col-span-2">
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="text-sm mt-1">{address}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Priority</p>
                  <span className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${priorityConfig[order.priority]?.bg || priorityConfig.normal.bg} ${priorityConfig[order.priority]?.text || priorityConfig.normal.text}`}>
                    {order.priority}
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${statusConfig[order.status]?.text || "text-slate-300"}`} />
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusConfig[order.status]?.bg || "bg-slate-700"} ${statusConfig[order.status]?.text || "text-slate-200"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Created Date</p>
                  <p className="text-sm mt-1">{createdDate}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Total Quantity</p>
                  <p className="text-sm mt-1">{totalQty} units</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Product Items</h3>
                  <span className="text-xs text-slate-300">{order.items?.length || 0} rows</span>
                </div>
                <div className="max-h-64 overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/10 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-200">Product</th>
                        <th className="text-left px-3 py-2 font-medium text-slate-200">SKU</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-200">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, idx) => {
                        const productObj = typeof item.product === "string" ? null : item.product;
                        const productRef = item.productId || (typeof item.product === "string" ? item.product : "");
                        const fallbackProduct = productRef ? products.find((p) => p._id === productRef) : null;
                        const productName = productObj?.name || fallbackProduct?.name || (typeof item.product === "string" ? item.product : "-");
                        const productSku = productObj?.sku || fallbackProduct?.sku || "-";
                        return (
                          <tr key={`${productName}-${idx}`} className="border-t border-white/10">
                            <td className="px-3 py-2 text-slate-100">{productName}</td>
                            <td className="px-3 py-2 text-slate-300">{productSku}</td>
                            <td className="px-3 py-2 text-right text-slate-100">{item.quantity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DeliveryOrdersPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, shippedToday: 0, delivered: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/delivery-orders`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const shippedToday = orders.filter((order) => {
      if (order.status !== "shipped") return false;
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;

    setStats({
      pending: orders.filter((order) => order.status === "pending").length,
      inProgress: orders.filter((order) => order.status === "picking" || order.status === "packing").length,
      shippedToday,
      delivered: orders.filter((order) => order.status === "delivered").length,
    });
  }, [orders]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=200`, { headers: getAuthHeaders() });
      const data = await res.json();
      const hasProducts = !!(data.success && Array.isArray(data.data) && data.data.length > 0);
      if (hasProducts) {
        setProducts(
          data.data.map((p: Record<string, unknown>) => ({
            _id: p._id as string,
            name: p.name as string,
            sku: p.sku as string,
            stockQuantity: p.stockQuantity as number,
          }))
        );
      } else {
        setProducts(DEMO_PRODUCTS);
      }
    } catch {
      setProducts(DEMO_PRODUCTS);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOrderCreated = () => {
    fetchOrders();
    showToast("Order Created Successfully", "success");
  };

  const handleViewOrder = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const updateStatus = async (orderId: string, status: DeliveryOrder["status"]) => {
    try {
      const res = await fetch(`${API_BASE}/api/delivery-orders/${orderId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        showToast("Order status updated", "success");
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const id = order.orderId || order.orderNumber || order._id || order.id || "";
    const matchesSearch =
      id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <main className="p-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <h1 className="text-3xl font-bold text-gradient">Delivery Orders</h1>
                <p className="text-[var(--text-secondary)] mt-1">Manage outgoing shipments and deliveries</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/25 text-white"
              >
                <Plus className="w-5 h-5" />
                New Order
              </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Pending Orders"
                value={String(stats.pending)}
                icon={Clock}
                color="from-zinc-500 to-zinc-600"
                delay={0.1}
              />
              <StatCard
                title="In Progress"
                value={String(stats.inProgress)}
                icon={Package}
                color="from-amber-500 to-orange-500"
                delay={0.2}
              />
              <StatCard
                title="Shipped Today"
                value={String(stats.shippedToday)}
                icon={Truck}
                trend={22}
                color="from-purple-500 to-pink-500"
                delay={0.3}
              />
              <StatCard
                title="Delivered"
                value={String(stats.delivered)}
                icon={CheckCircle}
                trend={18}
                color="from-emerald-500 to-teal-500"
                delay={0.4}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "pending", "picking", "packing", "shipped", "delivered"].map((status) => (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl font-medium capitalize transition-colors ${
                      statusFilter === status
                        ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                        : "bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"
                    }`}
                  >
                    {status}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Order ID</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Customer</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Items</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Address</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Priority</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Package className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                          <p className="text-[var(--text-secondary)]">No orders found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => {
                      const StatusIcon = statusConfig[order.status]?.icon || Clock;
                      const orderId = order.orderId || order.orderNumber || order._id || order.id || "";
                      const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                      const itemCount = order.items?.length || 0;
                      const address = order.address || order.shippingAddress || "-";
                      const priority = order.priority || "normal";
                      return (
                        <motion.tr
                          key={order._id || order.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="border-b border-slate-100 hover:bg-[var(--hover-bg)] transition-colors"
                        >
                          <td className="py-4 px-6">
                            <span className="font-mono text-blue-400">{orderId}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-purple-500" />
                              </div>
                              <span className="text-[var(--text-primary)]">{order.customer}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {itemCount} items ({totalQty} units)
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate max-w-[150px]">{address}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${priorityConfig[priority]?.bg || priorityConfig.normal.bg} ${priorityConfig[priority]?.text || priorityConfig.normal.text}`}>
                              {priority}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${statusConfig[order.status]?.text || "text-[var(--text-secondary)]"}`} />
                              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusConfig[order.status]?.bg || "bg-slate-100"} ${statusConfig[order.status]?.text || "text-slate-600"}`}>
                                {order.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleViewOrder(order)}
                                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-slate-700"
                                title="View Order"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              {order.status === "pending" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(order._id || order.id || "", "picking")}
                                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                                  title="Move to Picking"
                                >
                                  <Play className="w-4 h-4" />
                                </motion.button>
                              )}
                              {order.status === "picking" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(order._id || order.id || "", "packing")}
                                  className="p-2 rounded-lg hover:bg-amber-100 text-amber-500"
                                  title="Move to Packing"
                                >
                                  <Play className="w-4 h-4" />
                                </motion.button>
                              )}
                              {order.status === "packing" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(order._id || order.id || "", "shipped")}
                                  className="p-2 rounded-lg hover:bg-purple-100 text-purple-500"
                                  title="Mark Shipped"
                                >
                                  <Play className="w-4 h-4" />
                                </motion.button>
                              )}
                              {order.status === "shipped" && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => updateStatus(order._id || order.id || "", "delivered")}
                                  className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-500"
                                  title="Mark Delivered"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
      </main>

      <OrderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        products={products}
        onSuccess={handleOrderCreated}
        fallbackMode={false}
      />

      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        order={selectedOrder}
        products={products}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrder(null);
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
