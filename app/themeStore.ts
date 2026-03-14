"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light" as Theme,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      setTheme: (theme: Theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", state.theme);
          }
        }
      },
    }
  )
);
