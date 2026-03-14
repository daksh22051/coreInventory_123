"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, LogOut, ArrowRight } from "lucide-react";
import { navigationItems } from "./navigationItems";
import { useThemeStore } from "./themeStore";
import { useAuthStore } from "./authStore";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { toggleTheme, theme } = useThemeStore();
  const { logout } = useAuthStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { name: "Toggle theme", icon: theme === "dark" ? Sun : Moon, action: () => { toggleTheme(); onClose(); }, category: "Actions" },
    { name: "Sign out", icon: LogOut, action: () => { logout(); router.push("/?page=login"); onClose(); }, category: "Actions" },
  ];

  const filteredPages = navigationItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actions.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredPages.map(p => ({ ...p, category: "Pages", action: () => { router.push(p.href); onClose(); } })),
    ...filteredActions,
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].action();
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [allItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[60] w-full max-w-lg"
          >
            <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--glass-border)]">
                <Search size={20} className="text-[var(--neon-cyan)] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--glass-border)] bg-[var(--hover-bg)] text-xs text-[var(--text-muted)]">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {allItems.length === 0 && (
                  <div className="px-5 py-8 text-center text-[var(--text-muted)] text-sm">
                    No results found
                  </div>
                )}

                {filteredPages.length > 0 && (
                  <>
                    <div className="px-5 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Pages
                    </div>
                    {filteredPages.map((item, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <motion.button
                          key={item.name}
                          onClick={() => { router.push(item.href); onClose(); }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[var(--hover-bg)] text-[var(--neon-cyan)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                          }`}
                        >
                          <item.icon size={18} className={isSelected ? "text-[var(--neon-cyan)]" : "text-[var(--text-muted)]"} />
                          <span className="flex-1 text-sm font-medium">{item.name}</span>
                          {isSelected && <ArrowRight size={14} className="text-[var(--neon-cyan)]" />}
                        </motion.button>
                      );
                    })}
                  </>
                )}

                {filteredActions.length > 0 && (
                  <>
                    <div className="px-5 py-1.5 mt-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Actions
                    </div>
                    {filteredActions.map((item, i) => {
                      const globalIndex = filteredPages.length + i;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <motion.button
                          key={item.name}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[var(--hover-bg)] text-[var(--neon-cyan)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                          }`}
                        >
                          <item.icon size={18} className={isSelected ? "text-[var(--neon-cyan)]" : "text-[var(--text-muted)]"} />
                          <span className="flex-1 text-sm font-medium">{item.name}</span>
                          {isSelected && <ArrowRight size={14} className="text-[var(--neon-cyan)]" />}
                        </motion.button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-[var(--glass-border)] text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--glass-border)] bg-[var(--hover-bg)]">↑↓</kbd> Navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--glass-border)] bg-[var(--hover-bg)]">↵</kbd> Select</span>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-[var(--glass-border)] bg-[var(--hover-bg)]">Esc</kbd> Close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
