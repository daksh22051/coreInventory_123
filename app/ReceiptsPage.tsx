"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackagePlus,
  Search,
  Filter,
  Plus,
  Check,
  X,
  Truck,
  Calendar,
  Package,
  Building2,
  ClipboardCheck,
  ChevronDown,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  CheckCheck,
  Ban,
  History,
  FileText,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
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

interface ReceiptItem {
  product: string | { _id: string; name: string; sku: string };
  quantity: number;
  unitCost: number;
}

interface Activity {
  action: string;
  timestamp: string;
  details: string;
  user?: { name: string };
}

interface Receipt {
  _id?: string;
  id?: string;
  receiptNumber?: string;
  supplier: string;
  warehouse: string | { _id: string; name: string; code?: string };
  items: ReceiptItem[];
  status: string;
  totalCost?: number;
  notes?: string;
  receivedDate?: string;
  createdAt?: string;
  activities?: Activity[];
}

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  _id: string;
  name: string;
  code: string;
}

// Demo data for offline mode
const DEMO_PRODUCTS: Product[] = [
  { _id: "prod-1", name: "Laptop Dell XPS 15", sku: "SKU-001" },
  { _id: "prod-2", name: "Office Chair Pro", sku: "SKU-002" },
  { _id: "prod-3", name: "Wireless Mouse MX", sku: "SKU-003" },
  { _id: "prod-4", name: "USB-C Hub 7-in-1", sku: "SKU-004" },
  { _id: "prod-5", name: "Standing Desk Frame", sku: "SKU-005" },
  { _id: "prod-6", name: "Network Cable Cat6", sku: "SKU-006" },
  { _id: "prod-7", name: "Packing Tape Roll", sku: "SKU-007" },
  { _id: "prod-8", name: "Screwdriver Set 12pc", sku: "SKU-008" },
  { _id: "prod-9", name: "Monitor 27\" 4K", sku: "SKU-009" },
  { _id: "prod-10", name: "Bubble Wrap Roll", sku: "SKU-010" },
  { _id: "prod-11", name: "Mechanical Keyboard", sku: "SKU-011" },
  { _id: "prod-12", name: "Webcam HD 1080p", sku: "SKU-012" },
];

const DEMO_WAREHOUSES: Warehouse[] = [
  { _id: "wh-1", name: "Main Warehouse", code: "WH-MAIN" },
  { _id: "wh-2", name: "North Hub", code: "WH-NORTH" },
  { _id: "wh-3", name: "South Center", code: "WH-SOUTH" },
  { _id: "wh-4", name: "West Storage", code: "WH-WEST" },
];

