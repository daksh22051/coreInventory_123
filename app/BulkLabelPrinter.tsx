"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Printer,
  X,
  Check,
  Search,
  Package,
  Grid3X3,
  Download,
  Settings,
  ChevronDown,
  Loader2,
  CheckSquare,
  Square,
  Tag,
} from "lucide-react";
import JsBarcode from "jsbarcode";

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

interface Product {
  _id: string;
  name: string;
  sku: string;
  price?: number;
  category?: string;
  stockQuantity?: number;
}

interface LabelSettings {
  labelSize: "small" | "medium" | "large";
  showPrice: boolean;
  showName: boolean;
  showSku: boolean;
  copiesPerProduct: number;
  columns: number;
}

const LABEL_SIZES = {
  small: { width: 150, height: 80, barcodeWidth: 1.2, barcodeHeight: 30 },
  medium: { width: 200, height: 100, barcodeWidth: 1.5, barcodeHeight: 40 },
  large: { width: 280, height: 140, barcodeWidth: 2, barcodeHeight: 60 },
};

function BarcodeLabel({ 
  product, 
  settings, 
  index 
}: { 
  product: Product; 
  settings: LabelSettings; 
  index: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = LABEL_SIZES[settings.labelSize];

  useEffect(() => {
    if (svgRef.current && product.sku) {
      try {
        JsBarcode(svgRef.current, product.sku, {
          format: "CODE128",
          width: size.barcodeWidth,
          height: size.barcodeHeight,
          displayValue: settings.showSku,
          fontSize: 10,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {}
    }
  }, [product.sku, settings, size]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center print:break-inside-avoid"
      style={{ width: size.width, height: size.height }}
    >
      {settings.showName && (
        <p className="text-xs font-semibold text-slate-800 text-center truncate w-full mb-1">
          {product.name}
        </p>
      )}
      <svg ref={svgRef} className="max-w-full" />
      {settings.showPrice && product.price && (
        <p className="text-xs font-bold text-slate-900 mt-1">
          ₹{product.price.toLocaleString()}
        </p>
      )}
    </motion.div>
  );
}

export default function BulkLabelPrinter({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<LabelSettings>({
    labelSize: "medium",
    showPrice: true,
    showName: true,
    showSku: true,
    copiesPerProduct: 1,
    columns: 3,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=500`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch {
      // Demo products
      setProducts([
        { _id: "1", name: "Product A", sku: "SKU-001", price: 999, category: "Electronics" },
        { _id: "2", name: "Product B", sku: "SKU-002", price: 499, category: "Clothing" },
        { _id: "3", name: "Product C", sku: "SKU-003", price: 1299, category: "Hardware" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProducts();
  }, [isOpen, fetchProducts]);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p._id)));
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProducts = products.filter(p => selectedIds.has(p._id));

  // Generate labels array with copies
  const labelsToGenerate: { product: Product; copyIndex: number }[] = [];
  selectedProducts.forEach(product => {
    for (let i = 0; i < settings.copiesPerProduct; i++) {
      labelsToGenerate.push({ product, copyIndex: i });
    }
  });

  const handlePrint = () => {
    setGenerating(true);
    setPreviewMode(true);
    
    setTimeout(() => {
      setGenerating(false);
      window.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    setGenerating(true);
    setPreviewMode(true);
    
    // For now, just trigger print which can save as PDF
    setTimeout(() => {
      setGenerating(false);
      window.print();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--card-bg)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Bulk Label Printer</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedIds.size} products selected • {labelsToGenerate.length} labels to print
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-xl border transition-all ${
                  showSettings 
                    ? "bg-[var(--accent-indigo)] text-white border-transparent" 
                    : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                }`}
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                key="settings-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-[var(--glass-border)] overflow-hidden"
              >
                <div className="p-4 bg-[var(--hover-bg)]/50 grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Label Size</label>
                    <select
                      value={settings.labelSize}
                      onChange={(e) => setSettings({ ...settings, labelSize: e.target.value as LabelSettings["labelSize"] })}
                      className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
                    >
                      <option value="small">Small (150×80)</option>
                      <option value="medium">Medium (200×100)</option>
                      <option value="large">Large (280×140)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Copies Each</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.copiesPerProduct}
                      onChange={(e) => setSettings({ ...settings, copiesPerProduct: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Columns</label>
                    <select
                      value={settings.columns}
                      onChange={(e) => setSettings({ ...settings, columns: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--text-primary)]"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                      <option value={5}>5 Columns</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showName}
                        onChange={(e) => setSettings({ ...settings, showName: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-[var(--text-primary)]">Name</span>
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showPrice}
                        onChange={(e) => setSettings({ ...settings, showPrice: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-[var(--text-primary)]">Price</span>
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showSku}
                        onChange={(e) => setSettings({ ...settings, showSku: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <span className="text-sm text-[var(--text-primary)]">SKU Text</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Product Selection */}
            <div className="w-1/2 border-r border-[var(--glass-border)] flex flex-col">
              <div className="p-4 border-b border-[var(--glass-border)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-slate-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-2 text-sm text-[var(--accent-indigo)] hover:underline"
                  >
                    {selectedIds.size === filteredProducts.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Select All ({filteredProducts.length})
                      </>
                    )}
                  </button>
                  <span className="text-xs text-[var(--text-muted)]">
                    {filteredProducts.length} products
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-indigo)]" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product._id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => toggleSelect(product._id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${
                          selectedIds.has(product._id)
                            ? "bg-[var(--accent-indigo)]/10 border border-[var(--accent-indigo)]/30"
                            : "hover:bg-[var(--hover-bg)] border border-transparent"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedIds.has(product._id)
                            ? "bg-[var(--accent-indigo)] text-white"
                            : "border-2 border-slate-300"
                        }`}>
                          {selectedIds.has(product._id) && <Check className="w-3 h-3" />}
                        </div>
                        <Package className="w-8 h-8 p-1.5 rounded-lg bg-[var(--hover-bg)] text-[var(--text-secondary)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{product.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{product.sku}</p>
                        </div>
                        {product.price && (
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            ₹{product.price.toLocaleString()}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="w-1/2 flex flex-col">
              <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Preview</h3>
                <span className="text-xs text-[var(--text-muted)]">
                  {labelsToGenerate.length} labels
                </span>
              </div>

              <div 
                ref={printRef}
                className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900/50"
              >
                {selectedProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Grid3X3 className="w-12 h-12 text-[var(--text-muted)] mb-3" />
                    <p className="text-[var(--text-secondary)] font-medium">No products selected</p>
                    <p className="text-sm text-[var(--text-muted)]">Select products to preview labels</p>
                  </div>
                ) : (
                  <div 
                    className="flex flex-wrap gap-3 justify-center"
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: `repeat(${Math.min(settings.columns, 3)}, 1fr)`,
                      gap: "12px"
                    }}
                  >
                    {labelsToGenerate.slice(0, 20).map((item, idx) => {
                      const idKey = item.product._id || item.product.sku || idx.toString();
                      return (
                        <BarcodeLabel
                          key={`${idKey}-${item.copyIndex}-${idx}`}
                          product={item.product}
                          settings={settings}
                          index={idx}
                        />
                      );
                    })}
                    {labelsToGenerate.length > 20 && (
                      <div className="col-span-full text-center py-4 text-sm text-[var(--text-muted)]">
                        +{labelsToGenerate.length - 20} more labels...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--glass-border)] flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">
              {selectedIds.size} products × {settings.copiesPerProduct} copies = {labelsToGenerate.length} labels
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-5 py-2.5 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--hover-bg)]"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadPDF}
                disabled={selectedIds.size === 0 || generating}
                className="flex items-center gap-2 px-5 py-2.5 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] font-medium hover:bg-[var(--hover-bg)] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Save PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                disabled={selectedIds.size === 0 || generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Print Labels
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
