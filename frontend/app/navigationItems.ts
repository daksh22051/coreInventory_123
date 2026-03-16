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
  Shield,
  Bell,
  LayoutGrid,
  Link2,
} from "lucide-react";

export interface NavItem {
  name: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  href: string;
  page: string | null;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Grouped navigation for better organization
export const navigationSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/", page: null },
      { name: "Products", icon: Package, href: "/?page=products", page: "products" },
      { name: "Warehouses", icon: Warehouse, href: "/?page=warehouses", page: "warehouses" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Receipts", icon: PackagePlus, href: "/?page=receipts", page: "receipts" },
      { name: "Delivery Orders", icon: Truck, href: "/?page=delivery-orders", page: "delivery-orders" },
      { name: "Transfers", icon: ArrowLeftRight, href: "/?page=transfers", page: "transfers" },
      { name: "Adjustments", icon: Scale, href: "/?page=adjustments", page: "adjustments" },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Analytics", icon: BarChart3, href: "/?page=analytics", page: "analytics" },
      { name: "Custom Dashboard", icon: LayoutGrid, href: "/?page=custom-dashboard", page: "custom-dashboard" },
      { name: "Move History", icon: History, href: "/?page=move-history", page: "move-history" },
      { name: "Audit Trail", icon: Shield, href: "/?page=audit-trail", page: "audit-trail" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Alerts", icon: Bell, href: "/?page=advanced-alerts", page: "advanced-alerts" },
      { name: "Integrations", icon: Link2, href: "/?page=api-integrations", page: "api-integrations" },
      { name: "Settings", icon: Settings, href: "/?page=settings", page: "settings" },
    ],
  },
];

// Flat list for backward compatibility
export const navigationItems = navigationSections.flatMap(section => section.items);
