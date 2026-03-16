"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, FileSpreadsheet, ChevronDown, Check, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) {
          headers.Authorization = "Bearer " + parsed.state.token;
        }
      } catch {}
    }
  }
  return headers;
}

type ExportType = "inventory" | "receipts" | "deliveries" | "stock-report" | "activity-logs";
type FileFormat = "csv" | "excel";

interface ExportButtonProps {
  type: ExportType;
  label?: string;
  className?: string;
}

export default function ExportButton({ type, label = "Export", className = "" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: FileFormat) => {
    setLoading(true);
    setIsOpen(false);
    try {
      const res = await fetch(`${API_BASE}/api/export/${type}?format=${format}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "excel" ? "xlsx" : "csv";
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => loading ? null : setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--glass-border)]
          bg-[var(--card-bg)] hover:border-[var(--glass-border-hover)] text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-all duration-200 text-sm font-medium"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : success ? (
          <Check size={16} className="text-emerald-500" />
        ) : (
          <Download size={16} />
        )}
        <span>{success ? "Downloaded!" : label}</span>
        {!loading && !success && <ChevronDown size={14} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 z-50
              bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)]
              rounded-xl shadow-2xl shadow-black/20 overflow-hidden"
          >
            <button
              onClick={() => handleExport("csv")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]
                hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors"
            >
              <FileText size={16} className="text-emerald-500" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]
                hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors
                border-t border-[var(--glass-border)]"
            >
              <FileSpreadsheet size={16} className="text-blue-500" />
              Export Excel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
