import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ThemeProvider from "./ThemeProvider";
import ThemeInitScript from "./ThemeInitScript";
import type { Theme } from "./themeStore";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoreInventory - Inventory Management",
  description: "Modern inventory management system",
};

const extractThemeFromCookie = (cookieHeader: string | null): Theme => {
  if (!cookieHeader) {
    return "light";
  }

  const match = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith("theme="));

  const value = match?.split("=")[1];
  return value === "dark" ? "dark" : "light";
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieHeader = (await headers()).get("cookie");
  const initialTheme: Theme = extractThemeFromCookie(cookieHeader);
  return (
    <html lang="en" data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
