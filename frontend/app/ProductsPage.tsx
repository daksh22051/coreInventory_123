"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  LayoutList,
  Download,
  Upload,
  Minus,
  RotateCw,
  DollarSign,
  PackageCheck,
  PackageX,
  AlertTriangle,
  Boxes,
  ChevronDown,
  Barcode,
  ScanLine,
  Tag,
  FileSpreadsheet,
} from "lucide-react";
import BarcodeGenerator from "./BarcodeGenerator";
import BarcodeScanner from "./BarcodeScanner";
import BulkLabelPrinter from "./BulkLabelPrinter";
import CSVImportExport from "./CSVImportExport";

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

type SortField = "name" | "sku" | "category" | "price" | "stock" | "status";
type SortDirection = "asc" | "desc";
type ViewMode = "list" | "grid";

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
          return headers;
        }
      } catch {}
    }
    const fallbackToken = localStorage.getItem("token");
    if (fallbackToken) {
      headers["Authorization"] = "Bearer " + fallbackToken;
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
  { id: "1", name: "Laptop Dell XPS 15", sku: "SKU-001", category: "Electronics", price: 1299.99, stock: 45, status: "in-stock", minStockLevel: 10 },
  { id: "2", name: "Office Chair Pro", sku: "SKU-002", category: "Furniture", price: 299.99, stock: 8, status: "low-stock", minStockLevel: 10 },
  { id: "3", name: "Wireless Mouse MX", sku: "SKU-003", category: "Electronics", price: 79.99, stock: 120, status: "in-stock", minStockLevel: 10 },
  { id: "4", name: "Standing Desk 60\"", sku: "SKU-004", category: "Furniture", price: 549.99, stock: 0, status: "out-of-stock", minStockLevel: 10 },
  { id: "5", name: "USB-C Hub 7-in-1", sku: "SKU-005", category: "Electronics", price: 49.99, stock: 200, status: "in-stock", minStockLevel: 10 },
  { id: "6", name: "Packaging Tape", sku: "SKU-006", category: "Packaging", price: 12.99, stock: 500, status: "in-stock", minStockLevel: 20 },
  { id: "7", name: "Steel Bolts M10", sku: "SKU-007", category: "Spare Parts", price: 0.99, stock: 5, status: "low-stock", minStockLevel: 10 },
  { id: "8", name: "Industrial Drill", sku: "SKU-008", category: "Tools", price: 189.99, stock: 32, status: "in-stock", minStockLevel: 5 },
  { id: "9", name: "Cardboard Boxes Large", sku: "SKU-009", category: "Packaging", price: 3.49, stock: 0, status: "out-of-stock", minStockLevel: 50 },
  { id: "10", name: "Monitor Stand", sku: "SKU-010", category: "Furniture", price: 89.99, stock: 67, status: "in-stock", minStockLevel: 10 },
  { id: "11", name: "Keyboard Mechanical", sku: "SKU-011", category: "Electronics", price: 149.99, stock: 3, status: "low-stock", minStockLevel: 10 },
  { id: "12", name: "Cable Organizer", sku: "SKU-012", category: "Electronics", price: 19.99, stock: 88, status: "in-stock", minStockLevel: 10 },
  { id: "13", name: "Wrench Set 12pc", sku: "SKU-013", category: "Tools", price: 59.99, stock: 25, status: "in-stock", minStockLevel: 5 },
  { id: "14", name: "Bubble Wrap Roll", sku: "SKU-014", category: "Packaging", price: 24.99, stock: 7, status: "low-stock", minStockLevel: 10 },
  { id: "15", name: "LED Desk Lamp", sku: "SKU-015", category: "Furniture", price: 69.99, stock: 42, status: "in-stock", minStockLevel: 10 },
  { id: "16", name: "Safety Gloves", sku: "SKU-016", category: "Tools", price: 14.99, stock: 0, status: "out-of-stock", minStockLevel: 20 },
  { id: "17", name: "Ethernet Cable 10m", sku: "SKU-017", category: "Electronics", price: 9.99, stock: 150, status: "in-stock", minStockLevel: 10 },
  { id: "18", name: "Filing Cabinet", sku: "SKU-018", category: "Furniture", price: 199.99, stock: 12, status: "in-stock", minStockLevel: 5 },
  { id: "19", name: "Screwdriver Set", sku: "SKU-019", category: "Tools", price: 34.99, stock: 4, status: "low-stock", minStockLevel: 10 },
  { id: "20", name: "Printer Paper A4", sku: "SKU-020", category: "Packaging", price: 8.99, stock: 300, status: "in-stock", minStockLevel: 50 },
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

const categoryColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Electronics: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-500 to-indigo-500" },
  Furniture: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", gradient: "from-violet-500 to-purple-500" },
  Tools: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", gradient: "from-orange-500 to-amber-500" },
  Packaging: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", gradient: "from-cyan-500 to-teal-500" },
  "Spare Parts": { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", gradient: "from-slate-500 to-gray-500" },
  "Raw Materials": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", gradient: "from-amber-500 to-yellow-500" },
  Consumables: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", gradient: "from-pink-500 to-rose-500" },
  Other: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", gradient: "from-gray-400 to-slate-500" },
};

const statusRowBorder: Record<string, string> = {
  "in-stock": "border-l-emerald-400",
  "low-stock": "border-l-amber-400",
  "out-of-stock": "border-l-red-400",
};

const VALID_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Raw Materials",
  "Packaging",
  "Tools",
  "Consumables",
  "Spare Parts",
  "Other",
] as const;

