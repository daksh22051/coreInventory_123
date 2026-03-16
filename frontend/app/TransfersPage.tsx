"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  Search,
  Plus,
  X,
  Warehouse,
  Package,
  Clock,
  CheckCircle,
  ArrowRight,
  Eye,
  Check,
  ArrowUpRight,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Truck,
  ScanLine,
  Route,
  TimerReset,
  CircleDashed,
  Zap,
  Loader2,
  RefreshCw,
  ChevronRight,
  Boxes,
  CalendarDays,
  UserRound,
  Info,
  ClipboardList,
} from "lucide-react";
import { useLiveRefresh } from "./useSocket";

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
          headers.Authorization = "Bearer " + parsed.state.token;
          return headers;
        }
      } catch {}
    }

    const fallbackToken = localStorage.getItem("token");
    if (fallbackToken) {
      headers.Authorization = "Bearer " + fallbackToken;
    }
  }

  return headers;
}

type TransferStatus = "pending" | "in-transit" | "completed" | "cancelled";
type TransferPriority = "standard" | "priority" | "critical";
type TransferMode = "warehouse" | "rack" | "cross-dock";

type WarehouseOption = {
  id: string;
  name: string;
  code: string;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

type TransferItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
};

type TransferRecord = {
  backendId: string;
  id: string;
  from: string;
  fromRack: string;
  fromCode: string;
  to: string;
  toRack: string;
  toCode: string;
  items: number;
  manifest: TransferItem[];
  totalQty: number;
  status: TransferStatus;
  priority: TransferPriority;
  mode: TransferMode;
  date: string;
  initiatedBy: string;
  etaHours: number;
  progress: number;
  vehicle: string;
  variance: string;
  requiresScan: boolean;
  reason: string;
  notes: string;
};

type BackendTransfer = {
  _id: string;
  transferNumber?: string;
  fromWarehouse?: { _id?: string; name?: string; code?: string } | null;
  toWarehouse?: { _id?: string; name?: string; code?: string } | null;
  items?: Array<{
    product?: { _id?: string; name?: string; sku?: string } | null;
    quantity?: number;
  }>;
  status?: string;
  reason?: string;
  notes?: string;
  completedDate?: string;
  createdAt?: string;
  createdBy?: { name?: string } | string | null;
};

