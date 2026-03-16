"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  History,
  Search,
  Filter,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  Scale,
  ChevronDown,
  Eye,
  Activity,
  DownloadCloud,
  Sparkles,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import jsPDF from "jspdf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const viewModes: ViewMode[] = ["list", "timeline"];

type MovementType = "receipt" | "delivery" | "transfer" | "adjustment";

interface Movement {
  id: string;
  type: MovementType;
  description: string;
  product: string;
  quantity: number;
  from: string;
  to: string;
  user: string;
  warehouse: string;
  date: string;
  time: string;
  stockAfter: number;
  trigger: string;
}

type StoredMovement = Movement;

const baseMovements: Movement[] = [
  { id: "MOV-001", type: "receipt", description: "Stock received from TechSupplies Inc.", product: "Wireless Headphones", quantity: 120, from: "Supplier", to: "Warehouse A - Rack A-12", user: "John Smith", warehouse: "Warehouse A", date: "2026-03-14", time: "14:30", stockAfter: 620, trigger: "PO-8797" },
  { id: "MOV-002", type: "delivery", description: "Order shipped to Acme Corporation", product: "Smart Watch Pro", quantity: -80, from: "Warehouse B - Rack B-05", to: "Customer", user: "Sarah Johnson", warehouse: "Warehouse B", date: "2026-03-14", time: "12:15", stockAfter: 125, trigger: "SO-2231" },
  { id: "MOV-003", type: "transfer", description: "Internal transfer between warehouses", product: "USB-C Hub", quantity: 60, from: "Warehouse C - Rack C-01", to: "Warehouse A - Rack A-08", user: "Mike Chen", warehouse: "Warehouse A", date: "2026-03-14", time: "10:45", stockAfter: 460, trigger: "TR-1134" },
  { id: "MOV-004", type: "adjustment", description: "Stock correction after audit", product: "Laptop Stand", quantity: -10, from: "System", to: "Physical Count", user: "Emily Davis", warehouse: "Warehouse B", date: "2026-03-13", time: "16:20", stockAfter: 90, trigger: "AUD-321" },
  { id: "MOV-005", type: "receipt", description: "Stock received from Global Electronics", product: "Mechanical Keyboard", quantity: 200, from: "Supplier", to: "Warehouse B - Rack B-12", user: "John Smith", warehouse: "Warehouse B", date: "2026-03-13", time: "09:00", stockAfter: 300, trigger: "PO-8801" },
  { id: "MOV-006", type: "delivery", description: "Order shipped to Tech Solutions Ltd", product: "Monitor Stand", quantity: -50, from: "Warehouse A - Rack A-15", to: "Customer", user: "Sarah Johnson", warehouse: "Warehouse A", date: "2026-03-13", time: "11:30", stockAfter: 170, trigger: "SO-2234" },
  { id: "MOV-007", type: "transfer", description: "Restock transfer to main warehouse", product: "Wireless Mouse", quantity: 75, from: "Warehouse C - Rack C-08", to: "Warehouse A - Rack A-03", user: "Mike Chen", warehouse: "Warehouse A", date: "2026-03-12", time: "15:00", stockAfter: 480, trigger: "TR-1141" },
  { id: "MOV-008", type: "adjustment", description: "Damaged items write-off", product: "Screen Protector", quantity: -20, from: "Warehouse B - Rack B-22", to: "Write-off", user: "Emily Davis", warehouse: "Warehouse B", date: "2026-03-12", time: "14:00", stockAfter: 140, trigger: "ADJ-451" },
];

const typeConfig: Record<MovementType, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  receipt: { icon: PackagePlus, bg: "bg-emerald-50", text: "text-emerald-700", label: "Receipt" },
  delivery: { icon: PackageMinus, bg: "bg-purple-50", text: "text-purple-700", label: "Delivery" },
  transfer: { icon: ArrowLeftRight, bg: "bg-blue-50", text: "text-blue-700", label: "Transfer" },
  adjustment: { icon: Scale, bg: "bg-orange-50", text: "text-orange-700", label: "Adjustment" },
};

type ViewMode = "list" | "timeline";

interface Filters {
  product: string;
  warehouse: string;
  user: string;
  type: MovementType | "all";
  quantityRange: [number, number];
  startDate: string;
  endDate: string;
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const createDefaultFilters = (): Filters => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 30);
  return {
    product: "all",
    warehouse: "all",
    user: "all",
    type: "all",
    quantityRange: [-1000, 1000],
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
};

