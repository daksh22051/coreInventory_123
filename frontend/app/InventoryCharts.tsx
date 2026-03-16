"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Package, PieChart as PieIcon, DollarSign, Flame } from "lucide-react";

const salesData = [
  { month: "Jan", sales: 4000, orders: 240, revenue: 2400, profit: 1200 },
  { month: "Feb", sales: 3000, orders: 198, revenue: 2210, profit: 980 },
  { month: "Mar", sales: 5000, orders: 300, revenue: 2290, profit: 1450 },
  { month: "Apr", sales: 4500, orders: 278, revenue: 2000, profit: 1100 },
  { month: "May", sales: 6000, orders: 389, revenue: 2181, profit: 1380 },
  { month: "Jun", sales: 5500, orders: 349, revenue: 2500, profit: 1600 },
  { month: "Jul", sales: 7000, orders: 430, revenue: 2100, profit: 1350 },
];

const inventoryData = [
  { category: "Electronics", stock: 450, color: "#10b981" },
  { category: "Clothing", stock: 320, color: "#14b8a6" },
  { category: "Home", stock: 280, color: "#0d9488" },
  { category: "Sports", stock: 190, color: "#06b6d4" },
  { category: "Books", stock: 420, color: "#0891b2" },
];

const stockStatusData = [
  { name: "In Stock", value: 65, color: "#10b981" },
  { name: "Low Stock", value: 25, color: "#f59e0b" },
  { name: "Out of Stock", value: 10, color: "#ef4444" },
];

const ChartCard = ({
  children,
  title,
  icon: Icon,
  delay = 0
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* White glass background */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)]" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      {/* Subtle hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-br from-slate-50/80 via-white/40 to-transparent"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <Icon size={18} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        {children}
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white backdrop-blur-xl border border-slate-200 rounded-xl p-4 shadow-xl"
      >
        <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export function SalesChart() {
  return (
    <ChartCard title="Sales Overview" icon={TrendingUp} delay={0.1}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis 
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              fill="url(#salesGradient)"
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function InventoryBarChart() {
  return (
    <ChartCard title="Inventory by Category" icon={Package} delay={0.2}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={inventoryData} layout="vertical" barCategoryGap="20%">
            <defs>
              {inventoryData.map((item, index) => (
                <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis 
              dataKey="category" 
              type="category" 
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
            <Bar 
              dataKey="stock" 
              radius={[0, 8, 8, 0]}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {inventoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#barGradient${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function StockStatusChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ChartCard title="Stock Status Distribution" icon={PieIcon} delay={0.3}>
      <div className="h-72 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {stockStatusData.map((entry, index) => (
                <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                </linearGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={stockStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={activeIndex !== null ? 95 : 90}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1500}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              filter="url(#glow)"
            >
              {stockStatusData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#pieGradient${index})`}
                  stroke="white"
                  strokeWidth={2}
                  style={{
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-6 mt-4">
                  {payload?.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: stockStatusData[index].color }}
                      />
                      <span className="text-sm text-slate-500">{entry.value}</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {stockStatusData[index].value}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function RevenueLineChart() {
  return (
    <ChartCard title="Revenue Trend" icon={TrendingUp} delay={0.4}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="month"
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="url(#revenueGradient)"
              strokeWidth={3}
              dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4, stroke: 'white' }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Revenue vs Profit comparison chart
export function RevenueProfitChart() {
  return (
    <ChartCard title="Revenue vs Profit" icon={DollarSign} delay={0.3}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profitAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="month"
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              content={({ payload }) => (
                <div className="flex items-center justify-end gap-5 mb-2">
                  {payload?.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-slate-600 font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#revAreaGradient)"
              animationDuration={2000}
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#profitAreaGradient)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Sales Heatmap data
const heatmapData = [
  { day: "Mon", h6: 2, h9: 15, h12: 28, h15: 22, h18: 18, h21: 8 },
  { day: "Tue", h6: 4, h9: 18, h12: 32, h15: 25, h18: 20, h21: 6 },
  { day: "Wed", h6: 3, h9: 22, h12: 35, h15: 30, h18: 24, h21: 10 },
  { day: "Thu", h6: 5, h9: 20, h12: 30, h15: 28, h18: 22, h21: 9 },
  { day: "Fri", h6: 6, h9: 25, h12: 38, h15: 35, h18: 28, h21: 14 },
  { day: "Sat", h6: 8, h9: 30, h12: 42, h15: 38, h18: 32, h21: 18 },
  { day: "Sun", h6: 3, h9: 12, h12: 20, h15: 18, h18: 14, h21: 5 },
];

const timeSlots = [
  { key: "h6", label: "6AM" },
  { key: "h9", label: "9AM" },
  { key: "h12", label: "12PM" },
  { key: "h15", label: "3PM" },
  { key: "h18", label: "6PM" },
  { key: "h21", label: "9PM" },
];

function getHeatColor(value: number): string {
  if (value >= 35) return "bg-emerald-600 text-white";
  if (value >= 25) return "bg-emerald-500 text-white";
  if (value >= 18) return "bg-emerald-400 text-white";
  if (value >= 10) return "bg-emerald-200 text-emerald-800";
  if (value >= 5) return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-500";
}

export function SalesHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; time: string; value: number } | null>(null);

  return (
    <ChartCard title="Sales Heatmap" icon={Flame} delay={0.4}>
      <div className="relative">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          <div className="h-8" />
          {timeSlots.map((slot) => (
            <div key={slot.key} className="h-8 flex items-center justify-center text-xs font-medium text-slate-500">
              {slot.label}
            </div>
          ))}
        </div>
        {/* Data rows */}
        {heatmapData.map((row) => (
          <div key={row.day} className="grid grid-cols-7 gap-1.5 mb-1.5">
            <div className="h-10 flex items-center text-xs font-semibold text-slate-600 pl-1">
              {row.day}
            </div>
            {timeSlots.map((slot) => {
              const value = row[slot.key as keyof typeof row] as number;
              return (
                <motion.div
                  key={slot.key}
                  whileHover={{ scale: 1.15 }}
                  onMouseEnter={() => setHoveredCell({ day: row.day, time: slot.label, value })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`h-10 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${getHeatColor(value)}`}
                >
                  {value}
                </motion.div>
              );
            })}
          </div>
        ))}
        {/* Tooltip */}
        {hoveredCell && (
          <div className="absolute top-2 right-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm z-10">
            <span className="font-semibold text-slate-800">{hoveredCell.value} sales</span>
            <span className="text-slate-500"> on {hoveredCell.day} at {hoveredCell.time}</span>
          </div>
        )}
        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4">
          <span className="text-xs text-slate-500 mr-1">Low</span>
          {["bg-slate-100", "bg-emerald-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"].map((c, i) => (
            <div key={i} className={`w-5 h-5 rounded ${c}`} />
          ))}
          <span className="text-xs text-slate-500 ml-1">High</span>
        </div>
      </div>
    </ChartCard>
  );
}

export default function InventoryCharts() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <InventoryBarChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueProfitChart />
        <SalesHeatmap />
      </div>
    </div>
  );
}
