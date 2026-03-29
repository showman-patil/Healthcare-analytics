import React, { useRef } from "react";
import { FileText, Download, Pill, Clock } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const reports = [
  { id: 1, name: "Blood Panel - Complete Metabolic", date: "Mar 22, 2026", doctor: "Dr. Sarah Johnson", type: "Lab Report" },
  { id: 2, name: "ECG - 12 Lead", date: "Mar 15, 2026", doctor: "Dr. Sarah Johnson", type: "Cardiac" },
  { id: 3, name: "Chest X-Ray", date: "Feb 28, 2026", doctor: "Dr. James Wilson", type: "Imaging" },
  { id: 4, name: "Lipid Panel Results", date: "Jan 15, 2026", doctor: "Dr. Sarah Johnson", type: "Lab Report" },
];

const prescriptions = [
  { id: 1, drug: "Atorvastatin 40mg", dosage: "Once daily at night", prescriber: "Dr. Sarah Johnson", since: "Mar 15, 2026", refills: 3 },
  { id: 2, drug: "Aspirin 81mg", dosage: "Once daily with food", prescriber: "Dr. Sarah Johnson", since: "Mar 15, 2026", refills: 6 },
  { id: 3, drug: "Metoprolol 25mg", dosage: "Twice daily", prescriber: "Dr. Sarah Johnson", since: "Mar 1, 2026", refills: 2 },
];

const timeline = [
  { date: "Mar 29, 2026", event: "Scheduled: Cardiology Follow-up", type: "upcoming" },
  { date: "Mar 22, 2026", event: "Lab results received - All values improving", type: "lab" },
  { date: "Mar 15, 2026", event: "Cardiac Assessment - ECG performed", type: "visit" },
  { date: "Mar 1, 2026", event: "Medication adjusted - Metoprolol added", type: "prescription" },
  { date: "Feb 20, 2026", event: "Initial Cardiology Consultation", type: "visit" },
];

export default function PatientRecords() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const typeColor = (type: string) => ({
    upcoming: "bg-blue-50 text-blue-700",
    lab: "bg-purple-50 text-purple-700",
    visit: "bg-green-50 text-green-700",
    prescription: "bg-orange-50 text-orange-700",
  }[type] ?? "bg-gray-50 text-gray-700");

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">My Health Records</h1>
        <p className="text-muted-foreground mt-1">Your medical reports, prescriptions and history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports */}
        <div className="premium-card p-6 gsap-in">
          <h2 className="text-lg font-bold text-foreground mb-4">Medical Reports</h2>
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.doctor} • {r.date}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">{r.type}</span>
                <button className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted shrink-0">
                  <Download size={13} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="premium-card p-6 gsap-in">
          <h2 className="text-lg font-bold text-foreground mb-4">Active Prescriptions</h2>
          <div className="space-y-3">
            {prescriptions.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-border/60 bg-muted/20">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <Pill size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{p.drug}</p>
                    <p className="text-xs text-muted-foreground mb-2">{p.dosage}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>By: <span className="font-medium text-foreground">{p.prescriber}</span></span>
                      <span>Refills: <span className="font-medium text-green-600">{p.refills}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Timeline */}
      <div className="premium-card p-6 gsap-in">
        <h2 className="text-lg font-bold text-foreground mb-5">Health History Timeline</h2>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-5">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 relative">
                <div className="w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 z-10">
                  <Clock size={13} className="text-primary" />
                </div>
                <div className="pt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${typeColor(item.type)}`}>
                    {item.type}
                  </span>
                  <p className="text-sm font-medium text-foreground">{item.event}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
