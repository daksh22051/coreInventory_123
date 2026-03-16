"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
  Table,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

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

interface ParsedRow {
  data: Record<string, string>;
  errors: string[];
  rowNumber: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

const REQUIRED_FIELDS = ["name", "sku"];
const OPTIONAL_FIELDS = ["price", "category", "stockQuantity", "description", "lowStockThreshold", "unitOfMeasure"];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const SAMPLE_CSV = `name,sku,price,category,stockQuantity,description
"Product Example 1",SKU-001,999,Electronics,100,"Sample product description"
"Product Example 2",SKU-002,1499,Clothing,50,"Another sample product"
"Product Example 3",SKU-003,299,Hardware,200,"Third sample product"`;

export default function CSVImportExport({
  isOpen,
  onClose,
  onImportSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}) {
  const [mode, setMode] = useState<"import" | "export">("import");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [exportOptions, setExportOptions] = useState({
    includeStock: true,
    includeCategory: true,
    includePrice: true,
    format: "csv" as "csv" | "json",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setStep("upload");
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());

    // Validate headers
    const missingRequired = REQUIRED_FIELDS.filter(f => !headers.includes(f));
    if (missingRequired.length > 0) {
      return [{
        data: {},
        errors: [`Missing required columns: ${missingRequired.join(", ")}`],
        rowNumber: 0,
      }];
    }

    // Parse rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Map to object
      const data: Record<string, string> = {};
      const errors: string[] = [];

      headers.forEach((header, idx) => {
        const value = values[idx]?.replace(/^"|"$/g, "") || "";
        data[header] = value;
      });

      // Validate required fields
      if (!data.name?.trim()) errors.push("Name is required");
      if (!data.sku?.trim()) errors.push("SKU is required");

      // Validate numeric fields
      if (data.price && isNaN(parseFloat(data.price))) {
        errors.push("Price must be a number");
      }
      if (data.stockquantity && isNaN(parseInt(data.stockquantity))) {
        errors.push("Stock quantity must be a number");
      }

      rows.push({ data, errors, rowNumber: i + 1 });
    }

    return rows;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setStep("preview");
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv")) {
      setFile(droppedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);
        setStep("preview");
      };
      reader.readAsText(droppedFile);
    }
  }, []);

  const handleImport = async () => {
    setImporting(true);
    const validRows = parsedData.filter(row => row.errors.length === 0);
    
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const row of validRows) {
      try {
        const payload = {
          name: row.data.name,
          sku: row.data.sku,
          price: row.data.price ? parseFloat(row.data.price) : 0,
          category: row.data.category || "General",
          stockQuantity: row.data.stockquantity ? parseInt(row.data.stockquantity) : 0,
          description: row.data.description || "",
        };

        const res = await fetch(`${API_BASE}/api/products`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success || res.ok) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({ row: row.rowNumber, message: data.message || "Failed to create" });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ row: row.rowNumber, message: "Network error" });
      }
    }

    // Count already failed rows
    const invalidRows = parsedData.filter(row => row.errors.length > 0);
    result.failed += invalidRows.length;
    invalidRows.forEach(row => {
      result.errors.push({ row: row.rowNumber, message: row.errors.join(", ") });
    });

    setImportResult(result);
    setStep("result");
    setImporting(false);
    
    if (result.success > 0 && onImportSuccess) {
      onImportSuccess();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=10000`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      const products = data.data || [];

      if (exportOptions.format === "csv") {
        // Build CSV
        const headers = ["name", "sku"];
        if (exportOptions.includePrice) headers.push("price");
        if (exportOptions.includeCategory) headers.push("category");
        if (exportOptions.includeStock) headers.push("stockQuantity");
        headers.push("description");

        const rows = products.map((p: Record<string, unknown>) => {
          const row: string[] = [
            `"${(p.name as string || "").replace(/"/g, '""')}"`,
            p.sku as string || "",
          ];
          if (exportOptions.includePrice) row.push(String(p.price || 0));
          if (exportOptions.includeCategory) row.push(`"${(p.category as string || "").replace(/"/g, '""')}"`);
          if (exportOptions.includeStock) row.push(String(p.stockQuantity || 0));
          row.push(`"${(p.description as string || "").replace(/"/g, '""')}"`);
          return row.join(",");
        });

        const csv = [headers.join(","), ...rows].join("\n");
        downloadFile(csv, "products_export.csv", "text/csv");
      } else {
        // JSON export
        const json = JSON.stringify(products, null, 2);
        downloadFile(json, "products_export.json", "application/json");
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSampleCSV = () => {
    downloadFile(SAMPLE_CSV, "sample_products.csv", "text/csv");
  };

  if (!isOpen) return null;

  const validCount = parsedData.filter(r => r.errors.length === 0).length;
  const invalidCount = parsedData.filter(r => r.errors.length > 0).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl max-h-[85vh] bg-[var(--card-bg)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--glass-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">CSV Import / Export</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Bulk manage your products</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { resetState(); onClose(); }}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Mode Toggle */}
            <div className="flex mt-4 bg-[var(--hover-bg)] rounded-xl p-1">
              <button
                onClick={() => { setMode("import"); resetState(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  mode === "import" 
                    ? "bg-[var(--card-bg)] shadow text-[var(--text-primary)]" 
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => { setMode("export"); resetState(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  mode === "export" 
                    ? "bg-[var(--card-bg)] shadow text-[var(--text-primary)]" 
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mode === "import" ? (
              <>
                {step === "upload" && (
                  <div className="space-y-6">
                    {/* Drop Zone */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[var(--glass-border)] rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-500/5 transition-all"
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                      <p className="text-[var(--text-primary)] font-medium mb-1">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Format Info */}
                    <div className="bg-[var(--hover-bg)] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)] mb-2">CSV Format Requirements</p>
                          <div className="text-sm text-[var(--text-secondary)] space-y-1">
                            <p><strong>Required:</strong> name, sku</p>
                            <p><strong>Optional:</strong> price, category, stockQuantity, description</p>
                          </div>
                          <button
                            onClick={downloadSampleCSV}
                            className="mt-3 flex items-center gap-2 text-sm text-emerald-500 hover:underline"
                          >
                            <Download className="w-4 h-4" />
                            Download sample CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === "preview" && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600">{validCount} valid</span>
                      </div>
                      {invalidCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">{invalidCount} invalid</span>
                        </div>
                      )}
                      <span className="text-sm text-[var(--text-muted)]">
                        from {file?.name}
                      </span>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-[var(--glass-border)] rounded-xl overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[var(--hover-bg)] sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">#</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">SKU</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">Price</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedData.slice(0, 50).map((row, idx) => (
                              <tr key={idx} className={`border-t border-[var(--glass-border)] ${row.errors.length > 0 ? "bg-red-500/5" : ""}`}>
                                <td className="px-3 py-2 text-[var(--text-muted)]">{row.rowNumber}</td>
                                <td className="px-3 py-2 text-[var(--text-primary)]">{row.data.name || "-"}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">{row.data.sku || "-"}</td>
                                <td className="px-3 py-2 text-[var(--text-secondary)]">₹{row.data.price || "0"}</td>
                                <td className="px-3 py-2">
                                  {row.errors.length > 0 ? (
                                    <span className="text-xs text-red-500">{row.errors[0]}</span>
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {parsedData.length > 50 && (
                      <p className="text-sm text-[var(--text-muted)] text-center">
                        Showing first 50 rows of {parsedData.length}
                      </p>
                    )}
                  </div>
                )}

                {step === "result" && importResult && (
                  <div className="text-center space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                      importResult.success > 0 ? "bg-emerald-100" : "bg-red-100"
                    }`}>
                      {importResult.success > 0 ? (
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                      ) : (
                        <XCircle className="w-10 h-10 text-red-500" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">Import Complete</h3>
                      <p className="text-[var(--text-secondary)] mt-1">
                        {importResult.success} products imported successfully
                      </p>
                    </div>

                    <div className="flex justify-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-500">{importResult.success}</p>
                        <p className="text-sm text-[var(--text-muted)]">Success</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-500">{importResult.failed}</p>
                        <p className="text-sm text-[var(--text-muted)]">Failed</p>
                      </div>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="text-left bg-red-500/10 rounded-xl p-4 max-h-40 overflow-y-auto">
                        <p className="font-medium text-red-600 mb-2">Errors:</p>
                        {importResult.errors.slice(0, 10).map((err, idx) => (
                          <p key={idx} className="text-sm text-red-500">
                            Row {err.row}: {err.message}
                          </p>
                        ))}
                        {importResult.errors.length > 10 && (
                          <p className="text-sm text-red-400 mt-2">
                            +{importResult.errors.length - 10} more errors...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Export Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Format</label>
                    <select
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as "csv" | "json" })}
                      className="w-full px-4 py-2.5 bg-[var(--hover-bg)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)]"
                    >
                      <option value="csv">CSV (.csv)</option>
                      <option value="json">JSON (.json)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">Include Fields</label>
                  <div className="space-y-2">
                    {[
                      { key: "includePrice", label: "Price" },
                      { key: "includeCategory", label: "Category" },
                      { key: "includeStock", label: "Stock Quantity" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions[key as keyof typeof exportOptions] as boolean}
                          onChange={(e) => setExportOptions({ ...exportOptions, [key]: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-[var(--text-primary)]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--hover-bg)] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Export Preview</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Will export all products with selected fields in {exportOptions.format.toUpperCase()} format
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--glass-border)] flex justify-end gap-3">
            {mode === "import" && step === "preview" && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetState}
                  className="px-5 py-2.5 border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] font-medium"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium shadow-lg disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {validCount} Products
                </motion.button>
              </>
            )}

            {mode === "import" && step === "result" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { resetState(); onClose(); }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium"
              >
                Done
              </motion.button>
            )}

            {mode === "export" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-medium shadow-lg disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Products
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
