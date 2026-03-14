"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Sparkles, Box } from "lucide-react";
import { useAuthStore } from "./authStore";
import { navigationItems } from "./navigationItems";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page");

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/?page=login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-screen w-[300px] z-50 flex flex-col overflow-hidden"
          >
            {/* Glass Background */}
            <div className="absolute inset-0 bg-[var(--card-bg)] backdrop-blur-xl border-r border-[var(--glass-border)]" />

            {/* Floating Glow Orbs */}
            <motion.div
              className="absolute -left-10 top-1/4 w-32 h-32 bg-indigo-500/8 rounded-full blur-3xl"
              animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -left-5 bottom-1/3 w-24 h-24 bg-purple-500/8 rounded-full blur-3xl"
              animate={{ y: [0, -20, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 h-20 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/20">
                  <Box size={22} className="text-white" />
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-xl text-[var(--text-primary)]">Core</span>
                  <span className="font-bold text-xl text-gradient">Inventory</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg border border-[var(--glass-border)] bg-[var(--hover-bg)] hover:border-[var(--glass-border-hover)] transition-all"
              >
                <X size={18} className="text-[var(--text-secondary)]" />
              </motion.button>
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 py-6 px-4 overflow-y-auto">
              <ul className="space-y-1">
                {navigationItems.map((item, index) => {
                  const isActive = currentPage === item.page;
                  return (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, type: "spring", stiffness: 120 }}
                    >
                      <motion.button
                        onClick={() => handleNavigation(item.href)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative w-full text-left"
                      >
                        {/* Active Background */}
                        {isActive && (
                          <motion.div
                            layoutId="drawerActiveIndicator"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/12 via-purple-500/8 to-transparent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        {/* Left Accent */}
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: isActive ? 1 : 0 }}
                          transition={{ duration: 0.2 }}
                        />

                        <div
                          className={`
                            relative flex items-center gap-3 px-4 py-3 rounded-xl
                            transition-all duration-300
                            ${isActive
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                            }
                          `}
                        >
                          <motion.div
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className={isActive ? "text-[var(--accent-indigo)]" : ""}
                          >
                            <item.icon size={20} strokeWidth={1.5} />
                          </motion.div>

                          <span className="font-medium text-sm">{item.name}</span>

                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="ml-auto"
                            >
                              <Sparkles size={14} className="text-[var(--accent-indigo)]" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="relative p-4 border-t border-[var(--glass-border)]">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                  bg-red-500/10 border border-red-500/20
                  hover:bg-red-500/20 hover:border-red-400/30
                  transition-all duration-300 text-red-400 hover:text-red-300
                  hover:shadow-lg hover:shadow-red-500/10"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
