"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "cyan" | "orange";
  delay?: number;
}

const colorConfig = {
  blue: {
    gradient: "from-emerald-50/40 to-teal-50/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    iconColor: "text-white",
    border: "border-slate-200/60",
    glow: "shadow-emerald-500/20",
    accentLine: "from-emerald-400 via-teal-500 to-emerald-600",
  },
  green: {
    gradient: "from-teal-50/40 to-cyan-50/40",
    iconBg: "bg-gradient-to-br from-teal-500 to-cyan-500",
    iconColor: "text-white",
    border: "border-slate-200/60",
    glow: "shadow-teal-500/20",
    accentLine: "from-teal-400 via-cyan-500 to-teal-600",
  },
  purple: {
    gradient: "from-violet-50/40 to-purple-50/40",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    iconColor: "text-white",
    border: "border-slate-200/60",
    glow: "shadow-violet-500/20",
    accentLine: "from-violet-400 via-purple-500 to-violet-600",
  },
  cyan: {
    gradient: "from-cyan-50/40 to-sky-50/40",
    iconBg: "bg-gradient-to-br from-cyan-500 to-sky-500",
    iconColor: "text-white",
    border: "border-slate-200/60",
    glow: "shadow-cyan-500/20",
    accentLine: "from-cyan-400 via-sky-500 to-cyan-600",
  },
  orange: {
    gradient: "from-orange-50/40 to-amber-50/40",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    iconColor: "text-white",
    border: "border-slate-200/60",
    glow: "shadow-orange-500/20",
    accentLine: "from-orange-400 via-amber-500 to-orange-600",
  },
};

const changeTypeClasses = {
  positive: "text-emerald-600 bg-emerald-50",
  negative: "text-red-600 bg-red-50",
  neutral: "text-slate-600 bg-slate-100",
};

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color,
  delay = 0,
}: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const config = colorConfig[color];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100 
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative cursor-pointer perspective-1000"
    >
      <motion.div
        animate={{
          y: isHovered ? -4 : 0,
          boxShadow: isHovered
            ? "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 10px 20px -10px rgba(0, 0, 0, 0.06)"
            : "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)",
        }}
        className={`
          relative overflow-hidden rounded-2xl p-6
          bg-white border ${config.border}
          transition-all duration-300
        `}
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.accentLine}`} />
        
        {/* Subtle gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-50`} />

        {/* Animated shimmer overlay */}
        <motion.div
          className="absolute inset-0 opacity-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? ["-100%", "100%"] : "-100%",
          }}
          transition={{
            x: { duration: 0.8, ease: "easeInOut" },
            opacity: { duration: 0.2 },
          }}
        />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.2, type: "spring" }}
              className="text-3xl font-bold text-slate-800 tracking-tight"
            >
              {value}
            </motion.p>
            {change && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${changeTypeClasses[changeType]}`}
              >
                {change}
              </motion.div>
            )}
          </div>

          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotate: isHovered ? 8 : 0,
            }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`p-3.5 rounded-xl ${config.iconBg} shadow-lg ${config.glow}`}
            style={{ transform: "translateZ(30px)" }}
          >
            <Icon size={24} strokeWidth={2} className={config.iconColor} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
