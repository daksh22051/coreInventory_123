"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { UserPlus, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import AuthShell from "../auth/AuthShell";
import { useAuthStore } from "../authStore";

const containerVariants: Variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");
    const result = await signup(name, email, password);
    setIsLoading(false);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.message || "Unable to create account.");
    }
  };

  return (
    <AuthShell
      heading="Create your CoreInventory profile"
      subheading="Secure staff onboarding with animated controls"
      callout="Every signup is safeguarded with bcrypt hashing and JWT sessions"
      aside={
        <>
          <h2 className="text-2xl font-semibold text-slate-900">Need access?</h2>
          <p className="text-slate-500 text-sm">Talk to the admin to provision multi-warehouse permissions.</p>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-emerald-600 font-semibold px-6 py-3 shadow-lg shadow-emerald-200">
            <UserPlus className="w-4 h-4" /> Login
          </Link>
        </>
      }
    >
      <motion.div variants={containerVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <FloatingInput label="Full name" icon={<UserPlus className="text-[#10B981]" />} value={name} onChange={setName} />
          <FloatingInput label="Work email" type="email" icon={<Mail className="text-[#10B981]" />} value={email} onChange={setEmail} />
          <FloatingInput
            label="Password"
            icon={<Lock className="text-[#10B981]" />}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            rightAction={<button type="button" className="text-slate-500" onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? <EyeOff /> : <Eye />}</button>}
          />
          <FloatingInput
            label="Confirm password"
            icon={<Lock className="text-[#10B981]" />}
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            rightAction={<button type="button" className="text-slate-500" onClick={() => setShowConfirm((prev) => !prev)}>{showConfirm ? <EyeOff /> : <Eye />}</button>}
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[20px] bg-gradient-to-r from-[#10B981] to-[#047857] text-white font-semibold py-3 shadow-2xl shadow-[#10B981]/30 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </motion.button>
        </form>
      </motion.div>
    </AuthShell>
  );
}

function FloatingInput({ label, icon, type = "text", value, onChange, rightAction }: { label: string; icon: React.ReactNode; type?: string; value: string; onChange: (value: string) => void; rightAction?: React.ReactNode }) {
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
        {rightAction && <div className="absolute inset-y-0 right-0 flex items-center pr-4">{rightAction}</div>}
      </div>
    </label>
  );
}
