"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "./themeStore";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, _hasHydrated } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Prevent flash of wrong theme
  if (!_hasHydrated) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