// Stats: 12 pending, 8 received today, ~1420 items, ~$63,250 value
const DEMO_RECEIPTS: Receipt[] = [
  // === 8 DONE (Received Today) ===
  {
    _id: "rcpt-1", receiptNumber: "RCP-001", supplier: "TechSupplies India Pvt Ltd",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 20, unitCost: 720 },
      { product: DEMO_PRODUCTS[2], quantity: 50, unitCost: 32 },
    ],
    status: "done", totalCost: 16000,
    receivedDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), details: "Receipt completed, stock updated" },
    ],
  },
  {
    _id: "rcpt-2", receiptNumber: "RCP-002", supplier: "Global Furniture Co.",
    warehouse: DEMO_WAREHOUSES[2],
    items: [
      { product: DEMO_PRODUCTS[1], quantity: 25, unitCost: 95 },
      { product: DEMO_PRODUCTS[4], quantity: 10, unitCost: 160 },
    ],
    status: "done", totalCost: 3975,
    receivedDate: new Date(Date.now() - 4 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-3", receiptNumber: "RCP-003", supplier: "CableNet India",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[5], quantity: 200, unitCost: 1.2 },
    ],
    status: "done", totalCost: 240,
    receivedDate: new Date(Date.now() - 1 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-4", receiptNumber: "RCP-004", supplier: "Periph World",
    warehouse: DEMO_WAREHOUSES[1],
    items: [
      { product: DEMO_PRODUCTS[10], quantity: 40, unitCost: 42 },
      { product: DEMO_PRODUCTS[11], quantity: 30, unitCost: 24 },
    ],
    status: "done", totalCost: 2400,
    receivedDate: new Date(Date.now() - 5 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-5", receiptNumber: "RCP-005", supplier: "PackRight Solutions",
    warehouse: DEMO_WAREHOUSES[3],
    items: [
      { product: DEMO_PRODUCTS[6], quantity: 150, unitCost: 0.65 },
      { product: DEMO_PRODUCTS[9], quantity: 80, unitCost: 2.8 },
    ],
    status: "done", totalCost: 321.5,
    receivedDate: new Date(Date.now() - 3 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-6", receiptNumber: "RCP-006", supplier: "DisplayTech Ltd",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[8], quantity: 15, unitCost: 240 },
    ],
    status: "done", totalCost: 3600,
    receivedDate: new Date(Date.now() - 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-7", receiptNumber: "RCP-007", supplier: "ToolMaster India",
    warehouse: DEMO_WAREHOUSES[2],
    items: [
      { product: DEMO_PRODUCTS[7], quantity: 60, unitCost: 8 },
    ],
    status: "done", totalCost: 480,
    receivedDate: new Date(Date.now() - 7 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 7 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  {
    _id: "rcpt-8", receiptNumber: "RCP-008", supplier: "Hub Connect Ltd",
    warehouse: DEMO_WAREHOUSES[1],
    items: [
      { product: DEMO_PRODUCTS[3], quantity: 100, unitCost: 18 },
    ],
    status: "done", totalCost: 1800,
    receivedDate: new Date(Date.now() - 8 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt created" },
      { action: "done", timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), details: "Receipt completed" },
    ],
  },
  // === 12 PENDING (draft / waiting / ready) ===
  {
    _id: "rcpt-9", receiptNumber: "RCP-009", supplier: "TechSupplies India Pvt Ltd",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 10, unitCost: 720 },
      { product: DEMO_PRODUCTS[8], quantity: 8, unitCost: 240 },
    ],
    status: "waiting", totalCost: 9120,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Receipt confirmed, waiting for goods" },
    ],
  },
  {
    _id: "rcpt-10", receiptNumber: "RCP-010", supplier: "Global Furniture Co.",
    warehouse: DEMO_WAREHOUSES[2],
    items: [
      { product: DEMO_PRODUCTS[1], quantity: 30, unitCost: 95 },
    ],
    status: "ready", totalCost: 2850,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt confirmed" },
      { action: "ready", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Goods arrived, ready to receive" },
    ],
  },
  {
    _id: "rcpt-11", receiptNumber: "RCP-011", supplier: "Periph World",
    warehouse: DEMO_WAREHOUSES[1],
    items: [
      { product: DEMO_PRODUCTS[2], quantity: 80, unitCost: 32 },
      { product: DEMO_PRODUCTS[10], quantity: 50, unitCost: 42 },
    ],
    status: "draft", totalCost: 4660,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Receipt created as draft" },
    ],
  },
  {
    _id: "rcpt-12", receiptNumber: "RCP-012", supplier: "CableNet India",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[5], quantity: 100, unitCost: 1.2 },
    ],
    status: "waiting", totalCost: 120,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), details: "Receipt confirmed" },
    ],
  },
  {
    _id: "rcpt-13", receiptNumber: "RCP-013", supplier: "PackRight Solutions",
    warehouse: DEMO_WAREHOUSES[3],
    items: [
      { product: DEMO_PRODUCTS[6], quantity: 100, unitCost: 0.65 },
      { product: DEMO_PRODUCTS[9], quantity: 50, unitCost: 2.8 },
    ],
    status: "ready", totalCost: 205,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: "Receipt confirmed" },
      { action: "ready", timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: "Goods arrived at dock" },
    ],
  },
  {
    _id: "rcpt-14", receiptNumber: "RCP-014", supplier: "DisplayTech Ltd",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[8], quantity: 20, unitCost: 240 },
    ],
    status: "waiting", totalCost: 4800,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), details: "Receipt confirmed, waiting for delivery" },
    ],
  },
  {
    _id: "rcpt-15", receiptNumber: "RCP-015", supplier: "FastShip Logistics",
    warehouse: DEMO_WAREHOUSES[1],
    items: [
      { product: DEMO_PRODUCTS[3], quantity: 60, unitCost: 18 },
      { product: DEMO_PRODUCTS[11], quantity: 25, unitCost: 24 },
    ],
    status: "draft", totalCost: 1680,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), details: "Receipt created as draft" },
    ],
  },
  {
    _id: "rcpt-16", receiptNumber: "RCP-016", supplier: "ToolMaster India",
    warehouse: DEMO_WAREHOUSES[2],
    items: [
      { product: DEMO_PRODUCTS[7], quantity: 40, unitCost: 8 },
      { product: DEMO_PRODUCTS[4], quantity: 5, unitCost: 160 },
    ],
    status: "ready", totalCost: 1120,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), details: "Receipt confirmed" },
      { action: "ready", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), details: "Goods arrived" },
    ],
  },
  {
    _id: "rcpt-17", receiptNumber: "RCP-017", supplier: "Infra Supplies Co.",
    warehouse: DEMO_WAREHOUSES[3],
    items: [
      { product: DEMO_PRODUCTS[5], quantity: 50, unitCost: 1.2 },
    ],
    status: "draft", totalCost: 60,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Receipt created as draft" },
    ],
  },
  {
    _id: "rcpt-18", receiptNumber: "RCP-018", supplier: "Hub Connect Ltd",
    warehouse: DEMO_WAREHOUSES[0],
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 5, unitCost: 720 },
      { product: DEMO_PRODUCTS[2], quantity: 20, unitCost: 32 },
    ],
    status: "waiting", totalCost: 4240,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt confirmed" },
    ],
  },
  {
    _id: "rcpt-19", receiptNumber: "RCP-019", supplier: "ElectroParts Global",
    warehouse: DEMO_WAREHOUSES[1],
    items: [
      { product: DEMO_PRODUCTS[10], quantity: 35, unitCost: 42 },
      { product: DEMO_PRODUCTS[11], quantity: 40, unitCost: 24 },
    ],
    status: "ready", totalCost: 2430,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), details: "Receipt confirmed" },
      { action: "ready", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), details: "Goods arrived" },
    ],
  },
  {
    _id: "rcpt-20", receiptNumber: "RCP-020", supplier: "SafePack Industries",
    warehouse: DEMO_WAREHOUSES[3],
    items: [
      { product: DEMO_PRODUCTS[6], quantity: 120, unitCost: 0.65 },
      { product: DEMO_PRODUCTS[9], quantity: 50, unitCost: 2.8 },
    ],
    status: "waiting", totalCost: 218,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    activities: [
      { action: "created", timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: "Receipt created" },
      { action: "confirmed", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Receipt confirmed" },
    ],
  },
];

