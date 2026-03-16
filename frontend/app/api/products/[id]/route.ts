import { NextRequest, NextResponse } from "next/server";

interface Product {
  id: string;
  [key: string]: unknown;
}

let products: Product[] = [];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  products = products.map((p) => (p.id === id ? { ...p, ...body } : p));
  return NextResponse.json({ success: true, id });
}