const transfers: TransferRecord[] = [
  {
    backendId: "demo-1",
    id: "TRF-001",
    from: "Warehouse A",
    fromRack: "A-12",
    fromCode: "WH-A",
    to: "Warehouse B",
    toRack: "B-05",
    toCode: "WH-B",
    items: 3,
    manifest: [
      { productId: "1", productName: "Wireless Headphones", sku: "SKU-001", quantity: 50 },
      { productId: "2", productName: "Smart Watch Pro", sku: "SKU-002", quantity: 40 },
      { productId: "3", productName: "USB-C Hub", sku: "SKU-003", quantity: 60 },
    ],
    totalQty: 150,
    status: "in-transit",
    priority: "priority",
    mode: "warehouse",
    date: "2026-03-14",
    initiatedBy: "John Smith",
    etaHours: 4,
    progress: 62,
    vehicle: "Dock Van 07",
    variance: "+2.4%",
    requiresScan: true,
    reason: "Fast-moving stock rebalance",
    notes: "Receiving dock requested split unload for aisle B.",
  },
  {
    backendId: "demo-2",
    id: "TRF-002",
    from: "Warehouse B",
    fromRack: "B-08",
    fromCode: "WH-B",
    to: "Warehouse C",
    toRack: "C-01",
    toCode: "WH-C",
    items: 5,
    manifest: [
      { productId: "4", productName: "Packaging Tape", sku: "SKU-006", quantity: 80 },
      { productId: "5", productName: "Cardboard Boxes", sku: "SKU-009", quantity: 60 },
      { productId: "6", productName: "Monitor Stand", sku: "SKU-010", quantity: 40 },
      { productId: "7", productName: "Industrial Drill", sku: "SKU-008", quantity: 50 },
      { productId: "8", productName: "Steel Bolts M10", sku: "SKU-007", quantity: 50 },
    ],
    totalQty: 280,
    status: "completed",
    priority: "standard",
    mode: "warehouse",
    date: "2026-03-13",
    initiatedBy: "Sarah Johnson",
    etaHours: 0,
    progress: 100,
    vehicle: "Linehaul 04",
    variance: "-0.8%",
    requiresScan: false,
    reason: "Regional replenishment",
    notes: "Delivered within SLA and checked at dock gate.",
  },
  {
    backendId: "demo-3",
    id: "TRF-003",
    from: "Warehouse A",
    fromRack: "A-05",
    fromCode: "WH-A",
    to: "Warehouse A",
    toRack: "A-22",
    toCode: "WH-A",
    items: 2,
    manifest: [
      { productId: "9", productName: "Industrial Drill", sku: "SKU-008", quantity: 40 },
      { productId: "10", productName: "Steel Bolts M10", sku: "SKU-007", quantity: 60 },
    ],
    totalQty: 100,
    status: "pending",
    priority: "critical",
    mode: "rack",
    date: "2026-03-14",
    initiatedBy: "Mike Chen",
    etaHours: 1,
    progress: 18,
    vehicle: "Internal Lift 03",
    variance: "+4.1%",
    requiresScan: true,
    reason: "Rack rebalancing",
    notes: "Reserve destination lane until cycle count closes.",
  },
  {
    backendId: "demo-4",
    id: "TRF-004",
    from: "Warehouse C",
    fromRack: "C-15",
    fromCode: "WH-C",
    to: "Warehouse A",
    toRack: "A-03",
    toCode: "WH-A",
    items: 4,
    manifest: [
      { productId: "11", productName: "Laptop Dell XPS 15", sku: "SKU-001", quantity: 50 },
      { productId: "12", productName: "Office Chair Pro", sku: "SKU-002", quantity: 40 },
      { productId: "13", productName: "USB-C Hub 7-in-1", sku: "SKU-005", quantity: 60 },
      { productId: "14", productName: "Wireless Mouse MX", sku: "SKU-003", quantity: 50 },
    ],
    totalQty: 200,
    status: "in-transit",
    priority: "priority",
    mode: "cross-dock",
    date: "2026-03-14",
    initiatedBy: "Emily Davis",
    etaHours: 6,
    progress: 49,
    vehicle: "Express Carrier 11",
    variance: "+1.3%",
    requiresScan: true,
    reason: "Cross-dock fast lane",
    notes: "Priority unload at receiving lane 3.",
  },
  {
    backendId: "demo-5",
    id: "TRF-005",
    from: "Warehouse D",
    fromRack: "D-03",
    fromCode: "WH-D",
    to: "Warehouse B",
    toRack: "B-17",
    toCode: "WH-B",
    items: 7,
    manifest: [
      { productId: "15", productName: "Packaging Tape", sku: "SKU-006", quantity: 70 },
      { productId: "16", productName: "Cardboard Boxes Large", sku: "SKU-009", quantity: 90 },
      { productId: "17", productName: "Monitor Stand", sku: "SKU-010", quantity: 60 },
      { productId: "18", productName: "Office Chair Pro", sku: "SKU-002", quantity: 80 },
      { productId: "19", productName: "USB-C Hub 7-in-1", sku: "SKU-005", quantity: 40 },
      { productId: "20", productName: "Wireless Mouse MX", sku: "SKU-003", quantity: 40 },
      { productId: "21", productName: "Steel Bolts M10", sku: "SKU-007", quantity: 30 },
    ],
    totalQty: 410,
    status: "pending",
    priority: "standard",
    mode: "warehouse",
    date: "2026-03-15",
    initiatedBy: "Riya Kapoor",
    etaHours: 9,
    progress: 8,
    vehicle: "Scheduled Dispatch",
    variance: "-1.1%",
    requiresScan: false,
    reason: "Overflow relief",
    notes: "Awaiting dock assignment and final manifest lock.",
  },
  {
    backendId: "demo-6",
    id: "TRF-006",
    from: "Warehouse B",
    fromRack: "B-11",
    fromCode: "WH-B",
    to: "Warehouse D",
    toRack: "D-09",
    toCode: "WH-D",
    items: 6,
    manifest: [
      { productId: "22", productName: "Standing Desk 60", sku: "SKU-004", quantity: 50 },
      { productId: "23", productName: "Laptop Dell XPS 15", sku: "SKU-001", quantity: 40 },
      { productId: "24", productName: "Industrial Drill", sku: "SKU-008", quantity: 70 },
      { productId: "25", productName: "Packaging Tape", sku: "SKU-006", quantity: 60 },
      { productId: "26", productName: "Cardboard Boxes Large", sku: "SKU-009", quantity: 40 },
      { productId: "27", productName: "Monitor Stand", sku: "SKU-010", quantity: 60 },
    ],
    totalQty: 320,
    status: "completed",
    priority: "priority",
    mode: "cross-dock",
    date: "2026-03-15",
    initiatedBy: "Anika Rao",
    etaHours: 0,
    progress: 100,
    vehicle: "Night Route 02",
    variance: "+0.4%",
    requiresScan: true,
    reason: "Late shift replenishment",
    notes: "Completed and dock scanned on arrival.",
  },
];

const demoWarehouses: WarehouseOption[] = [
  { id: "wh-001", name: "Main Warehouse", code: "WH-MAIN" },
  { id: "wh-002", name: "Overflow Hub", code: "WH-OVR" },
  { id: "wh-003", name: "Dispatch Center", code: "WH-DSP" },
];

