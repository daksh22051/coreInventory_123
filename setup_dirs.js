const fs = require('fs');
const path = require('path');

const base = __dirname;

// ─── 1. Create Directories ───────────────────────
const dirs = [
  'prisma',
  'app/lib',
  'app/api/products/[id]',
  'app/api/seed',
];

dirs.forEach(dir => {
  const fullPath = path.join(base, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log('DIR:', fullPath);
});

// ─── 2. Create prisma/schema.prisma ───────────────
fs.writeFileSync(path.join(base, 'prisma/schema.prisma'), `// Prisma schema for CoreInventory

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  otpCode      String?
  otpExpiresAt DateTime?
  isActive  Boolean @default(true)
  isAdmin   Boolean @default(false)
}

model Product {
  id        String   @id @default(cuid())
  name      String
  sku       String   @unique
  category  String
  price     Float
  stock     Int
  status    String   @default("in-stock")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`);
console.log('FILE: prisma/schema.prisma');

// ─── 3. Create app/lib/prisma.ts ──────────────────
fs.writeFileSync(path.join(base, 'app/lib/prisma.ts'), `import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`);
console.log('FILE: app/lib/prisma.ts');

// ─── 3b. Create app/lib/api.ts ───────────────────
fs.writeFileSync(path.join(base, 'app/lib/api.ts'), `const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
        }
      } catch {}
    }
  }

  return headers;
}

export async function apiGet(endpoint: string) {
  const res = await fetch(API_BASE + endpoint, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiPost(endpoint: string, body: unknown) {
  const res = await fetch(API_BASE + endpoint, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return { data: await res.json(), status: res.status };
}

export async function apiPut(endpoint: string, body: unknown) {
  const res = await fetch(API_BASE + endpoint, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return { data: await res.json(), status: res.status };
}

export async function apiDelete(endpoint: string) {
  const res = await fetch(API_BASE + endpoint, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.json();
}

export { API_BASE };
`);
console.log('FILE: app/lib/api.ts');

// ─── 4. Create app/api/products/route.ts ──────────
fs.writeFileSync(path.join(base, 'app/api/products/route.ts'), `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/products - Get all products with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    
    if (category && category !== "all") {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, category, price, stock } = body;

    if (!name || !sku || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let status = "in-stock";
    if (parseInt(stock) === 0) status = "out-of-stock";
    else if (parseInt(stock) <= 10) status = "low-stock";

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        status,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error && typeof error === "object" && "code" in error && (error as any).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A product with this SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
`);
console.log('FILE: app/api/products/route.ts');

// ─── 5. Create app/api/products/[id]/route.ts ────
fs.writeFileSync(path.join(base, 'app/api/products/[id]/route.ts'), `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, category, price, stock } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    let status = "in-stock";
    const stockNum = stock !== undefined ? parseInt(stock) : existing.stock;
    if (stockNum === 0) status = "out-of-stock";
    else if (stockNum <= 10) status = "low-stock";

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        sku: sku || existing.sku,
        category: category || existing.category,
        price: price !== undefined ? parseFloat(price) : existing.price,
        stock: stockNum,
        status,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error && typeof error === "object" && "code" in error && (error as any).code === "P2002") {
      return NextResponse.json({ success: false, error: "Duplicate SKU" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
`);
console.log('FILE: app/api/products/[id]/route.ts');

// ─── 6. Create app/api/seed/route.ts ──────────────
fs.writeFileSync(path.join(base, 'app/api/seed/route.ts'), `import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const seedProducts = [
  { name: "Widget Pro X", sku: "WPX-001", category: "Electronics", price: 299.99, stock: 150, status: "in-stock" },
  { name: "Smart Gadget Z", sku: "SGZ-002", category: "Electronics", price: 199.99, stock: 85, status: "in-stock" },
  { name: "Basic Widget", sku: "BW-003", category: "Accessories", price: 49.99, stock: 5, status: "low-stock" },
  { name: "Premium Case", sku: "PC-004", category: "Accessories", price: 79.99, stock: 0, status: "out-of-stock" },
  { name: "Power Adapter", sku: "PA-005", category: "Electronics", price: 29.99, stock: 200, status: "in-stock" },
  { name: "USB Cable Pro", sku: "UCP-006", category: "Accessories", price: 19.99, stock: 12, status: "low-stock" },
  { name: "Wireless Charger", sku: "WC-007", category: "Electronics", price: 59.99, stock: 75, status: "in-stock" },
  { name: "Screen Protector", sku: "SP-008", category: "Accessories", price: 14.99, stock: 0, status: "out-of-stock" },
  { name: "Bluetooth Speaker", sku: "BS-009", category: "Electronics", price: 89.99, stock: 45, status: "in-stock" },
  { name: "Phone Stand", sku: "PS-010", category: "Accessories", price: 24.99, stock: 8, status: "low-stock" },
  { name: "HDMI Cable 4K", sku: "HC-011", category: "Electronics", price: 15.99, stock: 300, status: "in-stock" },
  { name: "Laptop Sleeve", sku: "LS-012", category: "Accessories", price: 34.99, stock: 60, status: "in-stock" },
  { name: "Webcam HD", sku: "WH-013", category: "Electronics", price: 129.99, stock: 0, status: "out-of-stock" },
  { name: "Mouse Pad XL", sku: "MP-014", category: "Accessories", price: 19.99, stock: 95, status: "in-stock" },
  { name: "USB Hub 7-Port", sku: "UH-015", category: "Electronics", price: 44.99, stock: 3, status: "low-stock" },
];

export async function POST() {
  try {
    const count = await prisma.product.count();
    if (count > 0) {
      return NextResponse.json({ success: true, message: "Database already seeded", count });
    }

    await prisma.product.createMany({ data: seedProducts });

    return NextResponse.json({
      success: true,
      message: "Database seeded with " + seedProducts.length + " products",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: "Failed to seed" }, { status: 500 });
  }
}
`);
console.log('FILE: app/api/seed/route.ts');

// ─── 7. Ensure .env has DATABASE_URL ──────────────
const envPath = path.join(base, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('DATABASE_URL')) {
    fs.appendFileSync(envPath, '\\nDATABASE_URL="file:./dev.db"\\n');
    console.log('UPDATED: .env (added DATABASE_URL)');
  } else {
    console.log('SKIP: .env (already has DATABASE_URL)');
  }
} else {
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\\nJWT_SECRET="coreinventory-dev-secret-key-2024"\\n');
  console.log('FILE: .env');
}

console.log('\\n✅ All files created! Now run:');
console.log('   npx prisma generate');
console.log('   npx prisma db push');

