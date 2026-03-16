export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";

  const data = [
    { month: "Jan", revenue: 45000, profit: 12000 },
    { month: "Feb", revenue: 52000, profit: 15000 },
    { month: "Mar", revenue: 48000, profit: 11000 },
  ];

  const csv =
    "Month,Revenue,Profit\n" +
    data.map((r) => `${r.month},${r.revenue},${r.profit}`).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=analytics-report.csv",
    },
  });
}