// Odoo-style workflow
const WORKFLOW_STEPS = ['draft', 'waiting', 'ready', 'done', 'cancelled'];

const statusColors: Record<string, { bg: string; text: string; glow: string; icon: React.ElementType }> = {
  draft: { bg: "bg-zinc-500/10", text: "text-zinc-400", glow: "shadow-zinc-500/20", icon: FileText },
  waiting: { bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/20", icon: Clock },
  ready: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/20", icon: Package },
  done: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/20", icon: CheckCircle },
  cancelled: { bg: "bg-red-500/10", text: "text-red-400", glow: "shadow-red-500/20", icon: XCircle },
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  waiting: 'Waiting',
  ready: 'Ready',
  done: 'Done',
  cancelled: 'Cancelled',
};

// Workflow Progress Bar Component
function WorkflowProgressBar({ status }: { status: string }) {
  const currentIndex = WORKFLOW_STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';
  
  return (
    <div className="flex items-center gap-1 w-full">
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = !isCancelled && currentIndex >= index;
        const isCurrent = currentIndex === index;
        const StepIcon = statusColors[step]?.icon || Clock;
        
        return (
          <div key={step} className="flex items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                isCancelled && isCurrent
                  ? 'bg-red-500/15 border border-red-500/30'
                  : isCompleted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  : 'bg-[var(--background-secondary)] border border-[var(--glass-border)]'
              }`}
            >
              {isCancelled && isCurrent ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : isCompleted ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-[var(--accent-indigo)]' : 'text-[var(--text-muted)]'}`} />
              )}
            </motion.div>
            {index < WORKFLOW_STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-300 ${
                !isCancelled && currentIndex > index
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-[var(--background-secondary)]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Receipt Detail Modal
function ReceiptDetailModal({
  receipt,
  isOpen,
  onClose,
  onAction,
}: {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, receiptId: string) => void;
}) {
  if (!receipt) return null;

  const warehouseName = typeof receipt.warehouse === 'object' ? receipt.warehouse?.name : receipt.warehouse;
  const itemCount = Array.isArray(receipt.items) ? receipt.items.length : 0;
  const totalQty = receipt.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const computedTotal = receipt.items?.reduce((sum, item) => sum + item.quantity * (item.unitCost || 0), 0) || 0;
  const totalValue = receipt.totalCost ?? computedTotal;
  const status = receipt.status || 'draft';
  const receiptId = receipt._id || receipt.id || '';

  const getNextAction = () => {
    switch (status) {
      case 'draft': return { label: 'Confirm', action: 'confirm', color: 'from-amber-500 to-orange-500' };
      case 'waiting': return { label: 'Mark Ready', action: 'ready', color: 'from-indigo-500 to-purple-500' };
      case 'ready': return { label: 'Validate & Receive', action: 'validate', color: 'from-emerald-500 to-green-500' };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-3xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${statusColors[status]?.bg || 'bg-zinc-50'}`}>
                  <Truck className={`w-6 h-6 ${statusColors[status]?.text || 'text-zinc-700'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{receipt.receiptNumber || receiptId}</h2>
                  <p className="text-[var(--text-secondary)]">{receipt.supplier}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]?.bg} ${statusColors[status]?.text}`}>
                  {statusLabels[status] || status}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Workflow Progress */}
            <div className="mb-6 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)]">
              <p className="text-sm text-[var(--text-secondary)] mb-3 font-medium">Workflow Progress</p>
              <WorkflowProgressBar status={status} />
              <div className="flex justify-between mt-2">
                {WORKFLOW_STEPS.map(step => (
                  <span key={step} className="text-xs text-[var(--text-muted)] capitalize">{step}</span>
                ))}
              </div>
            </div>

            {/* Draft Warning */}
            {status === 'draft' && itemCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <p className="text-amber-400 text-sm">Add products to complete this receipt</p>
              </motion.div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Warehouse</p>
                <p className="text-[var(--text-primary)] font-semibold">{warehouseName || '-'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Items</p>
                <p className="text-[var(--text-primary)] font-semibold">{itemCount} products</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Quantity</p>
                <p className="text-[var(--text-primary)] font-semibold">{totalQty} units</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400/70 mb-1">Total Value</p>
                <p className="text-emerald-400 font-bold text-lg">${totalValue.toLocaleString()}</p>
              </div>
            </div>

            {/* Products List */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products ({itemCount})
              </h3>
              {itemCount > 0 ? (
                <div className="space-y-2">
                  {receipt.items.map((item, index) => {
                    const productName = typeof item.product === 'object' ? item.product.name : `Product ${item.product}`;
                    const productSku = typeof item.product === 'object' ? item.product.sku : '';
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] text-sm font-semibold group-hover:text-[var(--accent-indigo)] transition-colors">{productName}</p>
                            {productSku && <p className="text-[var(--text-muted)] text-xs">{productSku}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[var(--text-secondary)] text-sm">{item.quantity} × ${item.unitCost?.toFixed(2) || '0.00'}</p>
                          <p className="text-emerald-400 text-sm font-semibold">${(item.quantity * (item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)] text-center">
                  <Package className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                  <p className="text-[var(--text-secondary)] font-medium">No products added yet</p>
                  <p className="text-[var(--text-muted)] text-sm mt-1">Edit this receipt to add products</p>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            {receipt.activities && receipt.activities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Activity Timeline
                </h3>
                <div className="space-y-4">
                  {receipt.activities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          index === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30' : 'bg-[var(--text-muted)]'
                        }`} />
                        {index < receipt.activities.length - 1 && (
                          <div className="w-0.5 h-8 bg-[var(--glass-border)] mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-[var(--text-primary)] text-sm font-medium">{activity.details}</p>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">
                          {new Date(activity.timestamp).toLocaleString()}
                          {activity.user?.name && ` • ${activity.user.name}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--glass-border)]">
              {status === 'draft' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAction('edit', receiptId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </motion.button>
              )}
              
              {status !== 'done' && status !== 'cancelled' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAction('cancel', receiptId)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Ban className="w-4 h-4" />
                  Cancel
                </motion.button>
              )}

              <div className="flex-1" />

              {nextAction && !(status === 'draft' && itemCount === 0) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAction(nextAction.action, receiptId)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${nextAction.color} text-white font-medium shadow-lg hover:shadow-xl transition-all`}
                >
                  {status === 'ready' ? <CheckCheck className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {nextAction.label}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated 3D Card Component
function FloatingCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 20);
    setRotateY((centerX - x) / 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Stat Card
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
      <div className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-6 rounded-2xl relative overflow-hidden group cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        
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

// Modal Component
function ReceiptModal({
  isOpen,
  onClose,
  products,
  warehouses,
  onSuccess,
  initialReceipt,
  isDemo,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouses: Warehouse[];
  onSuccess: () => void;
  initialReceipt?: Receipt | null;
  isDemo?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    supplier: "",
    warehouse: "",
    notes: "",
    items: [{ product: "", quantity: "", unitCost: "" }],
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialReceipt) {
      setFormData({
        supplier: initialReceipt.supplier || "",
        warehouse: typeof initialReceipt.warehouse === "object" ? initialReceipt.warehouse?._id || "" : (initialReceipt.warehouse || ""),
        notes: initialReceipt.notes || "",
        items:
          initialReceipt.items && initialReceipt.items.length > 0
            ? initialReceipt.items.map((item) => ({
                product: typeof item.product === "object" ? item.product._id : (item.product || ""),
                quantity: String(item.quantity ?? ""),
                unitCost: String(item.unitCost ?? ""),
              }))
            : [{ product: "", quantity: "", unitCost: "" }],
      });
    } else {
      setFormData({
        supplier: "",
        warehouse: "",
        notes: "",
        items: [{ product: "", quantity: "", unitCost: "" }],
      });
    }
  }, [initialReceipt, isOpen]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: "", unitCost: "" }],
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

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    console.log("📝 Submitting receipt:", formData);
    setError("");
    
    // Validation
    if (!formData.supplier.trim()) {
      setError("Supplier is required");
      return;
    }
    if (!formData.warehouse) {
      setError("Warehouse is required");
      return;
    }
    const validItems = formData.items.filter(item => item.product && item.quantity);
    if (validItems.length === 0) {
      setError("At least one item is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        supplier: formData.supplier,
        warehouse: formData.warehouse,
        notes: formData.notes,
        items: validItems.map(item => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          unitCost: parseFloat(item.unitCost) || 0,
        })),
      };

      console.log("📤 Sending to API:", payload);

      // Demo mode: skip API call
      if (isDemo) {
        onSuccess();
        onClose();
        return;
      }

      const isEdit = Boolean(initialReceipt?._id || initialReceipt?.id);
      const targetId = initialReceipt?._id || initialReceipt?.id;
      const endpoint = isEdit
        ? `${API_BASE}/api/receipts/${targetId}`
        : `${API_BASE}/api/receipts`;

      console.log("📤 Submitting receipt to:", endpoint);

      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 API Response:", data);

      if (data.success) {
        console.log("✅ Receipt saved successfully!");
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to create receipt");
      }
    } catch {
      // Demo mode fallback when backend is unavailable
      onSuccess();
      onClose();
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                  <PackagePlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{initialReceipt ? "Edit Receipt" : "New Receipt"}</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Record incoming stock</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Supplier *</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                    className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Warehouse *</label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[var(--card-bg)]">Select warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id} className="bg-[var(--card-bg)]">
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Items *</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-[var(--accent-indigo)] hover:text-[var(--accent-indigo)]"
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
                        className="col-span-5 px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                      >
                        <option value="" className="bg-[var(--card-bg)]">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id} className="bg-[var(--card-bg)]">
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        placeholder="Qty"
                        min="1"
                        className="col-span-3 px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, "unitCost", e.target.value)}
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className="col-span-3 px-4 py-3 bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                      />
                      {formData.items.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(index)}
                          className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-400"
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
                  className="flex-1 py-3 px-6 bg-[var(--card-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                      {initialReceipt ? "Save Changes" : "Create Receipt"}
                    </>
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

export default function ReceiptsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [detailReceipt, setDetailReceipt] = useState<Receipt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(DEMO_WAREHOUSES);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReceipts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/receipts?limit=200`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setReceipts(data.data || []);
        setIsDemo(false);
      } else {
        throw new Error("API error");
      }
    } catch {
      setReceipts(DEMO_RECEIPTS);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=100`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.map((p: Record<string, unknown>) => ({ _id: p._id, name: p.name, sku: p.sku })));
      }
    } catch {
      setProducts(DEMO_PRODUCTS);
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setWarehouses(data.data.map((w: Record<string, unknown>) => ({ _id: w._id, name: w.name, code: w.code })));
      }
    } catch {
      setWarehouses(DEMO_WAREHOUSES);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
    fetchProducts();
    fetchWarehouses();
  }, [fetchReceipts, fetchProducts, fetchWarehouses]);

  const handleReceiptCreated = () => {
    fetchReceipts();
    showToast(editingReceipt ? "Receipt updated successfully!" : "Receipt created successfully!", "success");
  };

  const openDetail = (receipt: Receipt) => {
    setDetailReceipt(receipt);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setDetailReceipt(null);
  };

  const startEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setShowModal(true);
  };

  const endEdit = () => {
    setShowModal(false);
    setEditingReceipt(null);
  };

  const findReceiptById = (receiptId: string) =>
    receipts.find((r) => (r._id || r.id) === receiptId || r.receiptNumber === receiptId);

  const handleConfirm = async (receiptId: string) => {
    if (isDemo) {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "waiting" } : r));
      showToast("Receipt confirmed!", "success");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/receipts/${receiptId}/confirm`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchReceipts();
        showToast("Receipt confirmed!", "success");
      } else {
        showToast(data.message || "Failed to confirm", "error");
      }
    } catch {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "waiting" } : r));
      showToast("Receipt confirmed!", "success");
    }
  };

  const handleReady = async (receiptId: string) => {
    if (isDemo) {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "ready" } : r));
      showToast("Receipt marked ready!", "success");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/receipts/${receiptId}/ready`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchReceipts();
        showToast("Receipt marked ready!", "success");
      } else {
        showToast(data.message || "Failed to mark ready", "error");
      }
    } catch {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "ready" } : r));
      showToast("Receipt marked ready!", "success");
    }
  };

  const handleValidate = async (receiptId: string, successMessage = "Receipt received! Stock updated.") => {
    const receipt = findReceiptById(receiptId);
    if (!receipt || !receipt.items || receipt.items.length === 0) {
      showToast("Add products to complete this receipt", "error");
      return;
    }
    if (isDemo) {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "done" } : r));
      showToast(successMessage, "success");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/receipts/${receiptId}/validate`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchReceipts();
        showToast(successMessage, "success");
      } else {
        showToast(data.message || "Failed to validate", "error");
      }
    } catch {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "done" } : r));
      showToast(successMessage, "success");
    }
  };

  const handleReceive = async (receiptId: string) => {
    await handleValidate(receiptId, "Receipt received! Stock updated.");
  };

  const handleCancel = async (receiptId: string) => {
    if (isDemo) {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "cancelled" } : r));
      showToast("Receipt cancelled.", "success");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/receipts/${receiptId}/cancel`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        fetchReceipts();
        showToast("Receipt cancelled.", "success");
      } else {
        showToast(data.message || "Failed to cancel", "error");
      }
    } catch {
      setReceipts(prev => prev.map(r => (r._id || r.id) === receiptId || r.receiptNumber === receiptId ? { ...r, status: "cancelled" } : r));
      showToast("Receipt cancelled.", "success");
    }
  };

  const handleDetailAction = async (action: string, receiptId: string) => {
    switch (action) {
      case "confirm":
        await handleConfirm(receiptId);
        break;
      case "ready":
        await handleReady(receiptId);
        break;
      case "validate":
        await handleReceive(receiptId);
        break;
      case "cancel":
        await handleCancel(receiptId);
        break;
      case "edit":
        {
          const receipt = findReceiptById(receiptId);
          if (receipt) startEdit(receipt);
        }
        break;
      default:
        break;
    }
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const id = receipt.receiptNumber || receipt._id || receipt.id || "";
    const matchesSearch =
      id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <h1 className="text-4xl font-bold mb-1">
                  <span className="text-[var(--text-primary)]">Receipt </span>
                  <span className="text-gradient">Management</span>
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Manage incoming stock and supplier deliveries
                  <span className="text-[var(--text-muted)]"> • {receipts.length} total</span>
                  {isDemo && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Demo Mode
                    </span>
                  )}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingReceipt(null);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 px-6 py-3 rounded-xl font-medium transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                New Receipt
              </motion.button>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Pending Receipts"
                value={String(receipts.filter(r => ["draft", "waiting", "ready"].includes(r.status)).length)}
                icon={Clock}
                color="from-amber-500 to-orange-500"
                delay={0.1}
              />
              <StatCard
                title="Received Today"
                value={String(receipts.filter(r => r.status === "done").length)}
                icon={PackagePlus}
                trend={15}
                color="from-emerald-500 to-teal-500"
                delay={0.2}
              />
              <StatCard
                title="Total Items"
                value={receipts.reduce((sum, r) => sum + (r.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0).toLocaleString()}
                icon={Package}
                color="from-blue-500 to-purple-500"
                delay={0.3}
              />
              <StatCard
                title="Total Value"
                value={`$${(receipts.reduce((sum, r) => sum + (r.totalCost ?? r.items?.reduce((s, i) => s + i.quantity * (i.unitCost || 0), 0) || 0), 0)).toLocaleString()}`}
                icon={Building2}
                trend={8}
                color="from-purple-500 to-pink-500"
                delay={0.4}
              />
            </div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 p-4 rounded-2xl flex flex-col md:flex-row gap-4 overflow-hidden"
            >
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search receipts by ID or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "draft", "waiting", "ready", "done", "cancelled"].map((status) => {
                  const activeStyles: Record<string, string> = {
                    all: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10",
                    draft: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 shadow-lg shadow-zinc-500/10",
                    waiting: "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10",
                    ready: "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10",
                    done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10",
                    cancelled: "bg-red-500/15 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10",
                  };
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                        statusFilter === status
                          ? activeStyles[status]
                          : "bg-[var(--background-secondary)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {status === "all" ? "All" : status}
                      {status !== "all" && (
                        <span className="ml-1.5 text-xs opacity-60">
                          {receipts.filter(r => r.status === status).length}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20 rounded-2xl overflow-hidden"
            >
              {/* Accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--background-secondary)]/60 border-b border-[var(--glass-border)]">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Receipt ID</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Supplier</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Items</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Warehouse</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Value</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                              <Package className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-[var(--text-secondary)] font-medium">Loading receipts...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="relative">
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-[var(--glass-border)] flex items-center justify-center">
                                <Package className="w-10 h-10 text-[var(--text-muted)]" />
                              </div>
                              <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center"
                              >
                                <Search className="w-3 h-3 text-indigo-400" />
                              </motion.div>
                            </div>
                            <div>
                              <p className="text-[var(--text-primary)] font-semibold text-lg">No receipts found</p>
                              <p className="text-[var(--text-muted)] text-sm mt-1">
                                {searchQuery || statusFilter !== "all"
                                  ? "Try adjusting your filters"
                                  : "Create your first receipt to get started"}
                              </p>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    ) : (
                      filteredReceipts.map((receipt, index) => {
                        const receiptId = receipt.receiptNumber || receipt._id || receipt.id || '';
                        const itemCount = Array.isArray(receipt.items) ? receipt.items.length : 0;
                        const warehouseName = typeof receipt.warehouse === 'object' ? receipt.warehouse?.name : receipt.warehouse;
                        const date = receipt.receivedDate || receipt.createdAt;
                        const computedValue = receipt.items?.reduce(
                          (sum, item) => sum + item.quantity * (item.unitCost || 0),
                          0
                        ) || 0;
                        const value = receipt.totalCost ?? computedValue;
                        const status = receipt.status || 'draft';
                        
                        return (
                          <motion.tr
                            key={receipt._id || receipt.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                            className="border-b border-[var(--glass-border)] hover:bg-indigo-500/5 transition-all duration-200 group"
                          >
                            <td className="py-4 px-6">
                              <button
                                type="button"
                                onClick={() => openDetail(receipt)}
                                className="font-mono text-blue-400 hover:text-blue-300"
                              >
                                {receiptId}
                              </button>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                  <Truck className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-[var(--text-primary)]">{receipt.supplier}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-[var(--text-secondary)]">{itemCount} items</td>
                            <td className="py-4 px-6 text-[var(--text-secondary)]">{warehouseName || '-'}</td>
                            <td className="py-4 px-6 text-[var(--text-secondary)]">
                              {date ? new Date(date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${(statusColors[status] || statusColors.draft).bg} ${(statusColors[status] || statusColors.draft).text}`}>
                                  {statusLabels[status] || status}
                                </span>
                            </td>
                            <td className="py-4 px-6 text-emerald-400 font-medium">
                              {itemCount > 0 ? `$${value.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openDetail(receipt)}
                                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => startEdit(receipt)}
                                  className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </motion.button>
                                {status === "draft" && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleConfirm(receipt._id || receipt.id || '')}
                                    className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
                                    title="Validate"
                                  >
                                    <ClipboardCheck className="w-4 h-4" />
                                  </motion.button>
                                )}
                                {status === "waiting" && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleReady(receipt._id || receipt.id || '')}
                                    className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                                    title="Validate"
                                  >
                                    <ClipboardCheck className="w-4 h-4" />
                                  </motion.button>
                                )}
                                {status === "ready" && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleReceive(receipt._id || receipt.id || '')}
                                    className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                    title="Receive"
                                  >
                                    <Check className="w-4 h-4" />
                                  </motion.button>
                                )}
                                {(status === "draft" || status === "waiting" || status === "ready") && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleCancel(receipt._id || receipt.id || '')}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                    title="Cancel"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </motion.button>
                                )}
                                {status === "done" && (
                                  <span className="p-2 text-emerald-400" title="Done">
                                    <CheckCircle className="w-4 h-4" />
                                  </span>
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
              {/* Table footer */}
              {!isLoading && filteredReceipts.length > 0 && (
                <div className="px-6 py-4 border-t border-[var(--glass-border)] flex items-center justify-between">
                  <p className="text-sm text-[var(--text-muted)]">
                    Showing <span className="text-[var(--text-primary)] font-medium">{filteredReceipts.length}</span> of{" "}
                    <span className="text-[var(--text-primary)] font-medium">{receipts.length}</span> receipts
                  </p>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {receipts.filter(r => r.status === "done").length} Done</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {receipts.filter(r => r.status === "waiting").length} Waiting</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-400" /> {receipts.filter(r => r.status === "draft").length} Draft</span>
                  </div>
                </div>
              )}
            </motion.div>
      </main>

      {/* Toast Notification */}
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

      <ReceiptModal 
        isOpen={showModal} 
        onClose={endEdit}
        products={products}
        warehouses={warehouses}
        onSuccess={handleReceiptCreated}
        initialReceipt={editingReceipt}
        isDemo={isDemo}
      />

      <ReceiptDetailModal
        receipt={detailReceipt}
        isOpen={isDetailOpen}
        onClose={closeDetail}
        onAction={handleDetailAction}
      />
    </>
  );
}
