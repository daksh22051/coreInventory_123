"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Barcode, Copy, Printer, Download, Check, X } from "lucide-react";

interface BarcodeGeneratorProps {
  value: string;
  productName?: string;
  format?: string;
  width?: number;
  height?: number;
  onClose?: () => void;
  showModal?: boolean;
}

export default function BarcodeGenerator({
  value,
  productName,
  format = "CODE128",
  width = 2,
  height = 80,
  onClose,
  showModal = false,
}: BarcodeGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!value || !svgRef.current) return;

    // Dynamically import JsBarcode to avoid SSR issues
    import("jsbarcode")
      .then((JsBarcode) => {
        try {
          JsBarcode.default(svgRef.current, value, {
            format,
            width,
            height,
            displayValue: true,
            fontSize: 14,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000",
            font: "monospace",
            textMargin: 6,
          });
          setLoaded(true);
        } catch {
          // If format fails, try CODE128 as fallback
          try {
            JsBarcode.default(svgRef.current, value, {
              format: "CODE128",
              width,
              height,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              background: "#ffffff",
              lineColor: "#000000",
              font: "monospace",
              textMargin: 6,
            });
            setLoaded(true);
          } catch {
            setLoaded(false);
          }
        }
      })
      .catch(() => setLoaded(false));
  }, [value, format, width, height]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${productName || value}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: sans-serif; }
            h3 { margin: 0 0 8px 0; font-size: 14px; color: #374151; }
            p { margin: 0; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          ${productName ? `<h3>${productName}</h3>` : ""}
          ${svgData}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPNG = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const a = document.createElement("a");
      a.download = `barcode-${value}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const barcodeContent = (
    <div className="flex flex-col items-center gap-3">
      {productName && (
        <p className="text-sm font-semibold text-[var(--text-primary)]">{productName}</p>
      )}

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <svg ref={svgRef} />
        {!loaded && value && (
          <div className="text-center py-4 text-sm text-[var(--text-muted)]">
            Generating barcode...
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            bg-[var(--hover-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] hover:border-[var(--glass-border-hover)] transition-all"
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            bg-[var(--hover-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] hover:border-[var(--glass-border-hover)] transition-all"
        >
          <Printer size={12} />
          Print
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadPNG}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            bg-[var(--hover-bg)] border border-[var(--glass-border)] text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] hover:border-[var(--glass-border-hover)] transition-all"
        >
          <Download size={12} />
          PNG
        </motion.button>
      </div>
    </div>
  );

  // Modal mode
  if (showModal && onClose) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)]
            rounded-2xl shadow-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Barcode size={16} className="text-indigo-500" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">Product Barcode</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]
                hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {barcodeContent}
        </motion.div>
      </>
    );
  }

  // Inline mode
  return barcodeContent;
}

// Small inline barcode (for product cards/rows)
export function InlineBarcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!value || !svgRef.current) return;
    import("jsbarcode")
      .then((JsBarcode) => {
        try {
          JsBarcode.default(svgRef.current, value, {
            format: "CODE128",
            width: 1,
            height: 30,
            displayValue: false,
            margin: 2,
            background: "#ffffff",
            lineColor: "#000000",
          });
        } catch {}
      })
      .catch(() => {});
  }, [value]);

  return <svg ref={svgRef} className="max-w-[100px]" />;
}
