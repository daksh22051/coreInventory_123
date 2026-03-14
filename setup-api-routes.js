/**
 * Setup script for Product Management API routes.
 * Run: node setup-api-routes.js
 * Creates Next.js App Router API route files for product CRUD.
 */
const fs = require("fs");
const path = require("path");

const base = path.join(__dirname, "app", "api", "products");
const idDir = path.join(base, "[id]");

// Create directories
fs.mkdirSync(idDir, { recursive: true });
console.log("Created:", base);
console.log("Created:", idDir);

// ---- store.ts ----
fs.writeFileSync(
  path.join(base, "store.ts"),
  `export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

const products: Product[] = [
  { id: 1, name: "Laptop Dell XPS 15", sku: "SKU-001", category: "Electronics", price: 1299.99, stock: 45 },
  { id: 2, name: "Office Chair Pro", sku: "SKU-002", category: "Furniture", price: 299.99, stock: 8 },
  { id: 3, name: "Wireless Mouse MX", sku: "SKU-003", category: "Electronics", price: 79.99, stock: 120 },
  { id: 4, name: "Standing Desk 60\\"", sku: "SKU-004", category: "Furniture", price: 549.99, stock: 0 },
  { id: 5, name: "USB-C Hub 7-in-1", sku: "SKU-005", category: "Electronics", price: 49.99, stock: 200 },
  { id: 6, name: "Packaging Tape", sku: "SKU-006", category: "Packaging", price: 12.99, stock: 500 },
  { id: 7, name: "Steel Bolts M10", sku: "SKU-007", category: "Spare Parts", price: 0.99, stock: 5 },
  { id: 8, name: "Industrial Drill", sku: "SKU-008", category: "Tools", price: 189.99, stock: 32 },
  { id: 9, name: "Cardboard Boxes Large", sku: "SKU-009", category: "Packaging", price: 3.49, stock: 0 },
  { id: 10, name: "Monitor Stand", sku: "SKU-010", category: "Furniture", price: 89.99, stock: 67 },
];

let nextId = 11;

export function getAll(): Product[] {
  return [...products];
}

export function create(data: Omit<Product, "id">): Product {
  const product: Product = { ...data, id: nextId++ };
  products.push(product);
  return product;
}

export function update(id: number, data: Partial<Omit<Product, "id">>): Product | null {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...data };
  return { ...products[idx] };
}

export function remove(id: number): boolean {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  products.splice(idx, 1);
  return true;
}
`
);
console.log("Created: app/api/products/store.ts");

// ---- route.ts (GET + POST) ----
fs.writeFileSync(
  path.join(base, "route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { getAll, create } from "./store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const category = searchParams.get("category") || "all";

  let results = getAll();

  if (search) {
    results = results.filter(
      (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
    );
  }
  if (category !== "all") {
    results = results.filter((p) => p.category === category);
  }

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = create({
    name: body.name,
    sku: body.sku,
    category: body.category,
    price: Number(body.price),
    stock: Number(body.stock),
  });
  return NextResponse.json(product, { status: 201 });
}
`
);
console.log("Created: app/api/products/route.ts");

// ---- [id]/route.ts (PUT + DELETE) ----
fs.writeFileSync(
  path.join(idDir, "route.ts"),
  `import { NextRequest, NextResponse } from "next/server";
import { update, remove } from "../store";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const product = update(Number(id), {
    name: body.name,
    sku: body.sku,
    category: body.category,
    price: Number(body.price),
    stock: Number(body.stock),
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = remove(Number(id));

  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
`
);
console.log("Created: app/api/products/[id]/route.ts");

console.log("\\nAll API routes created successfully!");
console.log("Run 'npm run dev' to start the development server.");
