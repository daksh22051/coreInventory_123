"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  PackageOpen,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

function getStatus(stock: number): StockStatus {
  if (stock > 10) return "In Stock";
  if (stock >= 1) return "Low Stock";
  return "Out of Stock";
}

const statusStyles: Record<StockStatus, { bg: string; text: string; border: string; dot: string }> = {
  "In Stock": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  "Low Stock": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  "Out of Stock": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
};

const CATEGORIES = ["Electronics", "Furniture", "Raw Materials", "Packaging", "Tools", "Consumables", "Spare Parts", "Other"];

// Fallback demo data when API is unavailable
const DEMO_PRODUCTS: Product[] = [
  { id: 1, name: "Laptop Dell XPS 15", sku: "SKU-001", category: "Electronics", price: 1299.99, stock: 45 },
  { id: 2, name: "Office Chair Pro", sku: "SKU-002", category: "Furniture", price: 299.99, stock: 8 },
  { id: 3, name: "Wireless Mouse MX", sku: "SKU-003", category: "Electronics", price: 79.99, stock: 120 },
  { id: 4, name: "Standing Desk 60\"", sku: "SKU-004", category: "Furniture", price: 549.99, stock: 0 },
  { id: 5, name: "USB-C Hub 7-in-1", sku: "SKU-005", category: "Electronics", price: 49.99, stock: 200 },
  { id: 6, name: "Packaging Tape", sku: "SKU-006", category: "Packaging", price: 12.99, stock: 500 },
  { id: 7, name: "Steel Bolts M10", sku: "SKU-007", category: "Spare Parts", price: 0.99, stock: 5 },
  { id: 8, name: "Industrial Drill", sku: "SKU-008", category: "Tools", price: 189.99, stock: 32 },
  { id: 9, name: "Cardboard Boxes Large", sku: "SKU-009", category: "Packaging", price: 3.49, stock: 0 },
  { id: 10, name: "Monitor Stand", sku: "SKU-010", category: "Furniture", price: 89.99, stock: 67 },
];

let demoNextId = 11;

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load products on mount
  useEffect(() => {
    setMounted(true);
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setIsDemo(false);
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      // Demo mode fallback
      setProducts([...DEMO_PRODUCTS]);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories from loaded products
  const productCategories = [...new Set(products.map((p) => p.category))];

  // Reset form and open add modal
  const openAddModal = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("");
    setFormPrice("");
    setFormStock("");
    setShowAddModal(true);
  };

  // Populate form and open edit modal
  const openEditModal = (product: Product) => {
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setEditingProduct(product);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  // Create product
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const productData = {
      name: formName,
      sku: formSku,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock),
    };

    try {
      if (isDemo) {
        const newProduct: Product = { ...productData, id: demoNextId++ };
        setProducts((prev) => [...prev, newProduct]);
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        const newProduct = await res.json();
        setProducts((prev) => [...prev, newProduct]);
      }
      closeModal();
      showToast("Product created successfully!", "success");
    } catch {
      showToast("Failed to create product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Update product
  const updateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);

    const productData = {
      name: formName,
      sku: formSku,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock),
    };

    try {
      if (isDemo) {
        const updated = { ...editingProduct, ...productData };
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      closeModal();
      showToast("Product updated successfully!", "success");
    } catch {
      showToast("Failed to update product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const deleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      if (!isDemo) {
        await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Product deleted successfully!", "success");
    } catch {
      showToast("Failed to delete product", "error");
    }
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
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-[var(--text-primary)]">Product </span>
            <span className="text-gradient">Management</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            Manage your inventory products&nbsp;
            <span className="text-[var(--text-muted)]">• {products.length} total</span>
            {isDemo && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
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
            placeholder="Search by name or SKU..."
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
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="relative overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-[var(--background-secondary)]">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Product</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">SKU</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Price</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Stock</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
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
                  {filteredProducts.map((product, index) => {
                    const status = getStatus(product.stock);
                    const styles = statusStyles[status];
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-[var(--glass-border)] hover:bg-indigo-500/5 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
                            >
                              <Package size={20} className="text-white" />
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
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEditModal(product)}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-indigo)] hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setDeleteTarget(product)}
                              className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <PackageOpen size={56} className="mx-auto text-[var(--text-muted)] mb-4 opacity-40" />
            </motion.div>
            <p className="text-[var(--text-secondary)] text-lg font-medium">No products found</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Click \"Add Product\" to create your first product"}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-sm text-[var(--text-muted)]"
      >
        Showing {filteredProducts.length} of {products.length} products
      </motion.div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {(showAddModal || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal}
                    className="p-2 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
                  >
                    <X size={20} className="text-[var(--text-muted)]" />
                  </motion.button>
                </div>

                <form className="space-y-4" onSubmit={editingProduct ? updateProduct : createProduct}>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                      placeholder="Product name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">SKU</label>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)]"
                      >
                        <option value="">Select</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl outline-none focus:border-indigo-500/30 transition-all text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Live status preview */}
                  {formStock && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
                    >
                      <span>Status preview:</span>
                      {(() => {
                        const s = getStatus(parseInt(formStock) || 0);
                        const st = statusStyles[s];
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${st.bg} ${st.text} ${st.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {s}
                          </span>
                        );
                      })()}
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closeModal}
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
                      ) : editingProduct ? (
                        "Update Product"
                      ) : (
                        "Add Product"
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-2xl p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center"
              >
                <AlertTriangle size={28} className="text-red-400" />
              </motion.div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Product</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                Are you sure you want to delete{" "}
                <strong className="text-[var(--text-primary)]">{deleteTarget.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-3 border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--hover-bg)] transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteProduct}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
