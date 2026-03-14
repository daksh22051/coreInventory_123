"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Product {
  id: string;
  _id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  stockQuantity?: number;
  minStockLevel?: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
  unit?: string;
  description?: string;
  warehouse?: { name: string; code: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

// Map backend product to frontend format
function mapProduct(p: Record<string, unknown>): Product {
  const stock = (p.stockQuantity as number) ?? (p.stock as number) ?? 0;
  const minStock = (p.minStockLevel as number) ?? 10;
  let status: Product["status"] = "in-stock";
  if (stock === 0) status = "out-of-stock";
  else if (stock <= minStock) status = "low-stock";

  return {
    id: (p._id as string) || (p.id as string),
    name: p.name as string,
    sku: p.sku as string,
    category: p.category as string,
    price: p.price as number,
    stock,
    stockQuantity: p.stockQuantity as number,
    minStockLevel: minStock,
    status,
    unit: (p.unit as string) || "pcs",
    description: (p.description as string) || "",
    warehouse: p.warehouse as Product["warehouse"],
  };
}

// Demo products for offline mode
const DEMO_PRODUCTS: Product[] = [
  { id: "1", name: "Laptop Dell XPS 15", sku: "SKU-001", category: "Electronics", price: 1299.99, stock: 45, status: "in-stock" },
  { id: "2", name: "Office Chair Pro", sku: "SKU-002", category: "Furniture", price: 299.99, stock: 8, status: "low-stock" },
  { id: "3", name: "Wireless Mouse MX", sku: "SKU-003", category: "Electronics", price: 79.99, stock: 120, status: "in-stock" },
  { id: "4", name: "Standing Desk 60\"", sku: "SKU-004", category: "Furniture", price: 549.99, stock: 0, status: "out-of-stock" },
  { id: "5", name: "USB-C Hub 7-in-1", sku: "SKU-005", category: "Electronics", price: 49.99, stock: 200, status: "in-stock" },
  { id: "6", name: "Packaging Tape", sku: "SKU-006", category: "Packaging", price: 12.99, stock: 500, status: "in-stock" },
  { id: "7", name: "Steel Bolts M10", sku: "SKU-007", category: "Spare Parts", price: 0.99, stock: 5, status: "low-stock" },
  { id: "8", name: "Industrial Drill", sku: "SKU-008", category: "Tools", price: 189.99, stock: 32, status: "in-stock" },
  { id: "9", name: "Cardboard Boxes Large", sku: "SKU-009", category: "Packaging", price: 3.49, stock: 0, status: "out-of-stock" },
  { id: "10", name: "Monitor Stand", sku: "SKU-010", category: "Furniture", price: 89.99, stock: 67, status: "in-stock" },
];

const statusConfig = {
  "in-stock": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  "low-stock": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "out-of-stock": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const statusLabels = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch products from API
  const fetchProducts = useCallback(async (page = 1, search = "", category = "all") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);

      const res = await fetch(`${API_BASE}/api/products?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        const mapped = (data.data || []).map(mapProduct);
        setProducts(mapped);
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || 10,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.pages || data.pagination?.totalPages || 1,
        });
        // Extract categories from products
        const cats = [...new Set(mapped.map((p: Product) => p.category))];
        if (cats.length > 0) setCategories(cats);
      } else {
        showToast(data.message || data.error || "Failed to fetch products", "error");
      }
    } catch {
      // Demo mode fallback - use mock products when backend is offline
      let filtered = [...DEMO_PRODUCTS];
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
      }
      const start = (page - 1) * 10;
      const paged = filtered.slice(start, start + 10);
      setProducts(paged);
      setPagination({ page, limit: 10, total: filtered.length, totalPages: Math.ceil(filtered.length / 10) || 1 });
      setCategories([...new Set(DEMO_PRODUCTS.map(p => p.category))]);
      showToast("Demo mode: showing sample products (backend offline)", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts(1, "", "all");
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts(1, searchQuery, selectedCategory);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, selectedCategory, mounted, fetchProducts]);

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        showToast("Product deleted successfully", "success");
        fetchProducts(pagination.page, searchQuery, selectedCategory);
      } else {
        showToast(data.message || data.error || "Failed to delete product", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    }
  };

  // Add or Edit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const body = {
      name: nameRef.current?.value || "",
      sku: skuRef.current?.value || "",
      category: categoryRef.current?.value || "",
      price: parseFloat(priceRef.current?.value || "0"),
      stockQuantity: parseInt(stockRef.current?.value || "0"),
    };

    try {
      let res: Response;
      if (editingProduct) {
        res = await fetch(`${API_BASE}/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/api/products`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();

      if (data.success) {
        showToast(editingProduct ? "Product updated!" : "Product added!", "success");
        setShowAddModal(false);
        setEditingProduct(null);
        fetchProducts(pagination.page, searchQuery, selectedCategory);
      } else {
        showToast(data.error || "Failed to save product", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchProducts(page, searchQuery, selectedCategory);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-[var(--text-primary)]">Product </span>
            <span className="text-gradient">Management</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage your inventory products
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
        >
          <Plus size={20} />
          Add Product
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4 mb-6"
      >
        <div className="relative flex-1 min-w-[300px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-indigo)] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-[var(--text-muted)]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all duration-300 text-[var(--text-primary)]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="relative overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-[var(--background-secondary)]">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Product
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  SKU
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Price
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Stock
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[var(--accent-indigo)] animate-spin" />
                      <span className="text-[var(--text-secondary)]">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {products.map((product, index) => {
                    const status = statusConfig[product.status as keyof typeof statusConfig] || statusConfig["in-stock"];
                    return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-[var(--glass-border)] hover:bg-indigo-500/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
                          >
                            <Package
                              size={20}
                              className="text-white"
                            />
                          </motion.div>
                          <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-indigo)] transition-colors">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] font-mono text-sm">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-semibold">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {product.stock} units
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {statusLabels[product.status as keyof typeof statusLabels] || product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingProduct(product)}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-indigo)] hover:bg-indigo-500/10 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )})}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && products.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-[var(--text-secondary)]">No products found</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-6"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Showing {products.length} of {pagination.total} products
          {pagination.totalPages > 1 && (
            <span className="ml-2">
              (Page {pagination.page} of {pagination.totalPages})
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl hover:bg-[var(--hover-bg)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(showAddModal || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setEditingProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--card-bg)] shadow-2xl shadow-black/20"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                    }}
                    className="p-2 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
                  >
                    <X size={20} className="text-[var(--text-muted)]" />
                  </motion.button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Product Name
                    </label>
                    <input
                      ref={nameRef}
                      type="text"
                      defaultValue={editingProduct?.name || ""}
                      required
                      className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        SKU
                      </label>
                      <input
                        ref={skuRef}
                        type="text"
                        defaultValue={editingProduct?.sku || ""}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Category
                      </label>
                      <select
                        ref={categoryRef}
                        defaultValue={editingProduct?.category || ""}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)]"
                      >
                        <option value="">Select</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Raw Materials">Raw Materials</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Tools">Tools</option>
                        <option value="Consumables">Consumables</option>
                        <option value="Spare Parts">Spare Parts</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Price
                      </label>
                      <input
                        ref={priceRef}
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.price || ""}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Stock
                      </label>
                      <input
                        ref={stockRef}
                        type="number"
                        defaultValue={editingProduct?.stock ?? ""}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProduct(null);
                      }}
                      className="flex-1 px-4 py-3 border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isSaving}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingProduct ? "Update" : "Add Product"
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
