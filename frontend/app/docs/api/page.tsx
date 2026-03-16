"use client";

import { motion } from "framer-motion";
import { Shield, Boxes, Warehouse, ShoppingCart, Link2, KeyRound } from "lucide-react";

const sections = [
  {
    title: "Authentication",
    icon: KeyRound,
    endpoints: ["POST /api/auth/login", "POST /api/auth/signup", "GET /api/auth/me"],
  },
  {
    title: "Products API",
    icon: Boxes,
    endpoints: ["GET /api/products", "POST /api/products", "PUT /api/products/:id", "DELETE /api/products/:id"],
  },
  {
    title: "Inventory API",
    icon: Shield,
    endpoints: ["GET /api/adjustments", "POST /api/adjustments", "GET /api/analytics/stock-movement"],
  },
  {
    title: "Warehouse API",
    icon: Warehouse,
    endpoints: ["GET /api/warehouses", "POST /api/warehouses", "PUT /api/warehouses/:id"],
  },
  {
    title: "Orders API",
    icon: ShoppingCart,
    endpoints: ["GET /api/deliveries", "POST /api/deliveries", "POST /api/transfers", "GET /api/receipts"],
  },
  {
    title: "Webhooks",
    icon: Link2,
    endpoints: ["POST /api/integrations/:id/configure", "POST /api/integrations/:id/connect", "POST /api/integrations/:id/disconnect"],
  },
];

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen p-6 md:p-10 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] p-6 md:p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">API Documentation</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            CoreInventory API reference for integrations and automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
                className="rounded-2xl border border-[var(--glass-border)] bg-[var(--card-bg)] p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[var(--hover-bg)]">
                    <Icon className="w-5 h-5 text-[var(--text-primary)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.endpoints.map((endpoint) => (
                    <li
                      key={endpoint}
                      className="font-mono text-sm px-3 py-2 rounded-lg bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                    >
                      {endpoint}
                    </li>
                  ))}
                </ul>
              </motion.section>
            );
          })}
        </div>
      </motion.div>
    </main>
  );
}
