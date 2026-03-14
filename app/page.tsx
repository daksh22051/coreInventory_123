"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";
import AppLayout from "./AppLayout";
import DashboardPage from "./DashboardPage";
import ProductsPage from "./ProductsPage";
import SettingsPage from "./SettingsPage";
import AnalyticsPage from "./AnalyticsPage";
import LoginPage from "./LoginPage";
import ReceiptsPage from "./ReceiptsPage";
import DeliveryOrdersPage from "./DeliveryOrdersPage";
import TransfersPage from "./TransfersPage";
import AdjustmentsPage from "./AdjustmentsPage";
import MoveHistoryPage from "./MoveHistoryPage";
import WarehousesPage from "./WarehousesPage";

function renderPage(page: string | null) {
  switch (page) {
    case "products":
      return <ProductsPage />;
    case "settings":
      return <SettingsPage />;
    case "analytics":
      return <AnalyticsPage />;
    case "receipts":
      return <ReceiptsPage />;
    case "delivery-orders":
      return <DeliveryOrdersPage />;
    case "transfers":
      return <TransfersPage />;
    case "adjustments":
      return <AdjustmentsPage />;
    case "move-history":
      return <MoveHistoryPage />;
    case "warehouses":
      return <WarehousesPage />;
    default:
      return <DashboardPage />;
  }
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams.get("page");
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && _hasHydrated && isAuthenticated && page === "login") {
      router.replace("/");
    }
  }, [mounted, _hasHydrated, isAuthenticated, page, router]);

  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent-indigo)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (page === "login" && !isAuthenticated) {
    return <LoginPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout currentPage={page}>
      {renderPage(page)}
    </AppLayout>
  );
}
