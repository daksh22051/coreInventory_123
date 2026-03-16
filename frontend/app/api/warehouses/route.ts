let warehouses = [
  {
    id: 1,
    code: "WH-A",
    name: "Warehouse A",
    address: "123 Industrial Park",
    city: "New York",
    state: "NY",
    capacity: 10000,
    active: true,
  },
];

export async function GET() {
  return Response.json(warehouses);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newWarehouse = {
      id: Date.now(),
      code: body.code,
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      capacity: body.capacity,
      active: body.active,
    };
    warehouses.push(newWarehouse);
    return Response.json(newWarehouse);
  } catch (error) {
    return new Response("Invalid payload", { status: 400 });
  }
}
