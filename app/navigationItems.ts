import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  Scale,
  History,
  Warehouse,
  BarChart3,
  Settings,
} from "lucide-react";

export const navigationItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/", page: null },
  { name: "Products", icon: Package, href: "/?page=products", page: "products" },
  { name: "Receipts", icon: PackagePlus, href: "/?page=receipts", page: "receipts" },
  { name: "Delivery Orders", icon: Truck, href: "/?page=delivery-orders", page: "delivery-orders" },
  { name: "Transfers", icon: ArrowLeftRight, href: "/?page=transfers", page: "transfers" },
  { name: "Adjustments", icon: Scale, href: "/?page=adjustments", page: "adjustments" },
  { name: "Move History", icon: History, href: "/?page=move-history", page: "move-history" },
  { name: "Warehouses", icon: Warehouse, href: "/?page=warehouses", page: "warehouses" },
  { name: "Analytics", icon: BarChart3, href: "/?page=analytics", page: "analytics" },
  { name: "Settings", icon: Settings, href: "/?page=settings", page: "settings" },
];
