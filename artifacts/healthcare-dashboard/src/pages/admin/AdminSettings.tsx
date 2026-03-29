import React, { useRef, useState } from "react";
import { Bell, Shield, Settings, Database, Mail, Clock, Save } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-5" : "left-1"}`} />
    </button>
  );
}

export default function AdminSettings() {
  const container = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    criticalNotifications: true,
    appointmentReminders: true,
    systemUpdates: true,
    aiPredictions: true,
    twoFactor: false,
    auditLogging: true,
    dataEncryption: true,
    autoBackup: true,
    backupFrequency: "daily",
    sessionTimeout: "30",
    maxLoginAttempts: "5",
  });

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: "power3.out"
    });
  }, { scope: container });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">Manage notifications, permissions, and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">Manage alert preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Email Alerts", desc: "Receive alerts via email", key: "emailAlerts" },
              { label: "SMS Alerts", desc: "Receive alerts via SMS", key: "smsAlerts" },
              { label: "Critical Patient Alerts", desc: "Immediate alerts for critical cases", key: "criticalNotifications" },
              { label: "Appointment Reminders", desc: "Automated appointment notifications", key: "appointmentReminders" },
              { label: "System Updates", desc: "Notifications for system changes", key: "systemUpdates" },
              { label: "AI Prediction Alerts", desc: "Alerts when high risk is detected", key: "aiPredictions" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={() => toggle(item.key as keyof typeof settings)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Shield size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Security & Access</h2>
              <p className="text-xs text-muted-foreground">Authentication and security settings</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Two-Factor Authentication", desc: "Require 2FA for all admin logins", key: "twoFactor" },
              { label: "Audit Logging", desc: "Log all user actions in detail", key: "auditLogging" },
              { label: "Data Encryption", desc: "Encrypt sensitive patient data at rest", key: "dataEncryption" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/60">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Toggle
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={() => toggle(item.key as keyof typeof settings)}
                />
              </div>
            ))}
            <div className="py-2 border-b border-border/60">
              <label className="text-sm font-medium text-foreground block mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={e => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="py-2">
              <label className="text-sm font-medium text-foreground block mb-1">Max Login Attempts</label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={e => setSettings(prev => ({ ...prev, maxLoginAttempts: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Database size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Data Management</h2>
              <p className="text-xs text-muted-foreground">Backup and data policies</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <div>
                <p className="text-sm font-medium text-foreground">Automatic Backup</p>
                <p className="text-xs text-muted-foreground">Schedule regular data backups</p>
              </div>
              <Toggle checked={settings.autoBackup} onChange={() => toggle("autoBackup")} />
            </div>
            <div className="py-2">
              <label className="text-sm font-medium text-foreground block mb-2">Backup Frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={e => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs font-semibold text-green-800">Last Backup</p>
              <p className="text-sm text-green-700 mt-0.5">Mar 29, 2026 at 2:00 AM — Successful</p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="premium-card p-6 gsap-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Settings size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Role Permissions</h2>
              <p className="text-xs text-muted-foreground">Access control per role</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { role: "Admin", permissions: ["Full Access", "User Management", "Reports", "Settings"] },
              { role: "Doctor", permissions: ["Patient Records", "AI Diagnosis", "Appointments", "Messages"] },
              { role: "Patient", permissions: ["Own Records", "Symptom Checker", "Booking", "Notifications"] },
            ].map((roleItem) => (
              <div key={roleItem.role} className="p-4 rounded-xl border border-border bg-muted/20">
                <p className="text-sm font-bold text-foreground mb-2">{roleItem.role}</p>
                <div className="flex flex-wrap gap-1.5">
                  {roleItem.permissions.map(perm => (
                    <span key={perm} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gsap-in">
        <button className="premium-button flex items-center gap-2">
          <Save size={16} />
          Save All Settings
        </button>
      </div>
    </div>
  );
}
