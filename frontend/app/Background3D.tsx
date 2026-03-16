"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Blurred floating shape component
function FloatingShape({
  x,
  y,
  width,
  height,
  color,
  borderRadius,
  duration,
  rotate,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderRadius: string;
  duration: number;
  rotate: number;
}) {
  return (
    <motion.div
      className="absolute blur-3xl"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width,
        height,
        background: color,
        borderRadius,
        transform: `rotate(${rotate}deg)`,
      }}
      animate={{
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.08, 1],
        x: [0, 15, -10, 0],
        y: [0, -12, 8, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function Background3D() {
  // Premium blurred floating shapes - soft, muted colors
  const shapes = useMemo(
    () => [
      {
        x: 5,
        y: 8,
        width: 500,
        height: 500,
        color: "rgba(99, 102, 241, 0.06)",
        borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
        duration: 18,
        rotate: 0,
      },
      {
        x: 65,
        y: 5,
        width: 450,
        height: 400,
        color: "rgba(16, 185, 129, 0.05)",
        borderRadius: "60% 40% 30% 70% / 50% 60% 40% 50%",
        duration: 22,
        rotate: 45,
      },
      {
        x: 30,
        y: 55,
        width: 550,
        height: 450,
        color: "rgba(14, 165, 233, 0.04)",
        borderRadius: "50% 50% 40% 60% / 60% 40% 60% 40%",
        duration: 20,
        rotate: -20,
      },
      {
        x: 75,
        y: 60,
        width: 400,
        height: 350,
        color: "rgba(168, 85, 247, 0.035)",
        borderRadius: "45% 55% 60% 40% / 55% 45% 55% 45%",
        duration: 25,
        rotate: 30,
      },
      {
        x: -5,
        y: 70,
        width: 350,
        height: 300,
        color: "rgba(20, 184, 166, 0.04)",
        borderRadius: "55% 45% 50% 50% / 45% 55% 45% 55%",
        duration: 16,
        rotate: 15,
      },
    ],
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base: soft neutral gradient like Stripe/Linear */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 25%, #eef2f7 50%, #f3f4f6 75%, #f7f9fc 100%)",
        }}
      />

      {/* Subtle mesh gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 85% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 60% 70% at 50% 80%, rgba(14, 165, 233, 0.04) 0%, transparent 50%)
          `,
        }}
      />

      {/* Radial glow - top left warm glow */}
      <motion.div
        className="absolute"
        style={{
          top: "-10%",
          left: "-5%",
          width: "60%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Radial glow - center right subtle indigo */}
      <motion.div
        className="absolute"
        style={{
          top: "20%",
          right: "-10%",
          width: "50%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 65%)",
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Radial glow - bottom subtle teal */}
      <motion.div
        className="absolute"
        style={{
          bottom: "-15%",
          left: "20%",
          width: "60%",
          height: "50%",
          background:
            "radial-gradient(circle, rgba(20, 184, 166, 0.05) 0%, transparent 60%)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Blurred floating shapes */}
      {shapes.map((shape, i) => (
        <FloatingShape key={`shape-${i}`} {...shape} />
      ))}

      {/* Subtle dot pattern overlay (like Stripe) */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Noise texture overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top edge soft gradient fade for seamless navbar blend */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(246, 248, 251, 0.9) 0%, transparent 100%)",
        }}
      />

      {/* Bottom edge soft gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background:
            "linear-gradient(to top, rgba(243, 244, 246, 0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
