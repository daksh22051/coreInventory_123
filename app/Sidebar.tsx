"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, Sparkles, Box } from "lucide-react";
import { useAuthStore } from "./authStore";
import { navigationSections } from "./navigationItems";

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

  let itemIndex = 0;

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
            className="fixed left-0 top-0 h-screen w-[280px] z-50 flex flex-col overflow-hidden sidebar-panel"
          >
            <div className="absolute inset-0 sidebar-gradient" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 h-16 sidebar-header">
              <div className="flex items-center gap-2.5">
                <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md shadow-emerald-500/25">
                  <Box size={20} className="text-white" />
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-lg text-[var(--text-primary)]">Core</span>
                  <span className="font-bold text-lg text-gradient">Inventory</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg border border-[var(--glass-border)] bg-[var(--hover-bg)] hover:border-[var(--glass-border-hover)] transition-all"
              >
                <X size={16} className="text-[var(--text-secondary)]" />
              </motion.button>
            </div>

            {/* Navigation with Sections */}
            <nav className="relative flex-1 py-3 px-3 overflow-y-auto">
              {navigationSections.map((section, sectionIdx) => (
                <div key={section.title} className={sectionIdx > 0 ? "mt-1" : ""}>
                  {/* Section Divider with centered title */}
                  {sectionIdx > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: sectionIdx * 0.1 }}
                      className="flex items-center gap-2 px-2 py-3"
                    >
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] px-2">
                        {section.title}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />
                    </motion.div>
                  )}
                  
                  {/* Section Items */}
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = currentPage === item.page || (item.page === null && !currentPage);
                      const currentIndex = itemIndex++;
                      return (
                        <motion.li
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: currentIndex * 0.03, type: "spring", stiffness: 120 }}
                        >
                          <motion.button
                            onClick={() => handleNavigation(item.href)}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative w-full text-left"
                          >
                            {/* Active Background */}
                            {isActive && (
                              <motion.div
                                layoutId="drawerActiveIndicator"
                                className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}

                            {/* Left Accent */}
                            <motion.div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: isActive ? 1 : 0 }}
                              transition={{ duration: 0.2 }}
                            />

                            <div
                              className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-200 py-2 px-3 ${
                                isActive 
                                  ? "text-emerald-500" 
                                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                              }`}
                            >
                              <motion.div
                                animate={{ scale: isActive ? 1.05 : 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <item.icon size={18} strokeWidth={1.8} />
                              </motion.div>

                              <span className="font-medium text-[13px]">{item.name}</span>

                              {isActive && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="ml-auto"
                                >
                                  <Sparkles size={12} className="text-emerald-400" />
                                </motion.div>
                              )}
                            </div>
                          </motion.button>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="relative p-3 border-t border-[var(--glass-border)]">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                  bg-red-500/10 border border-red-500/20
                  hover:bg-red-500/20 hover:border-red-400/30
                  transition-all duration-300 text-red-400 hover:text-red-300
                  hover:shadow-lg hover:shadow-red-500/10"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Sign Out</span>
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
