/**
 * NotificationContext — global notification store.
 * Persisted to localStorage. Used by seller navbar bell and admin dashboard.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getSellerNotifications } from "../services/api";

const NotificationContext = createContext(null);

function loadNotifs() {
  try { return JSON.parse(localStorage.getItem("pragati:notifications") || "[]"); }
  catch { return []; }
}

function saveNotifs(list) {
  try { localStorage.setItem("pragati:notifications", JSON.stringify(list)); } catch {}
}

function loadNotifEnabled() {
  try {
    const raw = localStorage.getItem("pragati:notificationsEnabled");
    return raw === null ? true : raw === "true";
  } catch { return true; }
}

function saveNotifEnabled(value) {
  try { localStorage.setItem("pragati:notificationsEnabled", value ? "true" : "false"); } catch {}
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadNotifs);
  const [notificationsEnabled, setNotificationsEnabled] = useState(loadNotifEnabled);

  useEffect(() => { saveNotifs(notifications); }, [notifications]);
  useEffect(() => { saveNotifEnabled(notificationsEnabled); }, [notificationsEnabled]);

  useEffect(() => {
    const sellerId = localStorage.getItem("pragati:selectedSeller") ? JSON.parse(localStorage.getItem("pragati:selectedSeller"))?.id : null;
    if (!sellerId || !notificationsEnabled) return;
    getSellerNotifications({ seller_id: sellerId })
      .then((items) => {
        if (items?.length) {
          setNotifications((prev) => {
            const merged = [...items.map((item) => ({ ...item, timestamp: item.timestamp || new Date().toISOString(), read: item.read ?? false }))];
            const existingIds = new Set(prev.map((item) => item.id));
            return [...merged.filter((item) => !existingIds.has(item.id)), ...prev].slice(0, 50);
          });
        }
      })
      .catch(() => {});
  }, [notificationsEnabled]);

  const addNotification = useCallback((notif) => {
    if (!notificationsEnabled) return;
    setNotifications(prev => {
      const next = [{ ...notif, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false }, ...prev];
      return next.slice(0, 50); // keep last 50
    });
  }, [notificationsEnabled]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, markRead, clearAll, unreadCount, notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
