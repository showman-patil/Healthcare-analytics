import React, { useState, useRef } from "react";
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListPatients, useListDoctors } from "@workspace/api-client-react";
import { MOCK_PATIENTS, MOCK_DOCTORS } from "@/lib/mock-data";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<"patients" | "doctors">("patients");
  const container = useRef<HTMLDivElement>(null);

  const { data: apiPatients } = useListPatients();
  const { data: apiDoctors } = useListDoctors();

  const patients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;
  const doctors = apiDoctors?.length ? apiDoctors : MOCK_DOCTORS;

  useGSAP(() => {
    gsap.from(".list-item-anim", {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.4,
      ease: "power2.out"
    });
  }, [activeTab]);

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access, doctors, and patient records.</p>
        </div>
        <button className="premium-button flex items-center gap-2">
          <Plus size={18} />
          Add New User
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        {/* Tabs & Controls */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
          <div className="flex p-1 bg-muted rounded-lg w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("patients")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "patients" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Patients
            </button>
            <button 
              onClick={() => setActiveTab("doctors")}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "doctors" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Doctors
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <button className="p-2 border border-border bg-white rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                {activeTab === "patients" ? (
                  <>
                    <th className="px-6 py-4 font-semibold">Condition</th>
                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-semibold">Specialty</th>
                    <th className="px-6 py-4 font-semibold">Patients</th>
                  </>
                )}
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === "patients" ? (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-muted/30 transition-colors list-item-anim group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{patient.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Age: {patient.age} • {patient.gender}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{patient.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{patient.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{patient.condition || "None"}</td>
                    <td className="px-6 py-4">
                      <RiskBadge level={patient.riskLevel} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                        patient.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        patient.status === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu />
                    </td>
                  </tr>
                ))
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors list-item-anim group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{doc.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{doc.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{doc.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{doc.specialty}</td>
                    <td className="px-6 py-4 text-foreground font-medium">{doc.patients} Assigned</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
                        doc.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {doc.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50/50">
          <span className="text-sm text-muted-foreground">Showing 1 to {activeTab === "patients" ? patients.length : doctors.length} of 42 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded-md text-sm bg-white hover:bg-muted disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-primary bg-primary text-white rounded-md text-sm">1</button>
            <button className="px-3 py-1 border border-border rounded-md text-sm bg-white hover:bg-muted">2</button>
            <button className="px-3 py-1 border border-border rounded-md text-sm bg-white hover:bg-muted">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colors[level] || colors.low}`}>
      {level}
    </span>
  );
}

function ActionMenu() {
  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Edit">
        <Edit2 size={16} />
      </button>
      <button className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete">
        <Trash2 size={16} />
      </button>
      <button className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
        <MoreVertical size={16} />
      </button>
    </div>
  );
}
