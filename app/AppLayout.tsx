"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";

const Background3D = dynamic(() => import("./Background3D"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[var(--background)]" />,
});

interface AppLayoutProps {
  children: ReactNode;
  currentPage: string | null;
}

export default function AppLayout({ children, currentPage }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      <Background3D />
      <Navbar />
      <main className="relative z-10 pt-16 lg:pt-[6.5rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage || "dashboard"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
