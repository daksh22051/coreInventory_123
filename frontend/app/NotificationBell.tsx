"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, AlertTriangle, Package, Truck, ArrowRightLeft, Info } from "lucide-react";
import { useSocket } from "./useSocket";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.token) {
          headers.Authorization = "Bearer " + parsed.state.token;
        }
      } catch {}
    }
  }
  return headers;
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  isRead: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "low_stock": return AlertTriangle;
    case "expiring_inventory": return Package;
    case "delayed_delivery": return Truck;
    case "transfer_complete": return ArrowRightLeft;
    default: return Info;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-500";
    case "warning": return "bg-amber-400";
    default: return "bg-blue-400";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { on, off } = useSocket();

  // Generate notifications from real system data
  const generateSystemNotifications = useCallback(async (): Promise<Notification[]> => {
    const generatedNotifications: Notification[] = [];
    const now = new Date().toISOString();

    try {
      // Fetch low stock products
      const lowStockRes = await fetch(`${API_BASE}/api/products?lowStock=true&limit=5`, {
        headers: getAuthHeaders(),
      });
      if (lowStockRes.ok) {
        const lowStockData = await lowStockRes.json();
        const lowStockProducts = lowStockData.data || lowStockData.products || [];
        lowStockProducts.forEach((product: { _id: string; name: string; stockQuantity?: number; stock?: number }, index: number) => {
          generatedNotifications.push({
            _id: `low_stock_${product._id}`,
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${product.name} has only ${product.stockQuantity ?? product.stock ?? 0} units remaining`,
            severity: (product.stockQuantity ?? product.stock ?? 0) < 5 ? "critical" : "warning",
            isRead: false,
            createdAt: new Date(Date.now() - index * 3600000).toISOString(),
            entityType: "product",
            entityId: product._id,
          });
        });
      }
    } catch {}

    try {
      // Fetch recent receipts
      const receiptsRes = await fetch(`${API_BASE}/api/receipts?limit=3&sort=-createdAt`, {
        headers: getAuthHeaders(),
      });
      if (receiptsRes.ok) {
        const receiptsData = await receiptsRes.json();
        const receipts = receiptsData.data || [];
        receipts.forEach((receipt: { _id: string; receiptNumber?: string; supplier?: string; status?: string; createdAt?: string }, index: number) => {
          if (receipt.status === "pending") {
            generatedNotifications.push({
              _id: `receipt_${receipt._id}`,
              type: "transfer_complete",
              title: "Pending Receipt",
              message: `Receipt ${receipt.receiptNumber || receipt._id.slice(-6)} from ${receipt.supplier || "supplier"} awaits validation`,
              severity: "info",
              isRead: false,
              createdAt: receipt.createdAt || new Date(Date.now() - index * 7200000).toISOString(),
              entityType: "receipt",
              entityId: receipt._id,
            });
          }
        });
      }
    } catch {}

    try {
      // Fetch pending delivery orders
      const deliveryRes = await fetch(`${API_BASE}/api/delivery-orders?status=pending&limit=3`, {
        headers: getAuthHeaders(),
      });
      if (deliveryRes.ok) {
        const deliveryData = await deliveryRes.json();
        const deliveries = deliveryData.data || [];
        deliveries.forEach((delivery: { _id: string; orderNumber?: string; orderId?: string; customer?: string; createdAt?: string }, index: number) => {
          generatedNotifications.push({
            _id: `delivery_${delivery._id}`,
            type: "delayed_delivery",
            title: "Pending Delivery",
            message: `Order ${delivery.orderNumber || delivery.orderId || delivery._id.slice(-6)} for ${delivery.customer || "customer"} is pending`,
            severity: "warning",
            isRead: false,
            createdAt: delivery.createdAt || new Date(Date.now() - index * 5400000).toISOString(),
            entityType: "delivery",
            entityId: delivery._id,
          });
        });
      }
    } catch {}

    // Add a welcome notification if no others exist
    if (generatedNotifications.length === 0) {
      generatedNotifications.push({
        _id: "welcome_1",
        type: "info",
        title: "Welcome to CoreInventory",
        message: "Your inventory management dashboard is ready. Start by adding products!",
        severity: "info",
        isRead: false,
        createdAt: now,
      });
    }

    return generatedNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=10`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setNotifications(data.data);
          return;
        }
      }
      // Fallback: generate notifications from system data
      const generated = await generateSystemNotifications();
      setNotifications(generated);
    } catch {
      // On error, try to generate from system data
      const generated = await generateSystemNotifications();
      setNotifications(generated);
    }
  }, [generateSystemNotifications]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.count !== undefined) {
          setUnreadCount(data.data.count);
          return;
        }
      }
      // Count unread from current notifications
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    } catch {
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update unread count when notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Listen for real-time notifications
  useEffect(() => {
    const handler = () => {
      fetchNotifications();
      fetchUnreadCount();
      setBellAnimating(true);
      setTimeout(() => setBellAnimating(false), 800);
    };
    on("notification:new", handler);
    return () => off("notification:new", handler);
  }, [on, off, fetchNotifications, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const dismissNotification = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      fetchUnreadCount();
    } catch {}
  };

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setBellAnimating(true);
            setTimeout(() => setBellAnimating(false), 800);
          }
        }}
        className="relative p-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--hover-bg)]
          hover:border-[var(--glass-border-hover)] hover:shadow-lg hover:shadow-[var(--glow-cyan)]
          transition-all duration-300"
      >
        <Bell size={18} className={`text-[var(--text-secondary)] ${bellAnimating ? "bell-wiggle" : ""}`} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
              bg-red-500 rounded-full text-[10px] text-white font-bold px-1
              border-2 border-[var(--background)]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-3 w-80
              bg-[var(--card-bg)] backdrop-blur-xl
              rounded-2xl border border-[var(--glass-border)]
              shadow-2xl shadow-black/30 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between
              bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-muted)]
                      hover:text-[var(--text-primary)] transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="p-8 text-center text-[var(--text-muted)] text-sm">
                  No notifications
                </li>
              ) : (
                notifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.li
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 border-b border-[var(--glass-border)] last:border-0
                        hover:bg-[var(--hover-bg)] cursor-pointer transition-colors group
                        ${!notification.isRead ? "bg-[var(--hover-bg)]/50" : ""}`}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityColor(notification.severity)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                            <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                              {notification.title}
                            </p>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo(notification.createdAt)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissNotification(notification._id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10
                            text-[var(--text-muted)] hover:text-red-400 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.li>
                  );
                })
              )}
            </ul>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-[var(--glass-border)]">
                <button className="w-full py-2 text-sm text-emerald-600 hover:text-teal-600 font-medium transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
