/**
 * Setup script for Receipts API routes.
 * Run: node setup-receipts-routes.js
 * Creates Next.js App Router API route files for receipt CRUD.
 */
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "app", "api", "receipts");
const idDir = path.join(base, "[id]");
const confirmDir = path.join(base, "[id]", "confirm");
const readyDir = path.join(base, "[id]", "ready");
const validateDir = path.join(base, "[id]", "validate");
const cancelDir = path.join(base, "[id]", "cancel");

// Create directories
[base, idDir, confirmDir, readyDir, validateDir, cancelDir].forEach((d) => {
  fs.mkdirSync(d, { recursive: true });
  console.log("Created:", d);
});

// ---- store.ts ----
fs.writeFileSync(
  path.join(base, "store.ts"),
  `export interface ReceiptItem {
  product: string;
  quantity: number;
  unitCost: number;
}

export interface Receipt {
  id: string;
  _id: string;
  receiptNumber: string;
  supplier: string;
  warehouse: string;
  notes: string;
  items: ReceiptItem[];
  status: "draft" | "confirmed" | "ready" | "done" | "cancelled";
  createdAt: string;
}

let nextNum = 4;

const receipts: Receipt[] = [
  {
    id: "r1", _id: "r1", receiptNumber: "REC-001", supplier: "TechParts Co.",
    warehouse: "Main Warehouse", notes: "Monthly restock",
    items: [
      { product: "Laptop Dell XPS 15", quantity: 10, unitCost: 1100 },
      { product: "Wireless Mouse MX", quantity: 50, unitCost: 55 },
    ],
    status: "done", createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "r2", _id: "r2", receiptNumber: "REC-002", supplier: "Office Supplies Ltd.",
    warehouse: "Secondary Warehouse", notes: "Furniture order",
    items: [
      { product: "Office Chair Pro", quantity: 20, unitCost: 210 },
    ],
    status: "confirmed", createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "r3", _id: "r3", receiptNumber: "REC-003", supplier: "PackagingWorld",
    warehouse: "Main Warehouse", notes: "Packing materials",
    items: [
      { product: "Packaging Tape", quantity: 200, unitCost: 8 },
      { product: "Cardboard Boxes Large", quantity: 100, unitCost: 2.5 },
    ],
    status: "draft", createdAt: new Date().toISOString(),
  },
];

export function getAll(): Receipt[] {
  return [...receipts];
}

export function getById(id: string): Receipt | undefined {
  return receipts.find((r) => r.id === id || r._id === id || r.receiptNumber === id);
}

export function create(data: { supplier: string; warehouse: string; notes: string; items: ReceiptItem[] }): Receipt {
  const id = "r" + Date.now();
  const receipt: Receipt = {
    id,
    _id: id,
    receiptNumber: "REC-" + String(nextNum++).padStart(3, "0"),
    supplier: data.supplier,
    warehouse: data.warehouse,
    notes: data.notes,
    items: data.items,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  receipts.push(receipt);
  return receipt;
}

export function update(id: string, data: Partial<Receipt>): Receipt | null {
  const idx = receipts.findIndex((r) => r.id === id || r._id === id);
  if (idx === -1) return null;
  receipts[idx] = { ...receipts[idx], ...data };
  return { ...receipts[idx] };
}

export function setStatus(id: string, status: Receipt["status"]): Receipt | null {
  const idx = receipts.findIndex((r) => r.id === id || r._id === id || r.receiptNumber === id);
  if (idx === -1) return null;
  receipts[idx].status = status;
  return { ...receipts[idx] };
}
`
);
console.log("Created: store.ts");

// ---- route.ts (GET + POST) ----
fs.writeFileSync(
  path.join(base, "route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getAll, create } from "./store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";

  let results = getAll();
  if (search) {
    results = results.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(search) ||
        r.supplier.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ success: true, data: results });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const receipt = create({
    supplier: body.supplier || "",
    warehouse: body.warehouse || "",
    notes: body.notes || "",
    items: body.items || [],
  });
  return NextResponse.json({ success: true, data: receipt }, { status: 201 });
}
`
);
console.log("Created: route.ts");

// ---- [id]/route.ts (PUT + DELETE) ----
fs.writeFileSync(
  path.join(idDir, "route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { update, getById } from "../store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const receipt = getById(id);
  if (!receipt) {
    return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: receipt });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const receipt = update(id, body);
  if (!receipt) {
    return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: receipt });
}
`
);
console.log("Created: [id]/route.ts");

// ---- Status action routes ----
const statusRoutes = [
  { dir: confirmDir, status: "confirmed", file: "confirm" },
  { dir: readyDir, status: "ready", file: "ready" },
  { dir: validateDir, status: "done", file: "validate" },
  { dir: cancelDir, status: "cancelled", file: "cancel" },
];

statusRoutes.forEach(({ dir, status, file }) => {
  fs.writeFileSync(
    path.join(dir, "route.ts"),
    `import { NextRequest, NextResponse } from "next/server";
import { setStatus } from "../../store";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const receipt = setStatus(id, "${status}");
  if (!receipt) {
    return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: receipt });
}
`
  );
  console.log(\`Created: [id]/\${file}/route.ts\`);
});

console.log("\\nAll receipts API routes created successfully!");
