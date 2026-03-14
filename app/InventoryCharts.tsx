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
import { TrendingUp, Package, PieChart as PieIcon } from "lucide-react";

const salesData = [
  { month: "Jan", sales: 4000, orders: 240, revenue: 2400 },
  { month: "Feb", sales: 3000, orders: 198, revenue: 2210 },
  { month: "Mar", sales: 5000, orders: 300, revenue: 2290 },
  { month: "Apr", sales: 4500, orders: 278, revenue: 2000 },
  { month: "May", sales: 6000, orders: 389, revenue: 2181 },
  { month: "Jun", sales: 5500, orders: 349, revenue: 2500 },
  { month: "Jul", sales: 7000, orders: 430, revenue: 2100 },
];

const inventoryData = [
  { category: "Electronics", stock: 450, color: "#6366f1" },
  { category: "Clothing", stock: 320, color: "#8b5cf6" },
  { category: "Home", stock: 280, color: "#a78bfa" },
  { category: "Sports", stock: 190, color: "#10b981" },
  { category: "Books", stock: 420, color: "#f59e0b" },
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
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/50" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      {/* Subtle hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-transparent"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
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
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
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
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
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
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: 'white' }}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default function InventoryCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SalesChart />
      <InventoryBarChart />
    </div>
  );
}
