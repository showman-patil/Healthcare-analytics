import React, { useRef, useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const notifications = [
  { id: 1, type: "critical", title: "Urgent: Blood Pressure Alert", message: "Your latest reading (160/100 mmHg) is above normal range. Please contact your doctor immediately.", time: "10 minutes ago", read: false },
  { id: 2, type: "warning", title: "Appointment Reminder", message: "You have an appointment with Dr. Sarah Johnson tomorrow at 9:00 AM. Please arrive 15 minutes early.", time: "2 hours ago", read: false },
  { id: 3, type: "info", title: "Lab Results Available", message: "Your blood panel results from March 22 are now available. View them in your health records.", time: "1 day ago", read: false },
  { id: 4, type: "success", title: "Prescription Refilled", message: "Your Atorvastatin 40mg prescription has been sent to your registered pharmacy.", time: "2 days ago", read: true },
  { id: 5, type: "warning", title: "Medication Reminder", message: "Remember to take your Metoprolol 25mg twice daily. Next dose is due at 6:00 PM today.", time: "3 hours ago", read: false },
  { id: 6, type: "info", title: "AI Health Insight", message: "Based on your recent data, our AI suggests increasing your daily water intake to support kidney function.", time: "3 days ago", read: true },
  { id: 7, type: "success", title: "Health Goal Achieved!", message: "Congratulations! You've maintained your blood pressure within normal range for 7 consecutive days.", time: "4 days ago", read: true },
];

export default function PatientNotifications() {
  const container = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState("all");

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const markRead = (id: number) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id: number) => {
    setItems(prev => prev.filter(n => n.id !== id));
  };

  const filtered = items.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "critical") return n.type === "critical";
    if (filter === "warning") return n.type === "warning";
    return true;
  });

  const unreadCount = items.filter(n => !n.read).length;

  const typeConfig = {
    critical: { icon: AlertTriangle, bg: "bg-red-50 border-red-200", icon_bg: "bg-red-100", icon_color: "text-red-600", badge: "bg-red-100 text-red-700" },
    warning: { icon: AlertTriangle, bg: "bg-yellow-50 border-yellow-200", icon_bg: "bg-yellow-100", icon_color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
    info: { icon: Info, bg: "bg-blue-50 border-blue-200", icon_bg: "bg-blue-100", icon_color: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
    success: { icon: CheckCircle, bg: "bg-green-50 border-green-200", icon_bg: "bg-green-100", icon_color: "text-green-600", badge: "bg-green-100 text-green-700" },
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 gsap-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">{unreadCount} unread alerts</p>
        </div>
        <button
          onClick={() => setItems(prev => prev.map(n => ({ ...n, read: true })))}
          className="premium-button-outline text-sm"
        >
          Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 gsap-in">
        {[
          { key: "all", label: `All (${items.length})` },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "critical", label: "Critical" },
          { key: "warning", label: "Warnings" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3 gsap-in">
        {filtered.length === 0 && (
          <div className="premium-card p-12 text-center text-muted-foreground">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p>No notifications to show</p>
          </div>
        )}
        {filtered.map((notif) => {
          const config = typeConfig[notif.type as keyof typeof typeConfig];
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              className={`flex gap-4 p-4 rounded-2xl border transition-all ${config.bg} ${!notif.read ? "shadow-sm" : "opacity-75"}`}
            >
              <div className={`w-10 h-10 rounded-xl ${config.icon_bg} flex items-center justify-center shrink-0`}>
                <Icon size={18} className={config.icon_color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-foreground">{notif.title}</span>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {notif.type}
                  </span>
                </div>
                <p className="text-sm text-foreground/80">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
                <button onClick={() => dismiss(notif.id)} className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center hover:bg-white/80 transition-colors">
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
