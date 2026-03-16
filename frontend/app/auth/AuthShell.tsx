"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AuthBackground from "./AuthBackground";

const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function AuthShell({
  heading,
  subheading,
  callout,
  children,
  aside,
  primaryAction,
}: {
  heading: string;
  subheading: string;
  callout?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  primaryAction?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center relative overflow-hidden px-4">
      <AuthBackground />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white to-emerald-100 rounded-[32px] blur-xl opacity-60" />
        <motion.div className="relative bg-white/95 border border-white/70 rounded-[32px] shadow-2xl shadow-emerald-500/20 backdrop-blur-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-10 md:p-12 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <span className="text-white font-bold text-lg">CI</span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-slate-900">{heading}</h1>
                  <p className="text-sm text-slate-500">{subheading}</p>
                </div>
              </div>

              {callout && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {callout}
                </div>
              )}

              <AnimatePresence mode="wait">{children}</AnimatePresence>
              {primaryAction && <div>{primaryAction}</div>}
            </div>

            {aside && (
              <div className="hidden md:flex flex-col justify-between rounded-[32px] bg-gradient-to-b from-emerald-500/20 to-white/0 p-10 space-y-4">
                {aside}
                <div className="rounded-2xl border border-white/30 bg-white/40 p-4 shadow-lg shadow-emerald-500/20 text-sm text-slate-500">
                  Secure experience with OTP, bcrypt hashing, and JWT refresh support.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
