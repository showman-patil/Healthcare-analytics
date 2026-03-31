import React, { useRef, useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { formatRelativeTime, usePortalData } from "@/lib/portal-data-context";

export default function DoctorNotifications() {
  const container = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const {
    dismissNotification,
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
  } = usePortalData();

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.06,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  const filtered = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    if (filter === "critical") return notification.type === "critical";
    if (filter === "warning") return notification.type === "warning";
    return true;
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const typeConfig = {
    critical: {
      icon: AlertTriangle,
      bg: "bg-red-50 border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badge: "bg-red-100 text-red-700",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50 border-yellow-200",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      badge: "bg-yellow-100 text-yellow-700",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      badge: "bg-blue-100 text-blue-700",
    },
    success: {
      icon: CheckCircle,
      bg: "bg-green-50 border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      badge: "bg-green-100 text-green-700",
    },
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount} unread doctor updates
          </p>
        </div>
        <button onClick={markAllNotificationsRead} className="premium-button-outline text-sm">
          Mark All as Read
        </button>
      </div>

      <div className="gsap-in flex gap-2">
        {[
          { key: "all", label: `All (${notifications.length})` },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "critical", label: "Critical" },
          { key: "warning", label: "Warnings" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="gsap-in space-y-3">
        {filtered.length === 0 ? (
          <div className="premium-card p-12 text-center text-muted-foreground">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>No notifications to show</p>
          </div>
        ) : null}

        {filtered.map((notification) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;

          return (
            <div
              key={notification.id}
              className={`flex gap-4 rounded-2xl border p-4 transition-all ${config.bg} ${
                !notification.read ? "shadow-sm" : "opacity-75"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
              >
                <Icon size={18} className={config.iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {notification.title}
                  </span>
                  {!notification.read ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${config.badge}`}>
                    {notification.type}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {!notification.read ? (
                  <button
                    onClick={() => markNotificationRead(notification.id)}
                    className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                  >
                    Mark read
                  </button>
                ) : null}
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 transition-colors hover:bg-white/80"
                >
                  <X size={13} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
