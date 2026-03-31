import React, { useMemo, useRef } from "react";
import { Link } from "wouter";
import { 
  Calendar, Clock, User, AlertCircle, ArrowRight, CheckCircle2, Activity
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListAppointments, useListPatients } from "@workspace/api-client-react";
import { MOCK_APPOINTMENTS, MOCK_PATIENTS } from "@/lib/mock-data";
import { RiskBadge } from "../admin/AdminUsers";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { usePortalData } from "@/lib/portal-data-context";

export default function DoctorDashboard() {
  const container = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  
  const { data: apiAppts } = useListAppointments();
  const { data: apiPatients } = useListPatients();
  const { getDoctorAppointments, updateAppointmentStatus } = usePortalData();

  const appointments = getDoctorAppointments(apiAppts?.length ? apiAppts : MOCK_APPOINTMENTS);
  const scheduledAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "scheduled").slice(0, 4),
    [appointments],
  );
  const pendingRequests = appointments.filter((appointment) => appointment.status === "pending");
  const allPatients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;
  const doctorPatientIds = useMemo(
    () => new Set(appointments.map((appointment) => appointment.patientId)),
    [appointments],
  );
  const patients = useMemo(
    () =>
      allPatients.filter((patient) => doctorPatientIds.has(patient.id)),
    [allPatients, doctorPatientIds],
  );

  const criticalPatients = patients.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');

  useGSAP(() => {
    gsap.from(".animate-item", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {session?.fullName ?? "Doctor"}
          </h1>
          <p className="text-muted-foreground mt-1">
            You have {scheduledAppointments.length} scheduled appointments and {pendingRequests.length} pending requests.
          </p>
        </div>
        <Link href="/doctor/prediction" className="premium-button flex items-center gap-2">
          New AI Diagnosis
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="text-primary" size={20} />
                Today's Schedule
              </h3>
              <Link href="/doctor/appointments" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>

            <div className="space-y-4">
              {scheduledAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No scheduled appointments yet. Pending requests are waiting in the appointments page for time assignment.
                </div>
              ) : (
                scheduledAppointments.map((appt) => (
                  <div key={appt.id} className="animate-item flex flex-col gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5 group sm:flex-row sm:items-center">
                    <div className="mr-0 w-full border-b border-border pb-3 text-center sm:mr-4 sm:w-24 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                      <div className="font-bold text-foreground">{appt.time}</div>
                      <div className="text-xs font-semibold text-muted-foreground">{appt.date}</div>
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {appt.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{appt.patientName}</h4>
                        <p className="text-xs text-muted-foreground">{appt.type}</p>
                      </div>
                    </div>
                    <div className="self-start sm:self-auto">
                      {appt.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle2 size={14} /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const nextAppointment = updateAppointmentStatus(appt, "completed");
                            toast({
                              title: "Appointment completed",
                              description: `${nextAppointment.patientName} has been marked completed from the dashboard.`,
                            });
                          }}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-foreground hover:bg-primary rounded-full transition-colors"
                        >
                          Begin
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/doctor/patients" className="animate-item premium-card p-6 flex flex-col items-center justify-center text-center hover:bg-primary hover:text-white group border-none bg-gradient-to-br from-white to-blue-50">
              <User size={32} className="text-primary mb-3 group-hover:text-white transition-colors" />
              <h4 className="font-bold text-lg">Patient Directory</h4>
              <p className="text-sm text-muted-foreground group-hover:text-blue-100 mt-1">Access all records</p>
            </Link>
            <Link href="/doctor/prediction" className="animate-item premium-card p-6 flex flex-col items-center justify-center text-center hover:bg-indigo-600 hover:text-white group border-none bg-gradient-to-br from-white to-indigo-50">
              <Activity size={32} className="text-indigo-600 mb-3 group-hover:text-white transition-colors" />
              <h4 className="font-bold text-lg">AI Predictor</h4>
              <p className="text-sm text-muted-foreground group-hover:text-indigo-100 mt-1">Run symptom analysis</p>
            </Link>
          </div>
        </div>

        {/* Right Column: Alerts */}
        <div className="space-y-6">
          <div className="premium-card p-6 bg-red-50/50 border-red-100">
            <div className="flex items-center gap-2 mb-6 text-red-700">
              <AlertCircle size={20} />
              <h3 className="text-lg font-bold">High Risk Alerts</h3>
            </div>
            
            <div className="space-y-4">
              {criticalPatients.map(patient => (
                <div key={patient.id} className="animate-item bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-foreground">{patient.name}</h4>
                    <RiskBadge level={patient.riskLevel} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Condition: <span className="font-medium text-foreground">{patient.condition}</span></p>
                  <button className="w-full py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    Review Case
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
