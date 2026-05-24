"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Package, RefreshCw, Wrench, ChevronRight } from "lucide-react";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import Link from "next/link";

function formatTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  accent: string;
  bg: string;
  baseLink: string;
  idKey?: string;
}> = {
  trade_in_approved: {
    icon: <CheckCheck className="h-4 w-4" />,
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
    baseLink: "/account/trade-ins",
    idKey: "tradeInId",
  },
  trade_in_rejected: {
    icon: <RefreshCw className="h-4 w-4" />,
    accent: "text-red-500",
    bg: "bg-red-50",
    baseLink: "/account/trade-ins",
    idKey: "tradeInId",
  },
  trade_in_counter_offer: {
    icon: <RefreshCw className="h-4 w-4" />,
    accent: "text-amber-600",
    bg: "bg-amber-50",
    baseLink: "/account/trade-ins",
    idKey: "tradeInId",
  },
  repair_quote_sent: {
    icon: <Wrench className="h-4 w-4" />,
    accent: "text-blue-600",
    bg: "bg-blue-50",
    baseLink: "/account/repairs",
    idKey: "repairId",
  },
  repair_in_progress: {
    icon: <Wrench className="h-4 w-4" />,
    accent: "text-amber-600",
    bg: "bg-amber-50",
    baseLink: "/account/repairs",
    idKey: "repairId",
  },
  repair_completed: {
    icon: <Wrench className="h-4 w-4" />,
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
    baseLink: "/account/repairs",
    idKey: "repairId",
  },
};

function NotifItem({ notif, onClose, markRead }: {
  notif: AppNotification;
  onClose: () => void;
  markRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? {
    icon: <Package className="h-4 w-4" />,
    accent: "text-zinc-500",
    bg: "bg-zinc-100",
    baseLink: "/account",
  };

  const link = cfg.idKey && notif.data?.[cfg.idKey]
    ? `${cfg.baseLink}/${notif.data[cfg.idKey]}`
    : cfg.baseLink;

  return (
    <Link
      href={link}
      onClick={() => { markRead(notif.id); onClose(); }}
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors ${!notif.read ? "bg-zinc-50/60" : ""}`}
    >
      <div className={`shrink-0 h-9 w-9 rounded-xl ${cfg.bg} ${cfg.accent} flex items-center justify-center mt-0.5`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12.5px] font-semibold text-zinc-900 leading-snug">{notif.title}</p>
          <span className="text-[10px] text-zinc-400 shrink-0 mt-0.5">{formatTime(notif.createdAt)}</span>
        </div>
        <p className="text-[11.5px] text-zinc-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
      </div>
      {!notif.read && (
        <div className="shrink-0 w-2 h-2 rounded-full bg-lime-400 mt-2 shadow-[0_0_0_3px_rgba(163,230,53,0.2)]" />
      )}
    </Link>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function requestBrowserPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      prevCountRef.current = notifications.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <motion.button
        onClick={handleOpen}
        animate={shake ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex items-center justify-center h-10 w-10 rounded-[14px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
        title="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-0.5 -right-0.5 min-w-4.25 h-4.25 flex items-center justify-center px-1 text-[9px] font-bold text-black bg-[#d7ff5f] rounded-full leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="fixed right-4 top-17 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl border border-zinc-200 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] overflow-hidden z-9999"
            >
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-zinc-900">Notifications</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); markAllRead(); }}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Browser permission prompt */}
              {notifPermission !== "granted" && (
                <div className="px-4 py-3 bg-zinc-950 flex items-center gap-3">
                  <Bell className="h-4 w-4 text-[#d7ff5f] shrink-0" strokeWidth={1.8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold text-white leading-snug">
                      {notifPermission === "denied"
                        ? "Notifications blocked in browser settings"
                        : "Get notified outside this tab"}
                    </p>
                    {notifPermission !== "denied" && (
                      <p className="text-[10.5px] text-zinc-400 mt-0.5">Trade-in & repair updates pop up even when you're away</p>
                    )}
                  </div>
                  {notifPermission !== "denied" && (
                    <button
                      onClick={e => { e.stopPropagation(); requestBrowserPermission(); }}
                      className="shrink-0 h-7 px-3 rounded-lg bg-[#d7ff5f] text-black text-[11px] font-bold hover:bg-lime-300 transition-colors"
                    >
                      Allow
                    </button>
                  )}
                </div>
              )}

              {/* List */}
              <div className="max-h-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-14 flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-zinc-300" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-zinc-400">No notifications yet</p>
                      <p className="text-[11px] text-zinc-300 mt-1">Trade-in and repair updates appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {notifications.map(n => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onClose={() => setOpen(false)}
                        markRead={markRead}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-zinc-100 text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  View account
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
