import React, { useRef, useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw, Plus } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListAppointments } from "@workspace/api-client-react";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status] ?? styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DoctorAppointments() {
  const container = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const { data: appointments = MOCK_APPOINTMENTS } = useListAppointments();

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const filtered = appointments.filter(a => filter === "all" || a.status === filter);
  const today = appointments.filter(a => a.status === "scheduled").slice(0, 4);

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 gsap-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage your schedule and patient appointments</p>
        </div>
        <button className="premium-button flex items-center gap-2 text-sm">
          <Plus size={15} />
          New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 gsap-in">
        {[
          { label: "Today", value: today.length.toString(), icon: Calendar, color: "bg-blue-50 text-blue-600" },
          { label: "Scheduled", value: appointments.filter(a => a.status === "scheduled").length.toString(), icon: Clock, color: "bg-indigo-50 text-indigo-600" },
          { label: "Completed", value: appointments.filter(a => a.status === "completed").length.toString(), icon: CheckCircle, color: "bg-green-50 text-green-600" },
          { label: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length.toString(), icon: XCircle, color: "bg-red-50 text-red-600" },
        ].map(item => (
          <div key={item.label} className="premium-card p-4">
            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center mb-2`}>
              <item.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 gsap-in">
        {["all", "scheduled", "completed", "cancelled", "pending"].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      <div className="premium-card p-6 gsap-in">
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No appointments found</div>
          )}
          {filtered.map((appt) => (
            <div key={appt.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {(appt.patientName ?? "P").charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{appt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{appt.type ?? "Consultation"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm shrink-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar size={13} />
                  <span>{appt.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={13} />
                  <span>{appt.time}</span>
                </div>
              </div>
              <StatusBadge status={appt.status} />
              <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <RefreshCw size={11} /> Reschedule
                </button>
                <button className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                  <XCircle size={11} /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
