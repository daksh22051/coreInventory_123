"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import AuthShell from "../auth/AuthShell";

const containerVariants: Variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        setMessage(data.message || "OTP dispatched to your inbox.");
        const encoded = encodeURIComponent(email);
        setTimeout(() => router.push(`/reset-password?email=${encoded}`), 800);
      } else {
        setError(data.message || "Unable to send OTP");
      }
    } catch (fetchError: any) {
      setLoading(false);
      setError(fetchError?.message || "Unable to reach the server.");
    }
  };

  return (
    <AuthShell
      heading="Forgot password"
      subheading="We will send you a verification code"
      callout="Securely reset your password in minutes"
      primaryAction={
        <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#10B981] text-white font-semibold shadow-lg shadow-[#10B981]/40">
          Back to login
        </Link>
      }
      aside={
        <>
          <h2 className="text-2xl font-semibold text-slate-900">Need direct help?</h2>
          <p className="text-slate-500 text-sm">
            Contact your workspace admin for immediate verification or walkthrough.
          </p>
          <div className="mt-4 rounded-2xl bg-white/70 border border-emerald-100 p-4 text-sm text-slate-700">
            <strong className="text-[#047857]">Pro Tip:</strong> Use the same email registered for CoreInventory to speed up recovery.
          </div>
        </>
      }
    >
      <motion.div variants={containerVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label="Work email"
            type="email"
            icon={<Mail className="text-[#10B981]" />}
            value={email}
            onChange={setEmail}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            className="w-full rounded-[20px] bg-gradient-to-r from-[#10B981] to-[#047857] text-white font-semibold py-3 shadow-2xl shadow-[#10B981]/30 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
          </motion.button>
        </form>
      </motion.div>
    </AuthShell>
  );
}

function FloatingInput({ label, icon, type = "text", value, onChange }: { label: string; icon: React.ReactNode; type?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm text-slate-500 space-y-1">
      <span className="font-semibold text-slate-800">{label}</span>
      <div className="relative rounded-[20px] border border-slate-200 bg-white/90 shadow-inner shadow-slate-100 focus-within:ring-2 focus-within:ring-[#10B981]/40 overflow-hidden">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border-none bg-transparent py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none"
        />
      </div>
    </label>
  );
}
