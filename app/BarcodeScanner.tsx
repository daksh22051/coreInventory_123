"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Zap, AlertCircle, ScanLine, RotateCw, Search, Package } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
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

interface ScanResult {
  code: string;
  format: string;
  product?: {
    _id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
    category: string;
  };
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (result: ScanResult) => void;
  mode?: "lookup" | "receipt";
}

export default function BarcodeScanner({ isOpen, onClose, onScan, mode = "lookup" }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
      if (scanner?.stop) {
        await scanner.stop();
      }
      if (scanner?.clear) {
        scanner.clear();
      }
    } catch {}
    html5QrCodeRef.current = null;
    setScanning(false);
  }, []);

  const lookupProduct = useCallback(async (code: string): Promise<ScanResult> => {
    const result: ScanResult = { code, format: "CODE128" };

    try {
      setLookingUp(true);
      // Search products directly by SKU or barcode
      const res = await fetch(`${API_BASE}/api/products?search=${encodeURIComponent(code)}&limit=5`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const products = data.data || data.products || [];
        // Find exact SKU match first, then partial match
        const exact = products.find((p: { sku?: string; barcode?: string }) =>
          p.sku?.toUpperCase() === code.toUpperCase() || p.barcode === code
        );
        const found = exact || products[0];
        if (found) {
          result.product = {
            _id: found._id || found.id,
            name: found.name,
            sku: found.sku || code,
            stock: found.stockQuantity ?? found.stock ?? 0,
            price: found.price || 0,
            category: found.category || "",
          };
        }
      }
    } catch {} finally {
      setLookingUp(false);
    }

    return result;
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setLastResult(null);

    try {
      const html5QrcodeModule = await import("html5-qrcode");
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5QrcodeModule;
      const scannerId = "barcode-scanner-region";

      // Wait for DOM element
      await new Promise(resolve => setTimeout(resolve, 100));
      const el = document.getElementById(scannerId);
      if (!el) {
        setError("Scanner element not found");
        return;
      }

      // Support all common barcode formats
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      const html5QrCode = new Html5Qrcode(scannerId, { formatsToSupport, verbose: false });
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 350, height: 120 },
          aspectRatio: 1.5,
          disableFlip: false,
        },
        async (decodedText: string) => {
          // Success — stop scanning and lookup
          await html5QrCode.stop();
          html5QrCodeRef.current = null;
          setScanning(false);

          const result = await lookupProduct(decodedText);
          setLastResult(result);
          onScan?.(result);
        },
        () => {
          // Scan failure (no code detected this frame) — ignore
        }
      );

      setScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Camera access denied";
      if (message.includes("NotAllowed") || message.includes("Permission")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (message.includes("NotFound")) {
        setError("No camera found. Please connect a camera or use manual entry.");
      } else {
        setError(`Scanner error: ${message}`);
      }
    }
  }, [lookupProduct, onScan]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setLastResult(null);
      setManualCode("");
      setError(null);
    }
  }, [isOpen, stopScanner]);

  const handleManualLookup = async () => {
    if (!manualCode.trim()) return;
    const result = await lookupProduct(manualCode.trim());
    setLastResult(result);
    onScan?.(result);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
              bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)]
              rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]
              bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                  border border-indigo-500/30">
                  <ScanLine size={18} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Barcode Scanner</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {mode === "receipt" ? "Scan to add items to receipt" : "Scan to lookup products"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]
                  hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scanner Area */}
            <div className="p-5 space-y-4">
              {/* Camera Scanner */}
              <div ref={scannerRef} className="relative">
                <div
                  id="barcode-scanner-region"
                  className="w-full rounded-xl overflow-hidden bg-slate-900 min-h-[200px]"
                />

                {!scanning && !lastResult && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3
                    bg-slate-900/80 rounded-xl">
                    <Camera size={40} className="text-slate-500" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startScanner}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                        bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                        text-sm font-medium shadow-lg shadow-indigo-500/25"
                    >
                      <Zap size={14} />
                      Start Camera
                    </motion.button>
                  </div>
                )}

                {scanning && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2
                    px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                    Scanning...
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Manual Entry */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                    placeholder="Enter barcode or SKU manually..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--hover-bg)] border border-[var(--glass-border)]
                      text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm
                      focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualLookup}
                  disabled={!manualCode.trim() || lookingUp}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                    hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                >
                  {lookingUp ? <RotateCw size={14} className="animate-spin" /> : "Lookup"}
                </motion.button>
              </div>

              {/* Scan Result */}
              <AnimatePresence>
                {lastResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-xl border border-[var(--glass-border)] overflow-hidden"
                  >
                    <div className="p-3 bg-emerald-500/10 border-b border-[var(--glass-border)]
                      flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm font-medium text-emerald-500">
                        Code: {lastResult.code}
                      </span>
                    </div>

                    {lastResult.product ? (
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500
                            flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Package size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">{lastResult.product.name}</p>
                            <p className="text-xs text-[var(--text-muted)] font-mono">{lastResult.product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[var(--text-primary)]">${lastResult.product.price.toFixed(2)}</p>
                            <p className="text-xs text-[var(--text-muted)]">{lastResult.product.stock} in stock</p>
                          </div>
                        </div>

                        {mode === "receipt" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { onScan?.(lastResult); onClose(); }}
                            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600
                              text-white text-sm font-medium shadow-lg shadow-emerald-500/25"
                          >
                            Add to Receipt
                          </motion.button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-[var(--text-muted)]">Product not found in inventory</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Barcode: {lastResult.code}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan Again */}
              {lastResult && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setLastResult(null); startScanner(); }}
                  className="w-full py-2.5 rounded-xl border border-[var(--glass-border)]
                    text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <RotateCw size={14} className="inline mr-2" />
                  Scan Another
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
