import React, { useMemo, useRef } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Brain,
  Calendar,
  FileText,
  Heart,
  Thermometer,
  Weight,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListAppointments } from "@workspace/api-client-react";

import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime, usePortalData } from "@/lib/portal-data-context";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";

export default function PatientDashboard() {
  const container = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const { data: apiAppointments } = useListAppointments();
  const {
    assessmentHistory,
    getPatientAppointments,
    lastAssessment,
    patientProfile,
  } = usePortalData();

  const patientAppointments = useMemo(
    () => getPatientAppointments(apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS),
    [apiAppointments, getPatientAppointments],
  );

  const upcomingAppointments = patientAppointments
    .filter((appointment) => appointment.status !== "cancelled")
    .slice(0, 3);
  const latestRecommendations = lastAssessment?.recommendations.slice(0, 3) ?? [
    "Keep your profile and current medications updated so future assessments stay accurate.",
    "Use the symptom checker whenever your health values or symptoms change noticeably.",
    "Review upcoming appointments regularly so follow-ups do not get missed.",
  ];

  const vitalCards = [
    {
      title: "Blood Pressure",
      value: lastAssessment?.bloodPressure ?? "--",
      unit: "mmHg",
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-50",
      trend: lastAssessment?.urgency ?? "No recent reading",
    },
    {
      title: "Blood Sugar",
      value: lastAssessment ? String(lastAssessment.bloodSugar) : "--",
      unit: "mg/dL",
      icon: Heart,
      color: "text-red-500",
      bg: "bg-red-50",
      trend: lastAssessment ? lastAssessment.primaryDiagnosis : "No recent reading",
    },
    {
      title: "BMI",
      value: lastAssessment ? String(lastAssessment.bmi) : "--",
      unit: "",
      icon: Weight,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      trend: patientProfile.exercise,
    },
    {
      title: "Weight",
      value: patientProfile.weight.split(" ")[0] ?? "--",
      unit: patientProfile.weight.split(" ")[1] ?? "",
      icon: Thermometer,
      color: "text-orange-500",
      bg: "bg-orange-50",
      trend: patientProfile.bloodType ? `Blood type ${patientProfile.bloodType}` : "Profile data",
    },
  ];

  useGSAP(() => {
    gsap.from(".animate-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.6,
      ease: "power2.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Health Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {session?.fullName ?? patientProfile.name}. Your dashboard is now connected to live bookings, assessments, and alerts.
          </p>
        </div>
        <Link href="/patient/prediction" className="premium-button flex items-center gap-2">
          Check Symptoms
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vitalCards.map((card) => (
          <VitalCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="premium-card animate-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Calendar className="text-primary" size={20} />
                Upcoming Appointments
              </h3>
              <Link href="/patient/booking" className="text-sm font-medium text-primary hover:underline">
                Book New
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No appointment booked yet. Use the booking page and it will appear here automatically.
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg border border-border bg-white p-3 text-center shadow-sm">
                        <div className="text-xs font-bold uppercase text-primary">
                          {new Date(appointment.date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-xl font-display font-bold text-foreground">
                          {new Date(appointment.date).getDate()}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{appointment.doctorName}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        <p className="mt-1 text-xs font-semibold text-primary">
                          {appointment.status === "pending"
                            ? "Doctor will confirm the time"
                            : appointment.time} • {appointment.status}
                        </p>
                      </div>
                    </div>
                    <Link href="/patient/booking" className="premium-button-outline px-4 py-2 text-sm">
                      Manage
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="premium-card animate-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Brain className="text-primary" size={20} />
                Latest Assessment
              </h3>
              <Link href="/patient/records" className="text-sm font-medium text-primary hover:underline">
                View Records
              </Link>
            </div>

            {!lastAssessment ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No AI health assessment yet. Run the symptom checker and the summary will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{lastAssessment.primaryDiagnosis}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{lastAssessment.summary}</p>
                    </div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {lastAssessment.urgency}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <MiniStat label="Risk Score" value={`${lastAssessment.riskScore}/100`} />
                  <MiniStat label="Last Updated" value={formatRelativeTime(lastAssessment.createdAt)} />
                  <MiniStat label="Symptoms" value={lastAssessment.symptoms.length ? `${lastAssessment.symptoms.length} selected` : "Vitals only"} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card animate-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <FileText className="text-emerald-500" size={20} />
                Recommendations
              </h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {assessmentHistory.length} reports
              </span>
            </div>

            <ul className="space-y-4">
              {latestRecommendations.map((item) => (
                <li key={item} className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  bg,
  trend,
}: {
  bg: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  trend: string;
  unit: string;
  value: string;
}) {
  return (
    <div className="premium-card animate-card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <h4 className="text-2xl font-display font-bold text-foreground">{value}</h4>
          {unit ? <span className="text-xs font-medium text-muted-foreground">{unit}</span> : null}
        </div>
        <p className="mt-1 text-xs font-semibold text-emerald-600">{trend}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