const toastColors = {
  success: "bg-emerald-500",
  info: "bg-indigo-500",
};

function statValueFormatter(value: number) {
  return value.toLocaleString();
}

function MovementDrawer({
  move,
  open,
  onClose,
  onViewLedger,
  onDownloadReport,
}: {
  move: Movement | null;
  open: boolean;
  onClose: () => void;
  onViewLedger: () => void;
  onDownloadReport: () => void;
}) {
  if (!move) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="relative ml-auto w-full max-w-md bg-[var(--card-bg)] border border-[var(--glass-border)] shadow-2xl p-6 h-full overflow-y-auto"
            initial={{ x: 200 }}
            animate={{ x: 0 }}
            exit={{ x: 200 }}
            transition={{ type: "tween" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Movement details</h2>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose} className="text-[var(--text-muted)]">
                <ChevronDown className="h-5 w-5" />
              </motion.button>
            </div>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Movement ID</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.id}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Product</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.product}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Quantity</p>
                <p className={`font-semibold ${move.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{move.quantity > 0 ? "+" : ""}{move.quantity} units</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Movement type</p>
                <p className="font-semibold text-[var(--text-primary)]">{typeConfig[move.type].label}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">From</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.from}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">To</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.to}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Operator</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.user}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Timestamp</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.date} • {move.time}</p>
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase">Stock after movement</p>
                <p className="font-semibold text-[var(--text-primary)]">{move.stockAfter} units</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={onViewLedger} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" /> View Ledger
              </button>
              <button onClick={onDownloadReport} className="px-4 py-2 rounded-xl border border-[var(--glass-border)] text-sm font-medium flex items-center justify-center gap-2">
                <DownloadCloud className="w-4 h-4" /> Download Movement Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnalyticsCard({
  title,
  children,
  delay = 0,
  onFilterClick,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  onFilterClick?: () => void;
}) {
  return (
    <FloatingCard delay={delay || 0.1}>
      <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] shadow-lg rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{title}</h3>
          <button onClick={onFilterClick} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </FloatingCard>
  );
}

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1 rounded-2xl bg-slate-50 border border-[var(--glass-border)] text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
      <span className="text-[var(--text-primary)]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}>
      {children}
    </motion.div>
  );
}

interface ToastItem {
  id: string;
  message: string;
}

function DashboardToast({ toast }: { toast: ToastItem }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-4 py-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 flex items-center gap-2">
      <Sparkles className="w-4 h-4" /> {toast.message}
    </motion.div>
  );
}

function LedgerModal({
  open,
  onClose,
  movements,
}: {
  open: boolean;
  onClose: () => void;
  movements: Movement[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="relative w-full max-w-6xl max-h-[85vh] overflow-auto bg-[var(--card-bg)] rounded-2xl border border-[var(--glass-border)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><FileText className="w-5 h-5" /> Product Movement Ledger</h2>
              <button onClick={onClose} className="text-[var(--text-muted)]"><ChevronDown className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto rounded-xl border border-[var(--glass-border)]">
              <table className="min-w-full text-left">
                <thead className="text-xs uppercase text-[var(--text-muted)] bg-[var(--hover-bg)]">
                  <tr>
                    <th className="px-3 py-2">Movement ID</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Warehouse</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Operator</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((move) => (
                    <tr key={move.id} className="border-t border-[var(--glass-border)]">
                      <td className="px-3 py-2 text-sm font-mono">{move.id}</td>
                      <td className="px-3 py-2 text-sm">{move.product}</td>
                      <td className="px-3 py-2 text-sm">{move.warehouse}</td>
                      <td className="px-3 py-2 text-sm">{typeConfig[move.type].label}</td>
                      <td className={`px-3 py-2 text-sm font-semibold ${move.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{move.quantity > 0 ? "+" : ""}{move.quantity}</td>
                      <td className="px-3 py-2 text-sm">{move.user}</td>
                      <td className="px-3 py-2 text-sm">{move.date} {move.time}</td>
                      <td className="px-3 py-2 text-sm font-mono">{move.trigger}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReportExportModal({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (format: "CSV" | "Excel" | "PDF") => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="relative w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--glass-border)] p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Download Movement Report</h2>
            <div className="space-y-2">
              {(["CSV", "Excel", "PDF"] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    onExport(format);
                    onClose();
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--glass-border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                >
                  Export {format}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MoveHistoryPage() {
  const [movements, setMovements] = useState<Movement[]>(baseMovements);
  const [filters, setFilters] = useState<Filters>(createDefaultFilters);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedMove, setSelectedMove] = useState<Movement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [showChartFilters, setShowChartFilters] = useState(false);
  const [toastList, setToastList] = useState<ToastItem[]>([]);
  const chartsSnapshotRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket"] });
    socket.on("movement:created", (move: Movement) => {
      setMovements(prev => [move, ...prev]);
      setToastList(prev => [...prev, { id: crypto.randomUUID(), message: `New movement ${move.id} added` }]);
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const key = "coreinventory_movements";
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredMovement[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setMovements((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const merged = parsed.filter((m) => !existing.has(m.id));
        return [...merged, ...prev];
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (toastList.length === 0) return;
    const timer = setTimeout(() => setToastList(prev => prev.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toastList]);

  const products = useMemo(() => Array.from(new Set(movements.map(m => m.product))), [movements]);
  const warehouses = useMemo(
    () => Array.from(new Set(movements.map((m) => m.warehouse).filter((w) => {
      const value = String(w || "").trim();
      return value.length > 0 && value.toLowerCase() !== "warehouse";
    }))),
    [movements]
  );
  const users = useMemo(() => Array.from(new Set(movements.map(m => m.user))), [movements]);

  const filteredMovements = useMemo(() => {
    return movements.filter(move => {
      if (filters.type !== "all" && move.type !== filters.type) return false;
      if (filters.product !== "all" && move.product !== filters.product) return false;
      if (filters.warehouse !== "all" && move.warehouse !== filters.warehouse) return false;
      if (filters.user !== "all" && move.user !== filters.user) return false;
      if (move.quantity < filters.quantityRange[0] || move.quantity > filters.quantityRange[1]) return false;
      if (move.date < filters.startDate || move.date > filters.endDate) return false;
      const searchTerm = search.toLowerCase();
      if (searchTerm) {
        const haystack = [move.id, move.product, move.warehouse, move.user, move.description].join(" ").toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
  }, [movements, filters, search]);

  const stats = useMemo(() => {
    const total = filteredMovements.length;
    const receipts = filteredMovements.filter(m => m.type === "receipt").length;
    const deliveries = filteredMovements.filter(m => m.type === "delivery").length;
    const transfers = filteredMovements.filter(m => m.type === "transfer").length;
    return { total, receipts, deliveries, transfers };
  }, [filteredMovements]);

  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMovements.forEach(move => {
      map[move.date] = (map[move.date] || 0) + Math.abs(move.quantity);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [filteredMovements]);

  const movementByType = useMemo(() => {
    const map: Record<MovementType, number> = { receipt: 0, delivery: 0, transfer: 0, adjustment: 0 };
    filteredMovements.forEach(move => {
      map[move.type] += 1;
    });
    return Object.entries(map).map(([type, value]) => ({ type, value }));
  }, [filteredMovements]);

  const receiptsVsDeliveries = useMemo(() => {
    const map: Record<string, { date: string; receipts: number; deliveries: number }> = {};
    filteredMovements.forEach((move) => {
      if (!map[move.date]) map[move.date] = { date: move.date, receipts: 0, deliveries: 0 };
      if (move.type === "receipt") map[move.date].receipts += Math.abs(move.quantity);
      if (move.type === "delivery") map[move.date].deliveries += Math.abs(move.quantity);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMovements]);

  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMovements.forEach(move => {
      map[move.warehouse] = (map[move.warehouse] || 0) + Math.abs(move.quantity);
    });
    return Object.entries(map).map(([warehouse, count]) => ({ warehouse, count }));
  }, [filteredMovements]);

  const insights = useMemo(() => {
    const now = new Date("2026-03-14");
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(now.getDate() - 7);
    const prevRangeStart = new Date(prevWeekStart);
    prevRangeStart.setDate(prevWeekStart.getDate() - 7);
    const thisWeekSum = filteredMovements.filter(m => new Date(m.date) >= prevWeekStart).reduce((sum, move) => sum + Math.abs(move.quantity), 0);
    const lastWeekSum = filteredMovements.filter(m => new Date(m.date) >= prevRangeStart && new Date(m.date) < prevWeekStart).reduce((sum, move) => sum + Math.abs(move.quantity), 0);
    const spike = lastWeekSum === 0 ? 0 : Math.round(((thisWeekSum - lastWeekSum) / lastWeekSum) * 100);
    const warehouseCounts = heatmapData.sort((a, b) => b.count - a.count);
    const mostActiveWarehouse = warehouseCounts[0]?.warehouse ?? "N/A";
    const productCounts: Record<string, number> = {};
    filteredMovements.forEach(move => { productCounts[move.product] = (productCounts[move.product] || 0) + Math.abs(move.quantity); });
    const highestProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
    return { spike, mostActiveWarehouse, highestProduct };
  }, [filteredMovements, heatmapData]);

  const exportOptions = useMemo(() => {
    const download = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const exportMovementsCSV = (rows: Movement[], filename = "movements.csv") => {
      const headers = ["ID", "Type", "Product", "Quantity", "From", "To", "User", "Warehouse", "Date", "Time", "Reference"].join(",");
      const csvRows = rows
        .map((move) =>
          [move.id, move.type, move.product, move.quantity, move.from, move.to, move.user, move.warehouse, move.date, move.time, move.trigger]
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      download(new Blob([headers + "\n" + csvRows], { type: "text/csv" }), filename);
    };

    const exportMovementsExcel = async (rows: Movement[], filename = "movements.xlsx") => {
      const { utils, write } = await import("xlsx");
      const sheetData = rows.map((move) => ({
        ID: move.id,
        Type: move.type,
        Product: move.product,
        Quantity: move.quantity,
        From: move.from,
        To: move.to,
        Operator: move.user,
        Warehouse: move.warehouse,
        Date: move.date,
        Time: move.time,
        Reference: move.trigger,
        "Stock After": move.stockAfter,
      }));
      const ws = utils.json_to_sheet(sheetData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Movements");
      const out = write(wb, { type: "array", bookType: "xlsx" });
      download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
    };

    const exportMovementsPDF = async (rows: Movement[], filename = "movements.pdf") => {
      const doc = new jsPDF({ orientation: "landscape" });
      let y = 14;
      const totalQty = rows.reduce((sum, move) => sum + Math.abs(move.quantity), 0);
      const byType = rows.reduce<Record<MovementType, number>>(
        (acc, move) => {
          acc[move.type] += 1;
          return acc;
        },
        { receipt: 0, delivery: 0, transfer: 0, adjustment: 0 }
      );

      doc.setFontSize(16);
      doc.text("Movement Report", 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Summary: ${rows.length} rows | Total moved units ${totalQty}`, 14, y);
      y += 6;
      doc.text(`Type split: Receipt ${byType.receipt}, Delivery ${byType.delivery}, Transfer ${byType.transfer}, Adjustment ${byType.adjustment}`, 14, y);
      y += 6;

      // Charts snapshot from dashboard charts area
      if (chartsSnapshotRef.current) {
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(chartsSnapshotRef.current, { scale: 1.5, backgroundColor: "#ffffff" });
          const img = canvas.toDataURL("image/png");
          doc.addImage(img, "PNG", 14, y, 250, 60);
          y += 66;
        } catch {
          doc.setFontSize(9);
          doc.text("Charts snapshot unavailable on this environment.", 14, y);
          y += 6;
        }
      }

      doc.setFontSize(10);
      doc.text("Movement table", 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.text("ID", 14, y);
      doc.text("Product", 38, y);
      doc.text("Warehouse", 95, y);
      doc.text("Type", 135, y);
      doc.text("Qty", 154, y);
      doc.text("Operator", 168, y);
      doc.text("Date", 205, y);
      doc.text("Ref", 235, y);
      y += 4;

      rows.slice(0, 18).forEach((move) => {
        if (y > 188) {
          doc.addPage("a4", "landscape");
          y = 14;
        }
        doc.text(move.id, 14, y);
        doc.text(move.product.slice(0, 24), 38, y);
        doc.text(move.warehouse.slice(0, 16), 95, y);
        doc.text(typeConfig[move.type].label, 135, y);
        doc.text(String(move.quantity), 154, y);
        doc.text(move.user.slice(0, 14), 168, y);
        doc.text(`${move.date} ${move.time}`, 205, y);
        doc.text(move.trigger.slice(0, 12), 235, y);
        y += 5;
      });

      doc.save(filename);
    };

    return [
      {
        label: "CSV",
        action: () => exportMovementsCSV(filteredMovements, "movements.csv"),
      },
      {
        label: "Excel",
        action: () => exportMovementsExcel(filteredMovements, "movements.xlsx"),
      },
      {
        label: "PDF",
        action: () => exportMovementsPDF(filteredMovements, "movements.pdf"),
      },
    ];
  }, [filteredMovements]);

  const handleFilterChange = (field: keyof Filters, value: Filters[typeof field]) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value } as Filters;

      // Keep visualizations useful: when selecting a specific product, auto-fit date range to its data.
      if (field === "product" && typeof value === "string" && value !== "all") {
        const scoped = movements.filter((m) => m.product === value);
        if (scoped.length > 0) {
          const sortedDates = scoped.map((m) => m.date).sort((a, b) => a.localeCompare(b));
          next.startDate = sortedDates[0];
          next.endDate = sortedDates[sortedDates.length - 1];
        }
      }

      if (next.startDate > next.endDate) {
        next.endDate = next.startDate;
      }

      return next;
    });
  };

  const handleDownloadMovementReport = useCallback(async (format: "CSV" | "Excel" | "PDF") => {
    const productRows = selectedMove
      ? filteredMovements.filter((move) => move.product === selectedMove.product)
      : filteredMovements;

    const filePrefix = selectedMove ? `${selectedMove.product.replace(/\s+/g, "_").toLowerCase()}_ledger` : "movements";

    if (format === "CSV") {
      const headers = ["ID", "Type", "Product", "Quantity", "From", "To", "User", "Warehouse", "Date", "Time", "Reference"].join(",");
      const rows = productRows
        .map((move) =>
          [move.id, move.type, move.product, move.quantity, move.from, move.to, move.user, move.warehouse, move.date, move.time, move.trigger]
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");
      const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filePrefix}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (format === "Excel") {
      const { utils, write } = await import("xlsx");
      const ws = utils.json_to_sheet(productRows.map((move) => ({
        ID: move.id,
        Type: move.type,
        Product: move.product,
        Quantity: move.quantity,
        From: move.from,
        To: move.to,
        Operator: move.user,
        Warehouse: move.warehouse,
        Date: move.date,
        Time: move.time,
        Reference: move.trigger,
      })));
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Movements");
      const out = write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filePrefix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (format === "PDF") {
      const doc = new jsPDF({ orientation: "landscape" });
      let y = 14;
      const totalQty = productRows.reduce((sum, move) => sum + Math.abs(move.quantity), 0);

      doc.setFontSize(16);
      doc.text("Movement Report", 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Summary: ${productRows.length} rows | Total moved units ${totalQty}`, 14, y);
      y += 6;

      if (chartsSnapshotRef.current) {
        try {
          const html2canvas = (await import("html2canvas")).default;
          const canvas = await html2canvas(chartsSnapshotRef.current, { scale: 1.5, backgroundColor: "#ffffff" });
          const img = canvas.toDataURL("image/png");
          doc.addImage(img, "PNG", 14, y, 250, 60);
          y += 66;
        } catch {}
      }

      doc.setFontSize(8);
      productRows.slice(0, 18).forEach((move) => {
        if (y > 188) {
          doc.addPage("a4", "landscape");
          y = 14;
        }
        doc.text(`${move.id} | ${move.product} | ${move.warehouse} | ${typeConfig[move.type].label} | ${move.quantity} | ${move.user} | ${move.date} ${move.time} | ${move.trigger}`, 14, y);
        y += 5;
      });

      doc.save(`${filePrefix}.pdf`);
    }

    setToastList((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        message: `${format} report generated for ${selectedMove ? `${selectedMove.product} (${productRows.length})` : "all filtered movements"}`,
      },
    ]);
  }, [filteredMovements, selectedMove]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Move History</h1>
          <p className="text-[var(--text-secondary)]">Inventory movements, insights, and export tools</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={exportOptions[2].action} className="px-5 py-2 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] shadow-sm shadow-black/10 flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Export PDF
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[{ title: "Total Movements", value: stats.total, icon: History, color: "from-slate-500 to-slate-600" }, { title: "Receipts", value: stats.receipts, icon: PackagePlus, color: "from-emerald-500 to-teal-500" }, { title: "Deliveries", value: stats.deliveries, icon: PackageMinus, color: "from-purple-500 to-pink-500" }, { title: "Transfers", value: stats.transfers, icon: ArrowLeftRight, color: "from-indigo-500 to-purple-500" }].map((card, index) => (
          <FloatingCard key={card.title} delay={0.1 + index * 0.05}>
            <div className="relative rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{card.title}</p>
                  <h3 className="text-3xl font-semibold text-[var(--text-primary)]">{statValueFormatter(card.value)}</h3>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-white`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </FloatingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product, warehouse, ID, or user" className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] text-[var(--text-primary)]" />
              </div>
              <div className="flex items-center gap-2">
                {viewModes.map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-2xl border ${viewMode === mode ? "bg-indigo-500 text-white border-indigo-500" : "bg-transparent text-[var(--text-secondary)]"}`}>
                    {mode === "list" ? "List" : "Timeline"}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {exportOptions.map(option => (
                  <button key={option.label} onClick={option.action} className="px-4 py-2 rounded-2xl border border-[var(--glass-border)] text-[var(--text-secondary)] flex items-center gap-2">
                    <DownloadCloud className="w-4 h-4" /> {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Product</label>
                <select className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.product} onChange={e => handleFilterChange("product", e.target.value)}>
                  <option value="all">All Products</option>
                  {products.map(product => <option key={product} value={product}>{product}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Warehouse</label>
                <select className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.warehouse} onChange={e => handleFilterChange("warehouse", e.target.value)}>
                  <option value="all">All Warehouses</option>
                  {warehouses.map(warehouse => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Operator</label>
                <select className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.user} onChange={e => handleFilterChange("user", e.target.value)}>
                  <option value="all">All Operators</option>
                  {users.map(user => <option key={user} value={user}>{user}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Type</label>
                <select className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.type} onChange={e => handleFilterChange("type", e.target.value as MovementType | "all") }>
                  <option value="all">All Types</option>
                  <option value="receipt">Receipt</option>
                  <option value="delivery">Delivery</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Quantity Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={Number.isFinite(filters.quantityRange[0]) ? filters.quantityRange[0] : -99999} onChange={e => handleFilterChange("quantityRange", [Number(e.target.value), filters.quantityRange[1]])} />
                  <input type="number" className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={Number.isFinite(filters.quantityRange[1]) ? filters.quantityRange[1] : 99999} onChange={e => handleFilterChange("quantityRange", [filters.quantityRange[0], Number(e.target.value)])} />
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{filters.quantityRange[0]} to {filters.quantityRange[1]} units</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">Start date</label>
                <input type="date" className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.startDate} onChange={e => handleFilterChange("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-[var(--text-muted)]">End date</label>
                <input type="date" className="w-full border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.endDate} onChange={e => handleFilterChange("endDate", e.target.value)} />
              </div>
            </div>
          </div>

          {showChartFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Chart Filters</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <select className="border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.product} onChange={e => handleFilterChange("product", e.target.value)}>
                  <option value="all">Product: All</option>
                  {products.map(product => <option key={product} value={product}>{product}</option>)}
                </select>
                <select className="border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.warehouse} onChange={e => handleFilterChange("warehouse", e.target.value)}>
                  <option value="all">Warehouse: All</option>
                  {warehouses.map(warehouse => <option key={warehouse} value={warehouse}>{warehouse}</option>)}
                </select>
                <select className="border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.type} onChange={e => handleFilterChange("type", e.target.value as MovementType | "all") }>
                  <option value="all">Type: All</option>
                  <option value="receipt">Receipt</option>
                  <option value="delivery">Delivery</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.startDate} onChange={e => handleFilterChange("startDate", e.target.value)} />
                  <input type="date" className="border border-[var(--glass-border)] rounded-xl px-3 py-2" value={filters.endDate} onChange={e => handleFilterChange("endDate", e.target.value)} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chartsSnapshotRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AnalyticsCard title="Movement trend" delay={0.1} onFilterClick={() => setShowChartFilters((prev) => !prev)}>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Type distribution" delay={0.2} onFilterClick={() => setShowChartFilters((prev) => !prev)}>
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={movementByType} dataKey="value" nameKey="type" innerRadius={50} outerRadius={80} label>
                      {movementByType.map((entry, index) => (
                        <Cell key={entry.type} fill={[
                          "#6366f1",
                          "#10b981",
                          "#f59e0b",
                          "#a855f7",
                        ][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
            <AnalyticsCard title="Receipts vs Deliveries" delay={0.3} onFilterClick={() => setShowChartFilters((prev) => !prev)}>
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <BarChart data={receiptsVsDeliveries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="receipts" fill="#10b981" />
                    <Bar dataKey="deliveries" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalyticsCard>
          </div>
        </div>

        <div className="space-y-5">
          <AnalyticsCard title="AI insights" delay={0.4}>
            <div className="space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">{insights.spike >= 0 ? `Movements increased by ${insights.spike}% this week.` : `Movements decreased by ${Math.abs(insights.spike)}% this week.`}</p>
              <p className="text-sm text-[var(--text-secondary)]">Most active warehouse: <strong>{insights.mostActiveWarehouse}</strong></p>
              <p className="text-sm text-[var(--text-secondary)]">Top product: <strong>{insights.highestProduct}</strong></p>
            </div>
          </AnalyticsCard>
          <AnalyticsCard title="Warehouse heatmap" delay={0.5}>
            <div className="space-y-3">
              {heatmapData.map(item => (
                <div key={item.warehouse} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-[var(--text-secondary)]">{item.warehouse}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(item.count / Math.max(...heatmapData.map(i => i.count), 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{item.count}</span>
                </div>
              ))}
            </div>
          </AnalyticsCard>
          <AnalyticsCard title="Insights timeline" delay={0.6}>
            <div className="text-sm text-[var(--text-secondary)] space-y-2">
              <FilterPill label="Filters" value={`${filters.product}, ${filters.warehouse}`} />
              <FilterPill label="Qty" value={`${filters.quantityRange[0]} to ${filters.quantityRange[1]}`} />
              <FilterPill label="Date" value={`${filters.startDate} – ${filters.endDate}`} />
            </div>
          </AnalyticsCard>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="overflow-auto rounded-3xl border border-[var(--glass-border)] bg-[var(--card-bg)]">
          <table className="min-w-full text-left">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Warehouse</th>
                <th className="px-4 py-2">Operator</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(move => (
                <tr key={move.id} className="border-t border-slate-50 hover:bg-slate-50/50" onClick={() => { setSelectedMove(move); setDrawerOpen(true); }}>
                  <td className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">{move.id}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{move.product}</td>
                  <td className="px-4 py-3 text-sm">{typeConfig[move.type].label}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${move.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{move.quantity > 0 ? "+" : ""}{move.quantity}</td>
                  <td className="px-4 py-3 text-sm">{move.warehouse}</td>
                  <td className="px-4 py-3 text-sm">{move.user}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{move.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "timeline" && (
        <div className="space-y-4">
          {filteredMovements.map((move, index) => (
            <motion.div key={move.id} className="relative bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-3xl p-5 shadow-lg" whileHover={{ translateY: -4 }} onClick={() => { setSelectedMove(move); setDrawerOpen(true); }}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${typeConfig[move.type].bg}`}>
                  {React.createElement(typeConfig[move.type].icon, { className: `w-6 h-6 ${typeConfig[move.type].text}` })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[var(--text-muted)]">{move.id}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{move.description}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeConfig[move.type].bg} ${typeConfig[move.type].text}`}>
                      {typeConfig[move.type].label}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] mt-2">
                    {move.product} • {move.from} → {move.to}
                  </p>
                  <div className="mt-3 flex items-center gap-6 text-sm text-[var(--text-muted)]">
                    <span>{move.date} • {move.time}</span>
                    <span className={move.quantity > 0 ? "text-emerald-600" : "text-red-600"}>{move.quantity > 0 ? "+" : ""}{move.quantity} units</span>
                    <span>Stock: {move.stockAfter}</span>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} className="text-[var(--text-muted)]">
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <MovementDrawer
            move={selectedMove}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onViewLedger={() => {
              setDrawerOpen(false);
              setLedgerOpen(true);
            }}
            onDownloadReport={() => {
              setDrawerOpen(false);
              setReportModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <LedgerModal
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        movements={selectedMove ? filteredMovements.filter((m) => m.product === selectedMove.product) : filteredMovements}
      />

      <ReportExportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onExport={handleDownloadMovementReport}
      />

      <div className="fixed top-5 right-5 space-y-2">
        {toastList.map(toast => (
          <DashboardToast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
