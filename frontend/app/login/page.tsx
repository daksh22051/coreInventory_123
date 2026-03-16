"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import type { Variants } from "framer-motion";
import { useAuthStore } from "../authStore";

const floatingVariants: Variants = {
  animate: {
    y: [0, -12, 0],
    x: [0, 10, 0],
    transition: { duration: 6, repeat: Infinity, ease: ["easeInOut"] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function LoginRoutePage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.replace("/");
    } else {
      setError(result.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f9fafb] flex items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute -top-32 right-0 w-96 h-96 bg-gradient-to-br from-[#10B981]/60 to-transparent blur-[120px]"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#047857]/40 to-transparent blur-[110px]"
      />

      <motion.div
        className="relative w-full max-w-5xl"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6 rounded-[32px] bg-white/95 border border-emerald-100 shadow-[0_20px_80px_rgba(16,185,129,0.2)] p-8 md:p-12">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-1"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#047857]">CoreInventory</p>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Welcome back</h1>
                <Link
                  href="/"
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-[#10B981] hover:text-[#047857]"
                >
                  Back to landing
                </Link>
              </div>
              <p className="text-slate-500 max-w-xl">Secure access to warehouse, supply, and analytics data with resilient authentication.</p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <FloatingInput label="Email" icon={<Mail className="text-[#10B981]" />} type="email" value={email} onChange={setEmail} />
              <FloatingInput
                label="Password"
                icon={<Lock className="text-[#10B981]" />}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                rightAction={
                  <button type="button" className="text-slate-400" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
              />

              <div className="flex items-center justify-between text-sm text-slate-600">
                <Link className="text-[#10B981] hover:text-[#047857] font-semibold" href="/forgot-password">Forgot password?</Link>
                <p className="text-slate-400">Secure login</p>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-[20px] bg-gradient-to-r from-[#10B981] to-[#047857] text-white font-semibold py-3 shadow-2xl shadow-[#10B981]/30 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.form>
          </div>

          <div className="hidden md:flex flex-col justify-between rounded-[28px] bg-gradient-to-br from-[#10B981]/30 to-transparent p-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <p className="text-xs uppercase tracking-[0.5em] text-[#065f46]">Identity guard</p>
              <h2 className="text-2xl font-bold text-slate-900">Animated security</h2>
              <p className="text-sm text-slate-700">
                Floating gradients signal encrypted sessions while Framer Motion keeps the UI alive.
              </p>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-white/30 bg-white/40 p-4 shadow-lg shadow-[#10B981]/30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-[#10B981] w-6 h-6" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">OTP Delivery</p>
                  <p className="text-xs text-slate-500">Generated in 5m, invalid after use.</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/50 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#047857]"
                  animate={{ width: ["0%", "100%" ] }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
                />
              </div>
            </motion.div>

            <p className="text-xs text-slate-500">
              Need an account? <Link href="/signup" className="text-[#065f46] font-semibold">Sign up</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FloatingInput({ label, icon, type = "text", value, onChange, rightAction }: { label: string; icon: React.ReactNode; type?: string; value: string; onChange: (value: string) => void; rightAction?: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-500 space-y-1">
      <span className="font-semibold text-slate-800">{label}</span>
      <div className="relative rounded-[20px] border border-slate-200 bg-white/90 shadow-inner shadow-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-[#10B981]/40">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-none bg-transparent py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none"
        />
        {rightAction && <div className="absolute inset-y-0 right-0 flex items-center pr-4">{rightAction}</div>}
      </div>
    </label>
  );
}
