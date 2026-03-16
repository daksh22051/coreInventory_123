"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "./themeStore";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, accentColor } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor);
  }, [accentColor]);

  return <>{children}</>;
}
