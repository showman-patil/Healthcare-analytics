import React, { useRef, useState } from "react";
import { Download, FileText, Activity, Filter, Search, CheckCircle, Clock, AlertCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const reports = [
  { id: 1, name: "Monthly Patient Summary - March 2026", type: "Patient Report", format: "PDF", size: "2.4 MB", generated: "Mar 28, 2026", status: "ready" },
  { id: 2, name: "Disease Trend Analysis Q1 2026", type: "Analytics", format: "PDF", size: "1.8 MB", generated: "Mar 25, 2026", status: "ready" },
  { id: 3, name: "Hospital Resource Utilization", type: "Operations", format: "CSV", size: "512 KB", generated: "Mar 22, 2026", status: "ready" },
  { id: 4, name: "Doctor Performance Review", type: "Staff Report", format: "PDF", size: "3.1 MB", generated: "Mar 20, 2026", status: "ready" },
  { id: 5, name: "Critical Cases Log - March 2026", type: "Clinical", format: "CSV", size: "256 KB", generated: "Mar 18, 2026", status: "ready" },
  { id: 6, name: "AI Prediction Accuracy Report", type: "Analytics", format: "PDF", size: "1.2 MB", generated: "Mar 15, 2026", status: "generating" },
];

const activityLogs = [
  { id: 1, user: "Dr. Sarah Johnson", action: "Viewed patient record - John Martinez", time: "Mar 29, 2026 09:14 AM", type: "view", ip: "192.168.1.45" },
  { id: 2, user: "Admin User", action: "Updated doctor profile - Dr. Michael Chen", time: "Mar 29, 2026 08:52 AM", type: "update", ip: "192.168.1.2" },
  { id: 3, user: "Dr. Emily Rodriguez", action: "Created appointment for Sarah Williams", time: "Mar 28, 2026 04:30 PM", type: "create", ip: "192.168.1.67" },
  { id: 4, user: "System", action: "Automated backup completed successfully", time: "Mar 28, 2026 02:00 AM", type: "system", ip: "localhost" },
  { id: 5, user: "Admin User", action: "Exported patient data - March batch", time: "Mar 27, 2026 03:15 PM", type: "export", ip: "192.168.1.2" },
  { id: 6, user: "Dr. Aisha Patel", action: "Updated treatment plan - Linda Garcia", time: "Mar 27, 2026 11:30 AM", type: "update", ip: "192.168.1.89" },
  { id: 7, user: "System", action: "AI model prediction batch run completed", time: "Mar 26, 2026 06:00 AM", type: "system", ip: "localhost" },
  { id: 8, user: "Admin User", action: "New doctor account created - Dr. James Wilson", time: "Mar 25, 2026 10:00 AM", type: "create", ip: "192.168.1.2" },
];

export default function AdminReports() {
  const container = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: "power3.out"
    });
  }, { scope: container });

  const filteredLogs = activityLogs.filter(log =>
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "view": return "bg-blue-50 text-blue-700 border-blue-200";
      case "update": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "create": return "bg-green-50 text-green-700 border-green-200";
      case "export": return "bg-purple-50 text-purple-700 border-purple-200";
      case "system": return "bg-gray-50 text-gray-700 border-gray-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Reports & Logs</h1>
        <p className="text-muted-foreground mt-1">Download reports and monitor system activity</p>
      </div>

      {/* Download Reports */}
      <div className="premium-card p-6 gsap-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Available Reports</h2>
          <button className="premium-button text-xs px-4 py-2 flex items-center gap-2">
            <Download size={14} />
            Generate New Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider">Report Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider hidden md:table-cell">Format</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider hidden lg:table-cell">Generated</th>
                <th className="text-left text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-2 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">{report.type}</span>
                  </td>
                  <td className="py-3.5 px-2 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      report.format === "PDF" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                    }`}>{report.format}</span>
                  </td>
                  <td className="py-3.5 px-2 hidden lg:table-cell text-sm text-muted-foreground">{report.generated}</td>
                  <td className="py-3.5 px-2">
                    {report.status === "ready" ? (
                      <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle size={12} /> Ready</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-700"><Clock size={12} /> Generating...</span>
                    )}
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button className={`flex items-center gap-1.5 ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      report.status === "ready"
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}>
                      <Download size={12} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="premium-card p-6 gsap-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">System Activity Log</h2>
            <p className="text-sm text-muted-foreground">All user actions and system events</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2 w-full sm:w-auto">
            <Search size={14} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full sm:w-48"
            />
          </div>
        </div>
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                <Activity size={14} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{log.user}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTypeColor(log.type)}`}>
                    {log.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{log.action}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</p>
                <p className="text-xs text-muted-foreground/60">{log.ip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
