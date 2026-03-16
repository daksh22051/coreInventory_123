"use client";

import { motion, Variants } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Check } from "lucide-react";
import { useAuthStore } from "../authStore";
import AuthShell from "../auth/AuthShell";

const variants: Variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") || "").trim();
  const { resetPassword, verifyOtp } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    if (!email) {
      setError("Email is required to verify OTP.");
      setLoading(false);
      return;
    }
    const result = await verifyOtp(email, otp);
    setLoading(false);
    if (result.success) {
      setOtpVerified(true);
      setSuccessMessage("OTP verified. Please choose a new password.");
    } else {
      setError(result.message || "Invalid OTP");
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password should be at least 8 characters");
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);
    if (!email) {
      setError("Email is required to reset your password.");
      setLoading(false);
      return;
    }
    const result = await resetPassword(email, otp, password);
    setLoading(false);
    if (result.success) {
      setSuccessMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
      router.push("/login");
    } else {
      setError(result.message || "Unable to reset password");
    }
  };

  return (
    <AuthShell
      heading="Reset password"
      subheading="Enter the OTP and choose a new password"
      callout="OTP expires in 5 minutes"
      aside={
        <div className="text-sm text-slate-500">
          <p>Check your inbox for the verification code. If it expired, request another via the forgot password screen.</p>
          <Link href="/forgot-password" className="text-[#10B981] font-semibold mt-3 block">
            Resend OTP
          </Link>
        </div>
      }
    >
      <motion.div variants={variants} initial="enter" animate="center" exit="exit" className="space-y-5">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}
        {!otpVerified ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <FloatingInput label="OTP code" icon={<ShieldCheck className="text-[#10B981]" />} type="text" value={otp} onChange={setOtp} />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full rounded-[20px] bg-gradient-to-r from-[#10B981] to-[#047857] text-white font-semibold py-3 shadow-2xl shadow-[#10B981]/30"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <FloatingInput
              label="New password"
              icon={<Lock className="text-[#10B981]" />}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
            />
            <FloatingInput
              label="Confirm password"
              icon={<Check className="text-[#10B981]" />}
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            <div className="flex items-center justify-between text-sm text-slate-600">
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-[#10B981]">
                {showPassword ? "Hide" : "Show"} password
              </button>
              <button type="button" onClick={() => setShowConfirm((prev) => !prev)} className="text-[#10B981]">
                {showConfirm ? "Hide" : "Show"} confirm
              </button>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full rounded-[20px] bg-gradient-to-r from-[#10B981] to-[#047857] text-white font-semibold py-3 shadow-2xl shadow-[#10B981]/30"
            >
              {loading ? "Resetting..." : "Reset password"}
            </motion.button>
          </form>
        )}
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
