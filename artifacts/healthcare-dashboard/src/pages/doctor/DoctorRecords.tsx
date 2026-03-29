import React, { useRef } from "react";
import { Upload, FileText, Download, Clock, CheckCircle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const records = [
  { id: 1, patient: "John Martinez", type: "ECG Report", date: "Mar 22, 2026", status: "reviewed", size: "1.2 MB" },
  { id: 2, patient: "Mary Thompson", type: "Blood Panel Results", date: "Mar 20, 2026", status: "pending", size: "512 KB" },
  { id: 3, patient: "Robert Lee", type: "MRI Brain Scan", date: "Mar 18, 2026", status: "reviewed", size: "45 MB" },
  { id: 4, patient: "David Brown", type: "Echocardiogram", date: "Mar 15, 2026", status: "reviewed", size: "28 MB" },
  { id: 5, patient: "Linda Garcia", type: "CT Scan - Chest", date: "Mar 12, 2026", status: "pending", size: "62 MB" },
];

const timeline = [
  { date: "Mar 29, 2026", event: "Appointment - Cardiac Check-up", patient: "John Martinez", type: "appointment" },
  { date: "Mar 28, 2026", event: "Lab Results Received", patient: "Mary Thompson", type: "lab" },
  { date: "Mar 25, 2026", event: "Updated Prescription - Metformin 1000mg", patient: "James Jackson", type: "prescription" },
  { date: "Mar 22, 2026", event: "Uploaded ECG Report", patient: "John Martinez", type: "upload" },
  { date: "Mar 20, 2026", event: "Initial Consultation", patient: "Jennifer Wilson", type: "appointment" },
  { date: "Mar 18, 2026", event: "MRI Results Reviewed", patient: "Robert Lee", type: "lab" },
];

export default function DoctorRecords() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out"
    });
  }, { scope: container });

  const typeColor = (type: string) => ({
    appointment: "bg-blue-50 text-blue-700",
    lab: "bg-purple-50 text-purple-700",
    prescription: "bg-green-50 text-green-700",
    upload: "bg-orange-50 text-orange-700",
  }[type] ?? "bg-gray-50 text-gray-700");

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Medical Records</h1>
        <p className="text-muted-foreground mt-1">Patient reports, scans, and history</p>
      </div>

      {/* Upload Area */}
      <div className="premium-card p-6 gsap-in border-dashed border-2 border-border">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Upload size={24} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Upload Medical Documents</h3>
          <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload PDF, DICOM, JPEG files</p>
          <button className="premium-button text-sm">Browse Files</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Records Table */}
        <div className="lg:col-span-2 premium-card p-6 gsap-in">
          <h2 className="text-lg font-bold text-foreground mb-4">Patient Documents</h2>
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{record.type}</p>
                  <p className="text-xs text-muted-foreground">{record.patient} • {record.date} • {record.size}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {record.status === "reviewed" ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <Clock size={14} className="text-yellow-600" />
                  )}
                  <button className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors">
                    <Download size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="premium-card p-6 gsap-in">
          <h2 className="text-lg font-bold text-foreground mb-4">Activity Timeline</h2>
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="pt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor(item.type)} mb-1 inline-block`}>
                      {item.type}
                    </span>
                    <p className="text-sm font-medium text-foreground">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.patient} • {item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
