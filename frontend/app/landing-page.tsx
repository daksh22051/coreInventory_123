"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    title: "Unified Inventory View",
    description:
      "Track stock, inbound receipts, and orders from one intelligent dashboard with predictive health insights.",
  },
  {
    title: "Flexible Warehousing",
    description:
      "Define unlimited warehouses, optimize space utilization, and orchestrate fulfillment with granular permissions.",
  },
  {
    title: "Smart Alerts",
    description:
      "Automatic thresholds keep you ahead of low stock, aging SKUs, and shipment delays with contextual notifications.",
  },
];

const stats = [
  { label: "Active SKUs", value: "28,400" },
  { label: "Warehouses", value: "48" },
  { label: "Avg Fulfillment Time", value: "6 hrs" },
  { label: "Forecast Accuracy", value: "97%" },
];

const timeline = [
  { title: "Connect", description: "Link ERPs, POS, and carrier APIs in minutes with pre-built connectors." },
  { title: "Calibrate", description: "Smart algorithms learn usage trends and suggest optimal buffer stock." },
  { title: "Act", description: "Make confident transfers, purchase recommendations, and fulfillment decisions." },
];

const integrations = ["Shopify", "QuickBooks", "ShipStation", "NetSuite", "Amazon", "BigCommerce"];

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900 to-black" />
        <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-[#14b8a6]/60 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6 lg:max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">CoreInventory</p>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Run inventory with a single pane of intelligent controls.
              </h1>
              <p className="text-lg text-slate-300">
                Predict demand, automate replenishment, and orchestrate fulfillment across every warehouse with silky-smooth
                UX crafted for discerning supply chain teams.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  Request a Demo
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                >
                  Browse Features
                </Link>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-xl rounded-[28px] border border-white/10 bg-white/5 p-1 backdrop-blur-md sm:p-2"
            >
              <div className="rounded-[26px] bg-slate-900/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.65)]">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Realtime Pulse</p>
                <div className="mt-5 grid gap-4 text-white">
                  <div className="flex items-center justify-between">
                    <span>Inventory health</span>
                    <strong>99.2%</strong>
                  </div>
                  <div className="h-1 rounded-full bg-slate-700">
                    <div className="h-1 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: "92%" }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Orders synced</span>
                    <strong>4,682</strong>
                  </div>
                  <div className="h-1 rounded-full bg-slate-700">
                    <div className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: "74%" }} />
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last synced</span>
                    <span>12s ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map(stat => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-[22px] border border-white/5 bg-white/5 p-5 backdrop-blur"
              >
                <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{stat.label}</p>
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.15 }}
          className="space-y-8"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-teal-300">Capabilities</p>
            <h2 className="text-3xl font-semibold text-white">Everything you need to keep stock served, sane, and secure.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(feature => (
              <motion.div
                key={feature.title}
                variants={sectionVariants}
                className="flex flex-col gap-3 rounded-[24px] border border-white/5 bg-gradient-to-b from-white/10 to-transparent p-6 backdrop-blur"
              >
                <p className="text-sm font-semibold text-white/80">{feature.title}</p>
                <p className="text-sm text-slate-300">{feature.description}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-300">Powerful</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.14 }}
          className="space-y-10"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">Workflow</p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              Automate the rhythm of replenishment, validation, and fulfillment.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {timeline.map(item => (
              <motion.div
                key={item.title}
                variants={sectionVariants}
                className="rounded-[26px] border border-white/5 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">Integrations</p>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Connect your entire tech stack.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {integrations.map(name => (
              <motion.span
                key={name}
                variants={sectionVariants}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="rounded-[32px] border border-white/5 bg-gradient-to-br from-white/5 to-white/0 p-1 backdrop-blur">
            <div className="rounded-[30px] bg-slate-900/70 p-8 md:flex md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">Case Study</p>
                <h3 className="text-2xl font-semibold text-white md:text-3xl">Hazel Logistics scaled 3x without a single stockout.</h3>
                <p className="text-sm text-slate-300">
                  Real-time analytics exposed supply gaps and automated lead time buffers, letting the operations team focus on high-value work.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3 md:mt-0">
                <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs text-slate-200">Read story</span>
                <span className="text-sm font-semibold text-teal-300">+28% accuracy</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section className="space-y-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">Start today</p>
                <h2 className="text-3xl font-semibold text-white">Bring visibility, automation, and delight to your supply chain teams.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900">
                  Schedule a walkthrough
                </Link>
                <Link href="/" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white">
                  Explore admin experience
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