const demoProducts: ProductOption[] = [
  { id: "1", name: "Laptop Dell XPS 15", sku: "SKU-001" },
  { id: "2", name: "Office Chair Pro", sku: "SKU-002" },
  { id: "3", name: "Wireless Mouse MX", sku: "SKU-003" },
  { id: "4", name: "Standing Desk 60\"", sku: "SKU-004" },
  { id: "5", name: "USB-C Hub 7-in-1", sku: "SKU-005" },
];

const statusMeta: Record<TransferStatus, { bg: string; text: string; tone: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", tone: "from-amber-500 to-orange-500", label: "Pending" },
  "in-transit": { bg: "bg-blue-50", text: "text-blue-700", tone: "from-blue-500 to-indigo-500", label: "In Transit" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", tone: "from-emerald-500 to-teal-500", label: "Completed" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", tone: "from-rose-500 to-red-500", label: "Cancelled" },
};

const priorityMeta: Record<TransferPriority, { chip: string; text: string }> = {
  standard: { chip: "bg-slate-100", text: "text-slate-600" },
  priority: { chip: "bg-violet-100", text: "text-violet-700" },
  critical: { chip: "bg-rose-100", text: "text-rose-700" },
};

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX((y - rect.height / 2) / 25);
    setRotateY((rect.width / 2 - x) / 25);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setRotateX(0);
        setRotateY(0);
      }}
      style={{ transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
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
      <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-6 rounded-2xl overflow-hidden group cursor-pointer">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-2">{value}</h3>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className={`w-4 h-4 ${trend >= 0 ? "text-emerald-600" : "text-red-600 rotate-90"}`} />
                <span className={`text-sm ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </div>
    </FloatingCard>
  );
}

function PremiumInsightCard({
  icon: Icon,
  title,
  value,
  note,
  tone,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  note: string;
  tone: string;
  delay: number;
}) {
  return (
    <FloatingCard delay={delay}>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)]/95 p-5 shadow-lg shadow-black/10">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</p>
            <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{note}</p>
          </div>
          <div className={`rounded-2xl bg-gradient-to-br p-3 ${tone}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}

function mapBackendStatus(status?: string): TransferStatus {
  if (status === "completed") return "completed";
  if (status === "in_transit") return "in-transit";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function derivePriority(totalQty: number, itemCount: number): TransferPriority {
  if (totalQty >= 300 || itemCount >= 6) return "critical";
  if (totalQty >= 140 || itemCount >= 3) return "priority";
  return "standard";
}

function deriveMode(fromName: string, toName: string, itemCount: number): TransferMode {
  if (fromName && toName && fromName === toName) return "rack";
  if (itemCount >= 4) return "cross-dock";
  return "warehouse";
}

function deriveProgress(status: TransferStatus, totalQty: number): number {
  if (status === "completed") return 100;
  if (status === "cancelled") return 0;
  if (status === "in-transit") return Math.min(92, 35 + Math.round(totalQty / 8));
  return Math.min(24, 6 + Math.round(totalQty / 25));
}

function deriveEtaHours(status: TransferStatus, totalQty: number): number {
  if (status === "completed" || status === "cancelled") return 0;
  if (status === "in-transit") return Math.max(1, Math.ceil(totalQty / 60));
  return Math.max(1, Math.ceil(totalQty / 45));
}

function buildVehicle(mode: TransferMode, totalQty: number): string {
  if (mode === "rack") return "Internal Lift";
  if (mode === "cross-dock") return totalQty > 200 ? "Cross-Dock Relay" : "Express Carrier";
  return totalQty > 180 ? "Linehaul Truck" : "Dock Van";
}

function buildVariance(totalQty: number, itemCount: number): string {
  const raw = (((totalQty + itemCount * 13) % 9) - 4) / 10;
  return `${raw >= 0 ? "+" : ""}${raw.toFixed(1)}%`;
}

function mapTransfer(transfer: BackendTransfer): TransferRecord {
  const manifest = (transfer.items || []).map((item, index) => ({
    productId: item.product?._id || `item-${index}`,
    productName: item.product?.name || `Product ${index + 1}`,
    sku: item.product?.sku || `SKU-${index + 1}`,
    quantity: item.quantity || 0,
  }));
  const totalQty = manifest.reduce((sum, item) => sum + item.quantity, 0);
  const itemCount = manifest.length;
  const status = mapBackendStatus(transfer.status);
  const priority = derivePriority(totalQty, itemCount);
  const fromName = transfer.fromWarehouse?.name || "Source Warehouse";
  const toName = transfer.toWarehouse?.name || "Destination Warehouse";
  const mode = deriveMode(fromName, toName, itemCount);

  return {
    backendId: transfer._id,
    id: transfer.transferNumber || `TRF-${transfer._id.slice(-6).toUpperCase()}`,
    from: fromName,
    fromRack: mode === "rack" ? "Rack Rebalance" : `Dock ${transfer.fromWarehouse?.code || "A1"}`,
    fromCode: transfer.fromWarehouse?.code || "WH-SRC",
    to: toName,
    toRack: mode === "rack" ? "Target Slot" : `Dock ${transfer.toWarehouse?.code || "B1"}`,
    toCode: transfer.toWarehouse?.code || "WH-DST",
    items: itemCount,
    manifest,
    totalQty,
    status,
    priority,
    mode,
    date: (transfer.completedDate || transfer.createdAt || new Date().toISOString()).slice(0, 10),
    initiatedBy: typeof transfer.createdBy === "string" ? transfer.createdBy : transfer.createdBy?.name || "Operations Desk",
    etaHours: deriveEtaHours(status, totalQty),
    progress: deriveProgress(status, totalQty),
    vehicle: buildVehicle(mode, totalQty),
    variance: buildVariance(totalQty, itemCount),
    requiresScan: totalQty >= 100 || itemCount >= 3,
    reason: transfer.reason || "Inventory transfer",
    notes: transfer.notes || "",
  };
}

function TransferDrawer({
  transfer,
  onClose,
  onComplete,
  completing,
}: {
  transfer: TransferRecord | null;
  onClose: () => void;
  onComplete: (transfer: TransferRecord) => void;
  completing: boolean;
}) {
  return (
    <AnimatePresence>
      {transfer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} className="relative h-full w-full max-w-xl overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--card-bg)] shadow-2xl shadow-black/20">
            <div className="sticky top-0 z-10 border-b border-[var(--glass-border)] bg-[var(--card-bg)]/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[var(--accent-indigo)]">{transfer.id}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[transfer.status].bg} ${statusMeta[transfer.status].text}`}>{statusMeta[transfer.status].label}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">Transfer Details</h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{transfer.reason}</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--hover-bg)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Origin</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{transfer.from}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{transfer.fromCode} • {transfer.fromRack}</p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Destination</p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">{transfer.to}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{transfer.toCode} • {transfer.toRack}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--glass-border)] p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><Boxes className="h-4 w-4" />Manifest</div>
                  <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{transfer.totalQty}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{transfer.items} item lines</p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"><Truck className="h-4 w-4" />Execution</div>
                  <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{transfer.progress}%</p>
                  <p className="text-sm text-[var(--text-secondary)]">{transfer.vehicle}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--glass-border)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><ClipboardList className="h-4 w-4" />Manifest Lines</p>
                  <p className="text-xs text-[var(--text-muted)]">Variance {transfer.variance}</p>
                </div>
                <div className="space-y-3">
                  {transfer.manifest.map((item) => (
                    <div key={`${transfer.backendId}-${item.productId}-${item.sku}`} className="flex items-center justify-between rounded-xl bg-[var(--hover-bg)]/50 px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{item.productName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--text-primary)]">{item.quantity}</p>
                        <p className="text-xs text-[var(--text-muted)]">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--glass-border)] p-5 space-y-3">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><Info className="h-4 w-4" />Transfer Notes</p>
                <div className="grid gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{transfer.date}</div>
                  <div className="flex items-center gap-2"><UserRound className="h-4 w-4" />{transfer.initiatedBy}</div>
                  <div className="flex items-center gap-2"><Route className="h-4 w-4" />{transfer.mode}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{transfer.etaHours === 0 ? "Delivered" : `${transfer.etaHours}h ETA`}</div>
                  <p className="rounded-xl bg-[var(--hover-bg)]/50 p-3 text-[var(--text-secondary)]">{transfer.notes || "No notes attached to this transfer."}</p>
                </div>
              </div>

              <div className="flex gap-3 pb-4">
                <button onClick={onClose} className="flex-1 rounded-xl border border-[var(--glass-border)] px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]">Close</button>
                {transfer.status === "in-transit" && (
                  <button onClick={() => onComplete(transfer)} disabled={completing} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white disabled:opacity-50">
                    {completing ? "Completing..." : "Mark Complete"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TransferModal({
  isOpen,
  onClose,
  warehouses,
  products,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouses: WarehouseOption[];
  products: ProductOption[];
  onCreated: (message: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fromWarehouseId: "",
    fromRack: "",
    toWarehouseId: "",
    toRack: "",
    priority: "standard" as TransferPriority,
    mode: "warehouse" as TransferMode,
    etaHours: "4",
    reason: "Inventory transfer",
    notes: "",
    autoReserve: true,
    requiresScan: true,
    notifyReceiving: false,
  });
  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([{ productId: "", quantity: "" }]);
  const productById = new Map(products.map((product) => [product.id, product]));

  const resetState = () => {
    setSubmitting(false);
    setError("");
    setFormData({
      fromWarehouseId: "",
      fromRack: "",
      toWarehouseId: "",
      toRack: "",
      priority: "standard",
      mode: "warehouse",
      etaHours: "4",
      reason: "Inventory transfer",
      notes: "",
      autoReserve: true,
      requiresScan: true,
      notifyReceiving: false,
    });
    setItems([{ productId: "", quantity: "" }]);
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const updateItem = (index: number, key: "productId" | "quantity", value: string) => {
    if (key === "quantity") {
      const cleaned = value.replace(/\D/g, "");
      setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: cleaned } : item)));
      return;
    }

    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      return {
        ...item,
        productId: value,
        quantity: value ? (item.quantity || "1") : "",
      };
    }));

    const selectedProduct = productById.get(value);
    if (selectedProduct?.warehouseId && !formData.fromWarehouseId) {
      const suggestedTo = warehouses.find((warehouse) => warehouse.id !== selectedProduct.warehouseId)?.id || "";
      setFormData((current) => ({
        ...current,
        fromWarehouseId: selectedProduct.warehouseId || "",
        toWarehouseId: current.toWarehouseId || suggestedTo,
      }));
    }
  };

  const addItemRow = () => {
    setItems((current) => [...current, { productId: "", quantity: "" }]);
  };

  const removeItemRow = (index: number) => {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  const handleSubmit = async () => {
    const parsedItems = items.map((item) => ({
      productId: item.productId.trim(),
      quantity: Number.parseInt(item.quantity, 10),
    }));
    const hasInvalidSelectedLine = parsedItems.some((item) => item.productId && (!Number.isFinite(item.quantity) || item.quantity <= 0));
    const validItems = parsedItems.filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      setError("Select both origin and destination warehouses.");
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId && formData.mode !== "rack") {
      setError("Use rack mode when the transfer stays inside the same warehouse.");
      return;
    }

    if (validItems.length === 0) {
      setError("Add at least one valid product line.");
      return;
    }

    if (hasInvalidSelectedLine) {
      setError("Enter quantity greater than 0 for all selected products.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        fromWarehouse: formData.fromWarehouseId,
        toWarehouse: formData.toWarehouseId,
        items: validItems.map((item) => ({ product: item.productId, quantity: item.quantity })),
        reason: formData.reason,
        notes: [
          formData.notes.trim(),
          `Priority: ${formData.priority}`,
          `Mode: ${formData.mode}`,
          `Origin Rack: ${formData.fromRack || "N/A"}`,
          `Destination Rack: ${formData.toRack || "N/A"}`,
          `Preferred ETA: ${formData.etaHours}h`,
          formData.autoReserve ? "Auto reserve enabled" : "",
          formData.requiresScan ? "Scan verification required" : "",
          formData.notifyReceiving ? "Receiving team notified" : "",
        ].filter(Boolean).join(" | "),
      };

      const res = await fetch(`${API_BASE}/api/transfers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to create transfer.");
      }

      onCreated("Transfer created successfully.");
      closeModal();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create transfer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-50 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto bg-[var(--card-bg)] shadow-2xl shadow-black/20 rounded-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.08),transparent_30%)]" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                    <ArrowLeftRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">New Premium Transfer</h2>
                    <p className="text-[var(--text-secondary)] text-sm">Auto-routing, scan verification, dock intelligence</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={closeModal} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-5">
                      <h3 className="text-sm font-semibold tracking-[0.18em] uppercase text-[var(--text-muted)]">Origin</h3>
                      <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">Warehouse</label>
                        <select value={formData.fromWarehouseId} onChange={(e) => setFormData((current) => ({ ...current, fromWarehouseId: e.target.value }))} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                          <option value="">Select warehouse</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">Rack / Zone</label>
                        <input value={formData.fromRack} onChange={(e) => setFormData((current) => ({ ...current, fromRack: e.target.value }))} type="text" placeholder="e.g. A-12 / Fast Pick" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-5">
                      <h3 className="text-sm font-semibold tracking-[0.18em] uppercase text-[var(--text-muted)]">Destination</h3>
                      <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">Warehouse</label>
                        <select value={formData.toWarehouseId} onChange={(e) => setFormData((current) => ({ ...current, toWarehouseId: e.target.value }))} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                          <option value="">Select warehouse</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">Rack / Zone</label>
                        <input value={formData.toRack} onChange={(e) => setFormData((current) => ({ ...current, toRack: e.target.value }))} type="text" placeholder="e.g. B-05 / Cold Storage" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">Priority</label>
                      <select value={formData.priority} onChange={(e) => setFormData((current) => ({ ...current, priority: e.target.value as TransferPriority }))} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                        <option value="standard">Standard</option>
                        <option value="priority">Priority</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">Mode</label>
                      <select value={formData.mode} onChange={(e) => setFormData((current) => ({ ...current, mode: e.target.value as TransferMode }))} className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                        <option value="warehouse">Warehouse Transfer</option>
                        <option value="rack">Rack Rebalancing</option>
                        <option value="cross-dock">Cross-Dock</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">Preferred ETA</label>
                      <input value={formData.etaHours} onChange={(e) => setFormData((current) => ({ ...current, etaHours: e.target.value }))} type="text" placeholder="4 hours" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">Reason</label>
                      <input value={formData.reason} onChange={(e) => setFormData((current) => ({ ...current, reason: e.target.value }))} type="text" placeholder="Inventory transfer" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">Notes</label>
                      <input value={formData.notes} onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))} type="text" placeholder="Dispatch notes" className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Manifest</label>
                    <div className="space-y-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-5">
                      {items.map((item, index) => (
                        <div key={`item-row-${index}`} className="grid grid-cols-1 md:grid-cols-[1.2fr_0.7fr_auto] gap-3">
                          <select value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)} className="px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none">
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
                            ))}
                          </select>
                          <input value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} type="number" inputMode="numeric" step="1" min="1" disabled={!item.productId} placeholder={item.productId ? "Quantity" : "Select product first"} className="px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-60" />
                          <button type="button" onClick={() => removeItemRow(index)} className="rounded-xl border border-[var(--glass-border)] px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]">Remove</button>
                        </div>
                      ))}
                      <button type="button" onClick={addItemRow} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                        <Plus className="h-4 w-4" />
                        Add Product Line
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-5">
                    <div className="flex items-center gap-2 text-indigo-700 text-sm font-semibold">
                      <Sparkles className="w-4 h-4" />
                      Premium Assist
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-xl bg-white/80 p-3 border border-white/80">AI route saved 18 minutes based on current dock load.</div>
                      <div className="rounded-xl bg-white/80 p-3 border border-white/80">Barcode checkpoint recommended at dispatch and receiving.</div>
                      <div className="rounded-xl bg-white/80 p-3 border border-white/80">Destination rack has 84% availability for this manifest.</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-bg)]/40 p-5 space-y-3">
                    <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                      <input type="checkbox" checked={formData.autoReserve} onChange={(e) => setFormData((current) => ({ ...current, autoReserve: e.target.checked }))} className="w-4 h-4 rounded" />
                      Auto-reserve destination capacity
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                      <input type="checkbox" checked={formData.requiresScan} onChange={(e) => setFormData((current) => ({ ...current, requiresScan: e.target.checked }))} className="w-4 h-4 rounded" />
                      Require barcode scan verification
                    </label>
                    <label className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                      <input type="checkbox" checked={formData.notifyReceiving} onChange={(e) => setFormData((current) => ({ ...current, notifyReceiving: e.target.checked }))} className="w-4 h-4 rounded" />
                      Notify receiving team on dispatch
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeModal} className="flex-1 py-3 px-6 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-secondary)] font-medium hover:bg-[var(--hover-bg)]">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void handleSubmit()} disabled={submitting} className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-60">
                  {submitting ? "Creating..." : "Create Premium Transfer"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TransfersPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TransferPriority>("all");
  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>(demoWarehouses);
  const [productOptions, setProductOptions] = useState<ProductOption[]>(demoProducts);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (showModal || selectedTransfer) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, selectedTransfer]);

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transfers?limit=100`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch transfers");
      const data = await res.json();
      const mapped = ((data.data || []) as BackendTransfer[]).map(mapTransfer);
      setTransferRecords(mapped);
    } catch {
      setTransferRecords(transfers);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [warehousesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/api/warehouses`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/products?limit=200`, { headers: getAuthHeaders() }),
      ]);

      if (warehousesRes.ok) {
        const warehouseData = await warehousesRes.json();
        const mappedWarehouses = ((warehouseData.data || warehouseData) as Array<{ _id: string; name: string; code: string }>).map((warehouse) => ({
          id: warehouse._id,
          name: warehouse.name,
          code: warehouse.code,
        }));
        if (mappedWarehouses.length > 0) setWarehouseOptions(mappedWarehouses);
      }

      if (productsRes.ok) {
        const productData = await productsRes.json();
        const mappedProducts = ((productData.data || productData) as Array<{ _id: string; name: string; sku: string }>).map((product) => ({
          id: product._id,
          name: product.name,
          sku: product.sku,
        }));
        if (mappedProducts.length > 0) setProductOptions(mappedProducts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void fetchTransfers();
    void fetchReferenceData();
  }, [fetchReferenceData, fetchTransfers]);

  useLiveRefresh("transfer_update", () => {
    void fetchTransfers();
  });

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredTransfers = transferRecords.filter((transfer) => {

    const term = searchQuery.toLowerCase();
    const matchesSearch =
      transfer.id.toLowerCase().includes(term) ||
      transfer.from.toLowerCase().includes(term) ||
      transfer.to.toLowerCase().includes(term) ||
      transfer.initiatedBy.toLowerCase().includes(term) ||
      transfer.vehicle.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || transfer.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingTransfers = transferRecords.filter((transfer) => transfer.status === "pending").length;
  const inTransitTransfers = transferRecords.filter((transfer) => transfer.status === "in-transit").length;
  const completedToday = transferRecords.filter((transfer) => transfer.status === "completed").length;
  const itemsMoved = transferRecords.reduce((sum, transfer) => sum + transfer.totalQty, 0);
  const scanRequired = transferRecords.filter((transfer) => transfer.requiresScan).length;
  const criticalMoves = transferRecords.filter((transfer) => transfer.priority === "critical").length;
  const averageProgress = transferRecords.length > 0
    ? Math.round(transferRecords.reduce((sum, transfer) => sum + transfer.progress, 0) / transferRecords.length)
    : 0;

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchTransfers();
  };

  const handleCompleteTransfer = async (transfer: TransferRecord) => {
    setCompletingId(transfer.backendId);
    try {
      const res = await fetch(`${API_BASE}/api/transfers/${transfer.backendId}/complete`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to complete transfer");
      await fetchTransfers();
      setToast({ type: "success", message: `${transfer.id} marked as completed.` });
      setSelectedTransfer(null);
    } catch {
      setToast({ type: "error", message: "Unable to complete transfer right now." });
    } finally {
      setCompletingId(null);
    }
  };

  const premiumInsights = [
    {
      icon: Sparkles,
      title: "AI Route Savings",
      value: "18 min avg",
      note: "Dock sequencing cut idle handoff time across active routes.",
      tone: "from-indigo-500 to-violet-500",
    },
    {
      icon: ShieldCheck,
      title: "Verified Manifests",
      value: `${scanRequired}/${Math.max(transferRecords.length, 1)}`,
      note: "High-confidence barcode confirmation enabled on most active loads.",
      tone: "from-emerald-500 to-teal-500",
    },
    {
      icon: AlertTriangle,
      title: "SLA Risk Window",
      value: `${criticalMoves} critical`,
      note: "Critical transfers are within the next 2 hours and need attention.",
      tone: "from-amber-500 to-orange-500",
    },
    {
      icon: Route,
      title: "Flow Health",
      value: `${averageProgress}%`,
      note: "Average movement completion across open transfers this shift.",
      tone: "from-fuchsia-500 to-rose-500",
    },
  ];

  const topLanes = [
    {
      label: "A to B Fast Lane",
      count: 9,
      note: "Best throughput this week",
      icon: Truck,
      tone: "from-blue-500 to-cyan-500",
    },
    {
      label: "Cross-Dock Relay",
      count: 4,
      note: "Premium dock routing enabled",
      icon: Zap,
      tone: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Rack Rebalancing",
      count: 7,
      note: "Low-pick shelves auto-corrected",
      icon: Layers,
      tone: "from-emerald-500 to-lime-500",
    },
  ];

  const handleCreated = async (message: string) => {
    await fetchTransfers();
    setToast({ type: "success", message });
  };

  return (
    <>
      <main className="p-6 space-y-6">
        {toast && (
          <div className={`fixed right-6 top-24 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
            {toast.message}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Transfer Control Tower
            </div>
            <h1 className="mt-3 text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Transfers</h1>
            <p className="text-[var(--text-secondary)] mt-1 max-w-2xl">Move inventory between warehouses and racks with SLA visibility, live progress tracking, scan compliance, and premium route intelligence.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Open Flow</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{pendingTransfers + inTransitTransfers} active moves</p>
            </div>
            <button onClick={handleRefresh} className="flex items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--hover-bg)]">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedTransfer(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-3 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-5 h-5" />
              New Transfer
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard title="Pending Transfers" value={String(pendingTransfers)} icon={Clock} color="from-amber-500 to-orange-500" delay={0.1} />
          <StatCard title="In Transit" value={String(inTransitTransfers)} icon={ArrowLeftRight} trend={12} color="from-indigo-500 to-purple-500" delay={0.2} />
          <StatCard title="Completed Today" value={String(completedToday)} icon={CheckCircle} trend={25} color="from-emerald-500 to-teal-500" delay={0.3} />
          <StatCard title="Items Moved" value={itemsMoved.toLocaleString()} icon={Package} color="from-pink-500 to-rose-500" delay={0.4} />
        </div>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,248,255,0.92))] p-6 shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_26%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Route className="h-4 w-4" />
                Premium Flow Insights
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">Make this transfer desk feel like an operations cockpit.</h2>
              <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">Monitor movement health, spot bottlenecks, protect critical stock, and keep receiving teams aligned from dispatch to scan confirmation.</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {premiumInsights.map((insight, index) => (
                  <PremiumInsightCard key={insight.title} {...insight} delay={0.15 + index * 0.08} />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--glass-border)] bg-slate-950/[0.92] p-5 text-white shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Lane Console</p>
                  <h3 className="mt-2 text-xl font-bold">Premium movement lanes</h3>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <CircleDashed className="h-5 w-5 text-cyan-300" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {topLanes.map((lane) => {
                  const LaneIcon = lane.icon;
                  return (
                  <div key={lane.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl bg-gradient-to-br p-2 ${lane.tone}`}>
                          <LaneIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{lane.label}</p>
                          <p className="text-sm text-white/60">{lane.note}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{lane.count}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Today</p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-fuchsia-500/15 p-4">
                <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium">
                  <TimerReset className="h-4 w-4" />
                  Live promise window
                </div>
                <p className="mt-2 text-2xl font-bold">98.4%</p>
                <p className="text-sm text-white/65">On-time handoff confidence across current shift.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-4 rounded-2xl flex flex-col xl:flex-row gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 rounded-t-2xl" />
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search transfer ID, lane, owner, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "in-transit", "completed"] as const).map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${statusFilter === status ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-slate-50 text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"}`}
              >
                {status === "all" ? "All" : status === "in-transit" ? "In Transit" : statusMeta[status].label}
              </motion.button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "standard", "priority", "critical"] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${priorityFilter === priority ? "bg-slate-900 text-white border-slate-900" : "bg-white text-[var(--text-secondary)] border-[var(--glass-border)] hover:bg-[var(--hover-bg)]"}`}
              >
                {priority === "all" ? "All Priority" : priority}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent-indigo)]" />
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading live transfers...</p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <ArrowLeftRight className="h-7 w-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">No transfers match these filters</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Change the status or priority filters to view more movement activity.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr className="bg-slate-50/70">
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Transfer</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Lane</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Manifest</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Ops Signals</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Progress</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((transfer, index) => {
                    const status = statusMeta[transfer.status];
                    const priority = priorityMeta[transfer.priority];

                    return (
                      <motion.tr
                        key={transfer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.04 }}
                        className="border-b border-slate-100 hover:bg-indigo-50/40 transition-colors align-top"
                      >
                        <td className="py-5 px-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[var(--accent-indigo)]">{transfer.id}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priority.chip} ${priority.text}`}>{transfer.priority}</span>
                            </div>
                            <p className="mt-2 text-sm text-[var(--text-primary)] font-medium">{transfer.initiatedBy}</p>
                            <p className="text-xs text-[var(--text-muted)]">{transfer.date}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-xl bg-slate-100 p-2 text-slate-600">
                              <Warehouse className="h-4 w-4" />
                            </div>
                            <div className="space-y-3 min-w-[220px]">
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{transfer.from}</p>
                                <p className="text-xs text-[var(--text-muted)]">Rack {transfer.fromRack}</p>
                              </div>
                              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <ArrowRight className="h-4 w-4 text-[var(--accent-indigo)]" />
                                <span className="text-xs uppercase tracking-[0.18em]">{transfer.mode}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{transfer.to}</p>
                                <p className="text-xs text-[var(--text-muted)]">Rack {transfer.toRack}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
                              <Package className="h-4 w-4 text-[var(--accent-indigo)]" />
                              {transfer.items} SKUs
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{transfer.totalQty} units</p>
                            <p className="text-xs text-[var(--text-muted)]">Variance {transfer.variance}</p>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="space-y-3 min-w-[190px]">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
                            <div className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                              <Truck className="h-4 w-4 text-[var(--text-muted)]" />
                              {transfer.vehicle}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <Clock className="h-4 w-4" />
                              {transfer.etaHours === 0 ? "Delivered" : `${transfer.etaHours}h ETA`}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              {transfer.requiresScan ? <ScanLine className="h-4 w-4 text-emerald-600" /> : <ShieldCheck className="h-4 w-4 text-slate-500" />}
                              {transfer.requiresScan ? "Scan enforced" : "Manual confirmation"}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="min-w-[180px]">
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Movement</span>
                              <span className="font-semibold text-[var(--text-primary)]">{transfer.progress}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${transfer.progress}%` }}
                                transition={{ delay: 0.55 + index * 0.04, duration: 0.7 }}
                                className={`h-full rounded-full bg-gradient-to-r ${status.tone}`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                setShowModal(false);
                                setSelectedTransfer(transfer);
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            {transfer.status === "in-transit" && (
                              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => void handleCompleteTransfer(transfer)} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">
                                <Check className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <TransferModal isOpen={showModal} onClose={() => setShowModal(false)} warehouses={warehouseOptions} products={productOptions} onCreated={(message) => void handleCreated(message)} />
      <TransferDrawer transfer={selectedTransfer} onClose={() => setSelectedTransfer(null)} onComplete={(transfer) => void handleCompleteTransfer(transfer)} completing={completingId === selectedTransfer?.backendId} />
    </>
  );
}
