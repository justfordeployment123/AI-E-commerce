"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

const TRADE_IN_TYPES = new Set(["trade_in_approved", "trade_in_rejected", "trade_in_counter_offer"]);
const REPAIR_TYPES   = new Set(["repair_quote_sent", "repair_in_progress", "repair_completed", "repair_cancelled"]);

function notifLink(notif: AppNotification): string {
  if (TRADE_IN_TYPES.has(notif.type) && notif.data?.tradeInId)
    return `/account/trade-ins/${notif.data.tradeInId}`;
  if (REPAIR_TYPES.has(notif.type) && notif.data?.repairId)
    return `/account/repairs/${notif.data.repairId}`;
  return "/account";
}

function fireBrowserNotification(notif: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const url = notifLink(notif);
  const options = { body: notif.body, icon: "/icon.png", tag: notif.id };

  // Chrome silently blocks new Notification() when a service worker controls the page —
  // must use registration.showNotification() in that case.
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready
      .then(reg => reg.showNotification(notif.title, { ...options, data: { url } }))
      .catch(() => {
        const n = new Notification(notif.title, options);
        n.onclick = () => { window.focus(); window.location.href = url; };
      });
    return;
  }

  const n = new Notification(notif.title, options);
  n.onclick = () => { window.focus(); window.location.href = url; };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ts_token");
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  // Request browser notification permission once authenticated
  useEffect(() => {
    if (!getToken()) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch existing notifications on mount
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: AppNotification[]) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Open SSE connection with auto-reconnect (exponential backoff)
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const token = getToken();
      if (!token) return;

      const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.onopen = () => { reconnectAttemptRef.current = 0; };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === "__ping__") return; // heartbeat, not a real notification
          const notif = parsed as AppNotification;
          setNotifications(prev => [notif, ...prev]);
          fireBrowserNotification(notif);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        if (cancelled) return;
        const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      esRef.current?.close();
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead };
}
