"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  Clock,
  Zap,
  Sparkles,
  Activity,
} from "lucide-react";
import StatsCard from "./StatsCard";
import InventoryCharts from "./InventoryCharts";

const recentActivity = [
  {
    action: "Stock updated",
    item: "Widget Pro X",
    quantity: "+50 units",
    time: "2 min ago",
    icon: Package,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    action: "New product added",
    item: "Smart Gadget Z",
    quantity: "100 units",
    time: "15 min ago",
    icon: Zap,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    action: "Low stock alert",
    item: "Basic Widget",
    quantity: "5 units left",
    time: "1 hour ago",
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    action: "Order shipped",
    item: "Order #1234",
    quantity: "25 items",
    time: "2 hours ago",
    icon: ArrowUpRight,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <motion.div className="flex flex-col items-center gap-4">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-[var(--text-secondary)] font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading Dashboard...
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-bg)] backdrop-blur-sm border border-indigo-500/20 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={14} className="text-[var(--accent-indigo)]" />
            </motion.div>
            <span className="text-sm font-semibold text-gradient">Live Dashboard</span>
          </motion.div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Activity size={14} className="text-emerald-500" />
            <span>Last updated: Just now</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-[var(--text-primary)]">Welcome back, </span>
          <span className="text-gradient">Admin</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg">
          Here&apos;s your inventory overview for today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10"
      >
        <StatsCard
          title="Total Products"
          value="1,284"
          change="+12% from last month"
          changeType="positive"
          icon={Package}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Total Revenue"
          value="$48,250"
          change="+8.2% from last month"
          changeType="positive"
          icon={DollarSign}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Sales Growth"
          value="23.5%"
          change="+4.1% from last month"
          changeType="positive"
          icon={TrendingUp}
          color="purple"
          delay={0.2}
        />
        <StatsCard
          title="Low Stock Items"
          value="18"
          change="5 critical items"
          changeType="negative"
          icon={AlertTriangle}
          color="orange"
          delay={0.3}
        />
      </motion.div>

      {/* Charts Section */}
      <InventoryCharts />

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-10"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] shadow-xl shadow-black/20">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/15">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Track your latest updates</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 text-sm font-medium text-[var(--accent-indigo)] hover:text-white bg-indigo-500/10 hover:bg-indigo-500 rounded-xl border border-indigo-500/20 hover:border-indigo-500 transition-all duration-300 shadow-sm"
              >
                View all
              </motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(99, 102, 241, 0.04)" }}
                    className="group flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] hover:shadow-md hover:shadow-black/5 border border-[var(--glass-border)] hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`p-3 rounded-xl ${activity.bgColor} ${activity.iconColor}`}
                      >
                        <activity.icon size={20} />
                      </motion.div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-indigo)] transition-colors">
                          {activity.action}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">{activity.item}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--text-primary)]">{activity.quantity}</p>
                      <p className="text-sm text-[var(--text-muted)]">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer spacer */}
      <div className="h-10" />
    </div>
  );
}