const CATEGORY_ALIASES: Record<string, (typeof VALID_CATEGORIES)[number]> = {
  electronics: "Electronics",
  furniture: "Furniture",
  rawmaterials: "Raw Materials",
  "raw materials": "Raw Materials",
  "raw material": "Raw Materials",
  packaging: "Packaging",
  tools: "Tools",
  consumables: "Consumables",
  spareparts: "Spare Parts",
  "spare parts": "Spare Parts",
  other: "Other",
};

function normalizeCategory(raw: string): (typeof VALID_CATEGORIES)[number] {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "Other";
  const byExact = VALID_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (byExact) return byExact;
  const aliasKey = trimmed.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return CATEGORY_ALIASES[aliasKey] || CATEGORY_ALIASES[aliasKey.replace(/\s+/g, "")] || "Other";
}

function parseCsvLine(line: string, delimiter = ","): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  values.push(current.trim());
  return values;
}

// Stock progress bar component
function StockProgressBar({ stock, minStock = 10, maxStock = 200 }: { stock: number; minStock?: number; maxStock?: number }) {
  const pct = Math.min(100, (stock / maxStock) * 100);
  let barColor = "from-emerald-400 to-emerald-500";
  if (stock === 0) barColor = "from-red-400 to-red-500";
  else if (stock <= minStock) barColor = "from-amber-400 to-amber-500";

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-semibold text-[var(--text-primary)] w-10 text-right">{stock}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [mounted, setMounted] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New feature states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | Product["status"]>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 500]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockAdjustAmount, setStockAdjustAmount] = useState(0);
  const [stockAdjustReason, setStockAdjustReason] = useState("Received");
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Barcode states
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [showScanner, setShowScanner] = useState(false);

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

  // Fetch all products from API (client-side filtering/sorting/pagination)
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const pageLimit = 1000;
      let currentPage = 1;
      let totalPages = 1;
      const allMapped: Product[] = [];

      do {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(pageLimit) });
        const res = await fetch(`${API_BASE}/api/products?${params}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.message || data.error || "Failed to fetch products", "error");
          break;
        }

        const mapped = (data.data || []).map(mapProduct);
        allMapped.push(...mapped);

        totalPages = Number(data.pagination?.pages || data.pagination?.totalPages || 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      if (allMapped.length > 0) {
        setAllProducts(allMapped);
        const cats = [...new Set<string>(allMapped.map((p: Product) => String(p.category)).filter((c: string): c is string => Boolean(c)))];
        if (cats.length > 0) setCategories(cats);
      } else {
        setAllProducts([]);
      }
    } catch {
      // Demo mode
      setAllProducts([...DEMO_PRODUCTS]);
      setCategories([...new Set(DEMO_PRODUCTS.map(p => p.category))]);
      showToast("Demo mode: showing sample products (backend offline)", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, mounted]);

  // Reset page on filter changes
  useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedStatus, priceRange, stockRange, pageSize]);

  // Filtered, sorted, paginated products
  const { filtered, paginated, stats, totalPages, trendData, skuHealth, projection } = useMemo(() => {
    let result = [...allProducts];

    // Search filter (name, SKU, category)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter(p => p.status === selectedStatus);
    }

    // Price range filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Stock range filter
    result = result.filter(p => p.stock >= stockRange[0] && p.stock <= stockRange[1]);

    // Compute stats before sorting/pagination
    const totalValue = result.reduce((sum, p) => sum + p.price * p.stock, 0);
    const stats = {
      total: result.length,
      totalValue,
      inStock: result.filter(p => p.status === "in-stock").length,
      lowStock: result.filter(p => p.status === "low-stock").length,
      outOfStock: result.filter(p => p.status === "out-of-stock").length,
    };
    const trendData = Array.from({ length: 6 }, (_, idx) => {
      const base = totalValue / Math.max(stats.total, 1);
      const delta = idx * 0.08;
      return Math.round((base * (1 + delta)) * (idx + 1));
    });
    const skuHealth = stats.total === 0 ? 100 : Math.round((stats.inStock / stats.total) * 100);
    const projection = Math.round(totalValue * 1.08);

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let cmp = 0;
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "string" && typeof bVal === "string") {
          cmp = aVal.localeCompare(bVal);
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    // Pagination
    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const paginated = result.slice(start, start + pageSize);

    return { filtered: result, paginated, stats, totalPages, trendData, skuHealth, projection };
  }, [allProducts, debouncedSearch, selectedCategory, selectedStatus, priceRange, stockRange, sortField, sortDirection, currentPage, pageSize]);

  // Column sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else { setSortField(null); setSortDirection("asc"); }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-300 ml-1" />;
    if (sortDirection === "asc") return <ArrowUp size={14} className="text-indigo-500 ml-1" />;
    return <ArrowDown size={14} className="text-indigo-500 ml-1" />;
  };

  // Bulk selection
  const allPageSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id));
  const somePageSelected = paginated.some(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      paginated.forEach(p => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginated.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    let successCount = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch {
        // Demo mode: just remove locally
        setAllProducts(prev => prev.filter(p => p.id !== id));
        successCount++;
      }
    }
    setSelectedIds(new Set());
    showToast(`Deleted ${successCount} product(s)`, "success");
    fetchProducts();
  };

  // CSV Export
  const handleExportCSV = () => {
    const source = selectedIds.size > 0
      ? filtered.filter(p => selectedIds.has(p.id))
      : filtered;
    const headers = ["Name", "SKU", "Category", "Price", "Stock", "Status"];
    const rows = source.map(p => [
      `"${p.name}"`, p.sku, p.category, p.price.toString(), p.stock.toString(), p.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${source.length} products to CSV`, "success");
  };

  const importProductsFallback = async (file: File) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => Boolean(line));

    if (lines.length < 1) {
      throw new Error("CSV file is empty or invalid");
    }

    const delimiter = (lines[0].split(";").length - 1) > (lines[0].split(",").length - 1) ? ";" : ",";
    const normalizeHeader = (v: string) => v.toLowerCase().replace(/^\uFEFF/, "").replace(/[_\s-]+/g, "").trim();
    const firstRow = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const hasHeaders = firstRow.includes("name") || firstRow.includes("sku") || firstRow.includes("category") || firstRow.includes("productname");
    const dataLines = hasHeaders ? lines.slice(1) : lines;

    const headerIndex = (keys: string[], fallback: number) => {
      for (const key of keys) {
        const idx = firstRow.indexOf(key);
        if (idx >= 0) return idx;
      }
      return hasHeaders ? -1 : fallback;
    };

    const idx = {
      name: headerIndex(["name", "product", "productname"], 0),
      sku: headerIndex(["sku", "productsku", "code"], 1),
      category: headerIndex(["category", "type"], 2),
      price: headerIndex(["price", "mrp", "sellingprice", "unitprice"], 3),
      stock: headerIndex(["stockquantity", "stock", "quantity", "qty"], 4),
    };

    let imported = 0;
    let failed = 0;

    for (let row = 0; row < dataLines.length; row++) {
      const parts = parseCsvLine(dataLines[row], delimiter);
      if (parts.length < 1) continue;

      const name = idx.name >= 0 ? parts[idx.name] : parts[0];
      const sku = (idx.sku >= 0 ? parts[idx.sku] : parts[1]) || `SKU-IMP-${Date.now()}-${row}`;
      const rawCategory = idx.category >= 0 ? parts[idx.category] : parts[2];
      const rawPrice = idx.price >= 0 ? parts[idx.price] : parts[3];
      const rawStock = idx.stock >= 0 ? parts[idx.stock] : parts[4];

      if (!name?.trim()) {
        failed++;
        continue;
      }

      const body = {
        name: name.trim(),
        sku: sku.trim(),
        category: normalizeCategory(rawCategory || "Other"),
        price: Number.parseFloat(rawPrice || "0") || 0,
        stockQuantity: Number.parseInt(rawStock || "0", 10) || 0,
      };

      try {
        const res = await fetch(`${API_BASE}/api/products`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });

        let data: { success?: boolean; error?: string; message?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.ok && data?.success) {
          imported++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (imported === 0 && failed > 0) {
      throw new Error("Import failed. Check CSV columns and duplicate SKU values.");
    }

    if (imported === 0 && failed === 0) {
      throw new Error("No valid rows found in CSV. Ensure columns like Name, SKU, Category, Price, Stock are present.");
    }

    return { imported, failed };
  };

  const handleImportProducts = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = getAuthHeaders();
      delete headers["Content-Type"];

      const res = await fetch(`${API_BASE}/api/products/import`, {
        method: "POST",
        headers,
        body: formData,
      });

      let data: { success?: boolean; message?: string; imported?: number } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Import endpoint unavailable");
      }

      await fetchProducts();
      const importedCount = Number(data.imported || 0);
      showToast(importedCount > 0 ? `Imported ${importedCount} products` : "Product import successful", "success");
    } catch {
      const result = await importProductsFallback(file);
      await fetchProducts();
      if (result.failed > 0) {
        showToast(`Imported ${result.imported} products. ${result.failed} rows failed.`, "error");
      } else {
        showToast(`Imported ${result.imported} products from CSV`, "success");
      }
    }
  };

  // CSV Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToast("Only CSV file is supported for product import", "error");
      if (csvInputRef.current) csvInputRef.current.value = "";
      return;
    }

    try {
      await handleImportProducts(file);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

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
        fetchProducts();
      } else {
        showToast(data.message || data.error || "Failed to delete product", "error");
      }
    } catch {
      // Demo mode
      setAllProducts(prev => prev.filter(p => p.id !== id));
      showToast("Product deleted (demo mode)", "success");
    }
  };

  // Stock Adjustment
  const handleStockAdjust = async () => {
    if (!stockAdjustProduct) return;
    const newStock = Math.max(0, stockAdjustProduct.stock + stockAdjustAmount);
    try {
      const res = await fetch(`${API_BASE}/api/products/${stockAdjustProduct.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Stock adjusted: ${stockAdjustProduct.name} (${stockAdjustAmount >= 0 ? "+" : ""}${stockAdjustAmount}) - ${stockAdjustReason}`, "success");
        fetchProducts();
      } else {
        showToast(data.error || "Failed to adjust stock", "error");
      }
    } catch {
      // Demo mode
      setAllProducts(prev => prev.map(p => {
        if (p.id !== stockAdjustProduct.id) return p;
        const stock = Math.max(0, p.stock + stockAdjustAmount);
        let status: Product["status"] = "in-stock";
        if (stock === 0) status = "out-of-stock";
        else if (stock <= (p.minStockLevel || 10)) status = "low-stock";
        return { ...p, stock, status };
      }));
      showToast(`Stock adjusted (demo): ${stockAdjustProduct.name} (${stockAdjustAmount >= 0 ? "+" : ""}${stockAdjustAmount}) - ${stockAdjustReason}`, "success");
    }
    setStockAdjustProduct(null);
    setStockAdjustAmount(0);
    setStockAdjustReason("Received");
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
        fetchProducts();
      } else {
        showToast(data.error || "Failed to save product", "error");
      }
    } catch {
      // Demo mode
      if (editingProduct) {
        setAllProducts(prev => prev.map(p => {
          if (p.id !== editingProduct.id) return p;
          const stock = body.stockQuantity;
          let status: Product["status"] = "in-stock";
          if (stock === 0) status = "out-of-stock";
          else if (stock <= 10) status = "low-stock";
          return { ...p, name: body.name, sku: body.sku, category: body.category, price: body.price, stock, status };
        }));
        showToast("Product updated (demo)", "success");
      } else {
        const newProduct: Product = {
          id: `new-${Date.now()}`,
          name: body.name,
          sku: body.sku,
          category: body.category,
          price: body.price,
          stock: body.stockQuantity,
          status: body.stockQuantity === 0 ? "out-of-stock" : body.stockQuantity <= 10 ? "low-stock" : "in-stock",
        };
        setAllProducts(prev => [...prev, newProduct]);
        showToast("Product added (demo)", "success");
      }
      setShowAddModal(false);
      setEditingProduct(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPriceRange([0, 2000]);
    setStockRange([0, 500]);
    setSortField(null);
    setSortDirection("asc");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedStatus !== "all" ||
    priceRange[0] > 0 || priceRange[1] < 2000 || stockRange[0] > 0 || stockRange[1] < 500;

  // Row highlight class based on stock status
  const getRowHighlight = (product: Product) => {
    if (product.status === "out-of-stock") return "bg-red-50/60";
    if (product.status === "low-stock") return "bg-amber-50/40";
    return "";
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
      {/* Hidden CSV input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        className="hidden"
      />

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
        <div className="flex items-center gap-3">
          {/* Scan Barcode */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-indigo-500/30 text-indigo-500 rounded-xl hover:bg-indigo-500/10 transition-all text-sm font-medium"
          >
            <ScanLine size={16} />
            Scan
          </motion.button>
          {/* Import/Export buttons */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all text-sm font-medium"
          >
            <Upload size={16} />
            Import
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all text-sm font-medium"
          >
            <Download size={16} />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            <Plus size={20} />
            Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
      >
        {[
          { label: "Total Products", value: allProducts.length, icon: Boxes, color: "from-indigo-500 to-purple-500", shadow: "shadow-indigo-500/20" },
          { label: "Total Value", value: `$${allProducts.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
          { label: "In Stock", value: allProducts.filter((p) => p.stock > 0).length, icon: PackageCheck, color: "from-green-500 to-emerald-500", shadow: "shadow-green-500/20" },
          { label: "Low Stock", value: allProducts.filter((p) => p.stock > 0 && p.stock <= (p.minStockLevel || 10)).length, icon: AlertTriangle, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
          { label: "Out of Stock", value: allProducts.filter((p) => p.stock === 0).length, icon: PackageX, color: "from-red-500 to-rose-500", shadow: "shadow-red-500/20" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.color}`} />
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow}`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Expanded analytics cards */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
      >
        <motion.div
          className="component-3d rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Trend sparkline</p>
            <span className="text-xs font-semibold text-emerald-600">+8% vs last week</span>
          </div>
          <div className="mt-4 flex items-end gap-2 h-16">
            {trendData.map((value, index) => {
              const normalized = Math.max(...trendData, 1);
              return (
                <div
                  key={index}
                  className="w-2 rounded-full bg-gradient-to-t from-indigo-500 to-slate-400"
                  style={{ height: `${Math.min(100, (value / normalized) * 100)}%` }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">Projected stock value per trend period</p>
        </motion.div>

        <motion.div
          className="component-3d rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">SKU health</p>
            <span className="text-xs text-slate-400">Ratio of in-stock SKUs</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-3xl font-bold text-slate-800">{skuHealth}%</p>
            <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${skuHealth}%` }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Higher than 90% is ideal for healthy assortments.</p>
        </motion.div>

        <motion.div
          className="component-3d rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Next quarter projection</p>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-300">Est.</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">${projection.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">Assumes +8% value per SKU and stable stock levels.</p>
        </motion.div>
      </motion.div>

      {/* Search & Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 mb-4 items-center"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[250px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200/60 rounded-xl outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm"
          />
        </div>

        {/* Filter toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilterPanel || hasActiveFilters
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-white border-slate-200/60 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
          }`}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          )}
        </motion.button>

        {/* View toggle */}
        <div className="flex border border-slate-200/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 transition-all ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutList size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 transition-all ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 hover:text-slate-600"}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </motion.div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Advanced Filters</h3>
                <button onClick={resetFilters} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <RotateCw size={12} /> Reset All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500/30 text-sm text-slate-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>

                {/* Category filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500/30 text-sm text-slate-700"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={2000}
                      step={10}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                      className="flex-1 accent-indigo-500"
                    />
                    <input
                      type="range"
                      min={0}
                      max={2000}
                      step={10}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                      className="flex-1 accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Stock range */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Stock Range: {stockRange[0]} - {stockRange[1]}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={5}
                      value={stockRange[0]}
                      onChange={(e) => setStockRange([Math.min(Number(e.target.value), stockRange[1]), stockRange[1]])}
                      className="flex-1 accent-indigo-500"
                    />
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={5}
                      value={stockRange[1]}
                      onChange={(e) => setStockRange([stockRange[0], Math.max(Number(e.target.value), stockRange[0])])}
                      className="flex-1 accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 mb-4"
          >
            <span className="text-sm font-medium text-indigo-700">
              {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
              >
                <Download size={14} /> Export Selected
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} /> Delete Selected
              </motion.button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-indigo-400 hover:text-indigo-600"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products - List View */}
      {viewMode === "list" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)]"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/80">
                  <th className="w-12 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                  </th>
                  {[
                    { field: "name" as SortField, label: "Product" },
                    { field: "sku" as SortField, label: "SKU" },
                    { field: "category" as SortField, label: "Category" },
                    { field: "price" as SortField, label: "Price" },
                    { field: "stock" as SortField, label: "Stock" },
                    { field: "status" as SortField, label: "Status" },
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-slate-500">Loading products...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {paginated.map((product, index) => {
                      const status = statusConfig[product.status] || statusConfig["in-stock"];
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.03 }}
                          className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors group ${getRowHighlight(product)} ${isSelected ? "bg-indigo-50/60" : ""}`}
                        >
                          <td className="w-12 px-4 py-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(product.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
                              >
                                <Package size={16} className="text-white" />
                              </motion.div>
                              <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">
                            {product.sku}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-800 font-semibold text-sm">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-3.5 min-w-[180px]">
                            <StockProgressBar stock={product.stock} minStock={product.minStockLevel || 10} />
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {statusLabels[product.status] || product.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setStockAdjustProduct(product);
                                  setStockAdjustAmount(0);
                                }}
                                title="Adjust Stock"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              >
                                <RotateCw size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setBarcodeProduct(product)}
                                title="View Barcode"
                                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                              >
                                <Barcode size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setEditingProduct(product)}
                                title="Edit Product"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Delete Product"
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
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

          {!isLoading && paginated.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No products found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          )}
        </motion.div>
      ) : (
        /* Grid View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {isLoading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No products found</p>
            </div>
          ) : (
            <AnimatePresence>
              {paginated.map((product, index) => {
                const status = statusConfig[product.status] || statusConfig["in-stock"];
                const isSelected = selectedIds.has(product.id);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                    className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow ${
                      isSelected ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                    } ${getRowHighlight(product)}`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`} />

                    {/* Checkbox */}
                    <div className="absolute top-3 right-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
                      <Package size={22} className="text-white" />
                    </div>

                    {/* Name & SKU */}
                    <h3 className="font-semibold text-slate-800 text-sm mb-0.5 pr-6 truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mb-3">{product.sku}</p>

                    {/* Category badge */}
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium mb-3">
                      {product.category}
                    </span>

                    {/* Price & Stock */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-slate-800">${product.price.toFixed(2)}</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {statusLabels[product.status]}
                      </span>
                    </div>

                    {/* Stock bar */}
                    <StockProgressBar stock={product.stock} minStock={product.minStockLevel || 10} />

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setStockAdjustProduct(product); setStockAdjustAmount(0); }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Adjust Stock"
                      >
                        <RotateCw size={15} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setBarcodeProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                        title="Barcode"
                      >
                        <Barcode size={15} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center justify-between mt-6 gap-4"
      >
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Rows:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-300 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200/60 rounded-lg hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Prev
          </motion.button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <motion.button
                key={page}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </motion.button>
            );
          })}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {stockAdjustProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setStockAdjustProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800">Adjust Stock</h2>
                  <button onClick={() => setStockAdjustProduct(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="font-semibold text-slate-800 text-sm">{stockAdjustProduct.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Current Stock: <span className="font-bold text-slate-700">{stockAdjustProduct.stock}</span> units</p>
                </div>

                {/* Adjustment controls */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-2">Adjustment Amount</label>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStockAdjustAmount(prev => prev - 1)}
                      className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold hover:bg-red-100 transition-colors"
                    >
                      <Minus size={18} />
                    </motion.button>
                    <input
                      type="number"
                      value={stockAdjustAmount}
                      onChange={(e) => setStockAdjustAmount(Number(e.target.value))}
                      className="flex-1 text-center px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-indigo-300"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStockAdjustAmount(prev => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold hover:bg-emerald-100 transition-colors"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>
                  <p className="text-xs text-center mt-1.5 text-slate-400">
                    New stock: <span className="font-semibold text-slate-700">{Math.max(0, stockAdjustProduct.stock + stockAdjustAmount)}</span>
                  </p>
                </div>

                {/* Reason */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-slate-500 mb-2">Reason</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Received", "Sold", "Damaged", "Returned"].map(reason => (
                      <button
                        key={reason}
                        onClick={() => setStockAdjustReason(reason)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          stockAdjustReason === reason
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 border"
                            : "bg-slate-50 border-slate-200 text-slate-600 border hover:bg-slate-100"
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStockAdjustProduct(null)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStockAdjust}
                    disabled={stockAdjustAmount === 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Adjustment
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </motion.button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-2">
                      Product Name
                    </label>
                    <input
                      ref={nameRef}
                      type="text"
                      defaultValue={editingProduct?.name || ""}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder-slate-400"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-2">
                        SKU
                      </label>
                      <input
                        ref={skuRef}
                        type="text"
                        defaultValue={editingProduct?.sku || ""}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/30 transition-all text-slate-800 placeholder-slate-400"
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-2">
                        Category
                      </label>
                      <select
                        ref={categoryRef}
                        defaultValue={editingProduct?.category || ""}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/30 transition-all text-slate-800"
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
                      <label className="block text-sm font-medium text-slate-500 mb-2">
                        Price
                      </label>
                      <input
                        ref={priceRef}
                        type="number"
                        step="0.01"
                        defaultValue={editingProduct?.price || ""}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/30 transition-all text-slate-800 placeholder-slate-400"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-2">
                        Stock
                      </label>
                      <input
                        ref={stockRef}
                        type="number"
                        defaultValue={editingProduct?.stock ?? ""}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500/30 transition-all text-slate-800 placeholder-slate-400"
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
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
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

      {/* Barcode Generator Modal */}
      {barcodeProduct && (
        <BarcodeGenerator
          value={barcodeProduct.sku}
          productName={barcodeProduct.name}
          showModal={!!barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        mode="lookup"
        onScan={(result) => {
          if (result.product) {
            const found = allProducts.find(
              (p) => p.sku === result.product?.sku || p.id === result.product?._id
            );
            if (found) {
              setSearchQuery(found.sku);
              setShowScanner(false);
            }
          }
        }}
      />
    </div>
  );
}
