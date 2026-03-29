import React, { useRef, useState } from "react";
import { Search, Filter, Eye, Edit, UserPlus, Heart, AlertTriangle } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListPatients } from "@workspace/api-client-react";
import { MOCK_PATIENTS } from "@/lib/mock-data";

function RiskBadge({ level }: { level: string }) {
  const classes: Record<string, string> = {
    critical: "risk-critical",
    high: "risk-high",
    medium: "risk-medium",
    low: "risk-low",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${classes[level] ?? "risk-low"}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export default function DoctorPatients() {
  const container = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const { data: patients = MOCK_PATIENTS } = useListPatients();

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: "power3.out"
    });
  }, { scope: container });

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.condition ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || p.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 gsap-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Patients</h1>
          <p className="text-muted-foreground mt-1">Manage and review your assigned patients</p>
        </div>
        <button className="premium-button flex items-center gap-2 text-sm">
          <UserPlus size={15} />
          Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 gsap-in">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 flex-1">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or condition..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alert: critical patients */}
      {filtered.filter(p => p.riskLevel === "critical").length > 0 && (
        <div className="gsap-in flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {filtered.filter(p => p.riskLevel === "critical").length} patient(s) in critical condition require immediate attention
          </p>
        </div>
      )}

      {/* Patient Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 gsap-in">
        {filtered.map((patient) => (
          <div key={patient.id} className="premium-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.age}yr • {patient.gender}</p>
                </div>
              </div>
              <RiskBadge level={patient.riskLevel} />
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart size={12} className="text-red-400" />
                <span className="font-medium">{patient.condition ?? "No condition listed"}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-muted-foreground">Blood: <span className="font-medium text-foreground">{patient.bloodType ?? "N/A"}</span></span>
                <span className="text-muted-foreground">Last Visit: <span className="font-medium text-foreground">{patient.lastVisit ?? "N/A"}</span></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPatient(patient)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Eye size={12} />
                View
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors">
                <Edit size={12} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPatient(null)}>
          <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedPatient.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedPatient.age} years • {selectedPatient.gender}</p>
              </div>
              <RiskBadge level={selectedPatient.riskLevel} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Blood Type", value: selectedPatient.bloodType ?? "N/A" },
                { label: "Condition", value: selectedPatient.condition ?? "None" },
                { label: "Email", value: selectedPatient.email ?? "N/A" },
                { label: "Phone", value: selectedPatient.phone ?? "N/A" },
                { label: "Last Visit", value: selectedPatient.lastVisit ?? "N/A" },
                { label: "Status", value: selectedPatient.status },
              ].map(item => (
                <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 premium-button text-sm">View Full Records</button>
              <button className="flex-1 premium-button-outline text-sm" onClick={() => setSelectedPatient(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
