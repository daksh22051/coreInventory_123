"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";

function SoftOrb({ x, y, color, size, duration }: { x: number; y: number; color: string; size: number; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
      }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.15, 1],
        x: [0, 30, 0],
        y: [0, -20, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function SoftParticle({ config }: { config: { size: number; x: number; y: number; duration: number; delay: number; dx: number; dy: number } }) {
  return (
    <motion.div
      className="absolute rounded-full bg-indigo-400/40"
      style={{
        width: config.size,
        height: config.size,
        left: `${config.x}%`,
        top: `${config.y}%`,
      }}
      animate={{
        opacity: [0.15, 0.4, 0.15],
        scale: [1, 1.3, 1],
        x: [0, config.dx, 0],
        y: [0, config.dy, 0],
      }}
      transition={{
        duration: config.duration,
        delay: config.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Background3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x: x * 12, y: y * 12 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Memoize particle configs so they don't regenerate on every render
  const particleConfigs = useMemo(() =>
    Array.from({ length: 20 }).map(() => ({
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 12,
      delay: Math.random() * 5,
      dx: Math.random() * 40 - 20,
      dy: Math.random() * 40 - 20,
    }))
  , []);

  const orbs = [
    { x: 15, y: 20, color: "rgba(99, 102, 241, 0.08)", size: 350, duration: 10 },
    { x: 75, y: 50, color: "rgba(139, 92, 246, 0.06)", size: 400, duration: 13 },
    { x: 45, y: 75, color: "rgba(59, 130, 246, 0.05)", size: 300, duration: 11 },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Soft base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/40 to-indigo-50/30" />

      {/* Subtle animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 40% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)",
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Parallax container */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ x: mousePosition.x, y: mousePosition.y }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      >
        {/* Soft glow orbs */}
        {orbs.map((orb, i) => (
          <SoftOrb key={`orb-${i}`} {...orb} />
        ))}

        {/* Subtle particles */}
        {particleConfigs.map((config, i) => (
          <SoftParticle key={`particle-${i}`} config={config} />
        ))}
      </motion.div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Soft edge vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-100/60 via-transparent to-transparent" />
    </div>
  );
}
