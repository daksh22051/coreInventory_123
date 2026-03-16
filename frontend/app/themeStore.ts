"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const writeThemeCookie = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `theme=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=Lax`;
};

const applyAccentColor = (color: string) => {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--accent-color", color);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light" as Theme,
      accentColor: "#10b981",
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
        writeThemeCookie(theme);
      },

      toggleTheme: () => {
        const newTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },

      setAccentColor: (color: string) => {
        set({ accentColor: color });
        applyAccentColor(color);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, accentColor: state.accentColor }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", state.theme);
            applyAccentColor(state.accentColor);
          }
          writeThemeCookie(state.theme);
        }
      },
    }
  )
);
