"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  ChevronDown,
  LogOut,
  Settings,
  Command,
  Menu,
  X,
  Box,
  Sun,
  Moon,
  UserCircle,
} from "lucide-react";
import { useAuthStore } from "./authStore";
import { useThemeStore } from "./themeStore";
import SidebarDrawer from "./Sidebar";
import CommandPalette from "./CommandPalette";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const displayName = user?.name || "Admin";
  const displayEmail = user?.email || "admin@coreinventory.com";

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => {
      setShowUserMenu(false);
    };
    if (showUserMenu) {
      const timer = setTimeout(() => document.addEventListener("click", handler), 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handler);
      };
    }
  }, [showUserMenu]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close drawer on page change
  const currentPage = searchParams.get("page");
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPage]);

  const handleSignOut = useCallback(() => {
    logout();
    setShowUserMenu(false);
    router.push("/?page=login");
  }, [logout, router]);

  const handleNavigation = useCallback((href: string) => {
    setShowUserMenu(false);
    router.push(href);
  }, [router]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 h-20"
      >
        {/* Glass Background */}
        <div className="absolute inset-0 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--glass-border)]" />

        <div className="relative h-full flex items-center justify-between px-4 lg:px-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)] hover:border-[var(--glass-border-hover)] transition-all duration-300"
            >
              <Menu size={20} className="text-[var(--text-secondary)]" />
            </motion.button>

            <motion.div
              className="flex items-center gap-2.5 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push("/")}
            >
              <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md shadow-emerald-500/25">
                <Box size={20} className="text-white" />
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="hidden sm:flex items-baseline">
                <span className="font-bold text-lg text-[var(--text-primary)]">Core</span>
                <span className="font-bold text-lg text-gradient">Inventory</span>
              </div>
            </motion.div>
          </div>

          {/* Center: Search Bar */}
          <motion.div
            animate={{ scale: searchFocused ? 1.02 : 1 }}
            className="flex-1 max-w-xl mx-4 hidden md:block"
          >
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-indigo)] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products, orders..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onClick={() => setCommandPaletteOpen(true)}
                readOnly
                className="w-full pl-11 pr-20 py-2.5
                  bg-[var(--input-bg)]
                  border border-[var(--input-border)] rounded-xl
                  outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]
                  focus:border-[var(--input-focus-border)]
                  focus:shadow-lg focus:shadow-[var(--glow-cyan)]
                  transition-all duration-300 cursor-pointer text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--glass-border)] bg-[var(--hover-bg)]">
                <Command size={11} className="text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)] font-medium">K</span>
              </div>
            </div>
          </motion.div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Search */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)] hover:border-[var(--glass-border-hover)] transition-all duration-300"
            >
              <Search size={18} className="text-[var(--text-secondary)]" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]
                hover:border-[var(--glass-border-hover)] hover:shadow-lg hover:shadow-[var(--glow-purple)]
                transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun size={18} className="text-amber-400" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon size={18} className="text-indigo-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative ml-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl
                  border border-[var(--glass-border)] bg-[var(--hover-bg)]
                  hover:border-[var(--glass-border-hover)] hover:shadow-lg hover:shadow-emerald-500/15
                  transition-all duration-300"
              >
                <motion.div
                  className="w-9 h-9 rounded-lg p-[2px]"
                  style={{ background: "conic-gradient(from 0deg, #10b981, #14b8a6, #0d9488, #10b981)" }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-full h-full rounded-lg bg-[var(--background-secondary)] flex items-center justify-center">
                    <User size={16} className="text-emerald-600" />
                  </div>
                </motion.div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{displayName}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-tight">{displayEmail}</p>
                </div>
                <motion.div
                  animate={{ rotate: showUserMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden lg:block"
                >
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-3 w-56
                      bg-[var(--card-bg)] backdrop-blur-xl
                      rounded-2xl border border-[var(--glass-border)]
                      shadow-2xl shadow-black/30 overflow-hidden"
                  >
                    <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{displayName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{displayEmail}</p>
                    </div>
                    <div className="p-2">
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "rgba(16, 185, 129, 0.08)" }}
                        onClick={() => handleNavigation("/?page=settings")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-emerald-600 transition-all"
                      >
                        <UserCircle size={16} />
                        Profile
                      </motion.button>
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "rgba(16, 185, 129, 0.08)" }}
                        onClick={() => handleNavigation("/?page=settings")}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-emerald-600 transition-all"
                      >
                        <Settings size={16} />
                        Settings
                      </motion.button>
                      <div className="my-1 border-t border-[var(--glass-border)]" />
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "rgba(248, 113, 113, 0.08)" }}
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 transition-all"
                      >
                        <LogOut size={16} />
                        Sign out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Sidebar Drawer */}
      <SidebarDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
}
