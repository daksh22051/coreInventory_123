"use client";

import { motion } from "framer-motion";

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute -top-20 -left-10 w-80 h-80 bg-gradient-to-br from-emerald-500/30 to-transparent blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ rotate: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-y-1/4 left-1/2 w-60 h-60 bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/3 w-40 h-40 bg-gradient-to-br from-rose-500/20 to-transparent blur-3xl"
      />
    </div>
  );
}
