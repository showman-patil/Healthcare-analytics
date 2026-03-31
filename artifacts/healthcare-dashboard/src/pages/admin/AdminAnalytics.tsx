import React, { useMemo, useRef } from "react";
import { Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  type Appointment,
  type Doctor,
  type Patient,
  useListAppointments,
  useListDoctors,
  useListPatients,
} from "@workspace/api-client-react";

import { useDynamicDoctors } from "@/lib/doctor-directory";
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_PATIENTS } from "@/lib/mock-data";
import { usePortalData } from "@/lib/portal-data-context";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const EMPTY_DISTRIBUTION = [{ name: "No condition data", value: 1 }];
const EMPTY_RISK_FACTORS = [{ factor: "No risk data", patients: 0, percentage: 0 }];
const AGE_GROUPS = [
  { label: "0-18", min: 0, max: 18 },
  { label: "19-30", min: 19, max: 30 },
  { label: "31-45", min: 31, max: 45 },
  { label: "46-60", min: 46, max: 60 },
  { label: "61-75", min: 61, max: 75 },
  { label: "76+", min: 76, max: Number.POSITIVE_INFINITY },
] as const;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatConditionLabel(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function splitConditions(value: string) {
  return value
    .split(/,|\/|;|\band\b/gi)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function inferRiskLevel(condition: string, fallback: Patient["riskLevel"]) {
  const normalizedCondition = normalizeText(condition);

  if (fallback) {
    return fallback;
  }

  if (
    normalizedCondition.includes("emergency") ||
    normalizedCondition.includes("cardiac") ||
    normalizedCondition.includes("stroke")
  ) {
    return "critical";
  }

  if (
    normalizedCondition.includes("diabetes") ||
    normalizedCondition.includes("hypertension") ||
    normalizedCondition.includes("coronary")
  ) {
    return "medium";
  }

  return "low";
}

function categorizeCondition(condition: string) {
  const normalizedCondition = normalizeText(condition);

  if (
    normalizedCondition.includes("heart") ||
    normalizedCondition.includes("cardio") ||
    normalizedCondition.includes("hypertension") ||
    normalizedCondition.includes("coronary")
  ) {
    return "Cardiovascular";
  }

  if (
    normalizedCondition.includes("diabetes") ||
    normalizedCondition.includes("glucose") ||
    normalizedCondition.includes("endocrine")
  ) {
    return "Diabetes";
  }

  if (
    normalizedCondition.includes("asthma") ||
    normalizedCondition.includes("resp") ||
    normalizedCondition.includes("pulmon") ||
    normalizedCondition.includes("copd")
  ) {
    return "Respiratory";
  }

  if (
    normalizedCondition.includes("neuro") ||
    normalizedCondition.includes("brain") ||
    normalizedCondition.includes("seizure") ||
    normalizedCondition.includes("stroke")
  ) {
    return "Neurological";
  }

  if (
    normalizedCondition.includes("cancer") ||
    normalizedCondition.includes("tumor") ||
    normalizedCondition.includes("oncology")
  ) {
    return "Cancer";
  }

  return "General";
}

function ageGroupFor(age: number) {
  return AGE_GROUPS.find((group) => age >= group.min && age <= group.max)?.label ?? "76+";
}

export default function AdminAnalytics() {
  const container = useRef<HTMLDivElement>(null);
  const { data: apiPatients } = useListPatients();
  const { data: apiDoctors } = useListDoctors();
  const { data: apiAppointments } = useListAppointments();
  const { findPatientProfile } = usePortalData();

  const doctors = useDynamicDoctors(
    apiDoctors?.length ? [...apiDoctors, ...MOCK_DOCTORS] : MOCK_DOCTORS,
  );
  const appointments = apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS;

  const patients = useMemo(() => {
    const basePatients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;

    return basePatients.map((patient) => {
      const sharedProfile = findPatientProfile({
        email: patient.email,
        name: patient.name,
      });
      const nextCondition = sharedProfile?.chronicConditions || patient.condition || "";

      return {
        ...patient,
        age: Number.parseInt(sharedProfile?.age ?? String(patient.age), 10) || patient.age,
        condition: nextCondition,
        email: sharedProfile?.email || patient.email,
        gender: sharedProfile?.gender || patient.gender,
        name: sharedProfile?.name || patient.name,
        phone: sharedProfile?.phone || patient.phone,
        riskLevel: inferRiskLevel(nextCondition, patient.riskLevel),
      };
    });
  }, [apiPatients, findPatientProfile]);

  const totalPatients = patients.length;
  const activeDoctors = doctors.filter((doctor) => doctor.status === "active").length;
  const highRiskPatients = patients.filter(
    (patient) => patient.riskLevel === "high" || patient.riskLevel === "critical",
  ).length;
  const pendingRequests = appointments.filter((appointment) => appointment.status === "pending").length;

  const averageRiskScore = useMemo(() => {
    if (patients.length === 0) {
      return 0;
    }

    const scoreMap: Record<Patient["riskLevel"], number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 95,
    };
    const total = patients.reduce((sum, patient) => sum + scoreMap[patient.riskLevel], 0);

    return total / patients.length;
  }, [patients]);

  const preventionRate = useMemo(() => {
    if (appointments.length === 0) {
      return 0;
    }

    const resolvedCount = appointments.filter(
      (appointment) =>
        appointment.status === "completed" || appointment.status === "scheduled",
    ).length;

    return (resolvedCount / appointments.length) * 100;
  }, [appointments]);

  const riskFactorData = useMemo(() => {
    const counts = new Map<string, number>();

    patients.forEach((patient) => {
      splitConditions(patient.condition ?? "")
        .filter((condition) => {
          const normalized = normalizeText(condition);
          return normalized && normalized !== "none" && normalized !== "general care";
        })
        .forEach((condition) => {
          const label = formatConditionLabel(condition);
          counts.set(label, (counts.get(label) ?? 0) + 1);
        });
    });

    const factors = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([factor, count]) => ({
        factor,
        patients: count,
        percentage: totalPatients ? Math.round((count / totalPatients) * 100) : 0,
      }));

    return factors.length > 0 ? factors : EMPTY_RISK_FACTORS;
  }, [patients, totalPatients]);

  const diseaseDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    patients.forEach((patient) => {
      splitConditions(patient.condition ?? "")
        .filter((condition) => {
          const normalized = normalizeText(condition);
          return normalized && normalized !== "none" && normalized !== "general care";
        })
        .forEach((condition) => {
          const category = categorizeCondition(condition);
          counts.set(category, (counts.get(category) ?? 0) + 1);
        });
    });

    const distribution = [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([name, value]) => ({ name, value }));

    return distribution.length > 0 ? distribution : EMPTY_DISTRIBUTION;
  }, [patients]);

  const ageGroupData = useMemo(() => {
    const grouped = AGE_GROUPS.map((group) => ({
      age: group.label,
      low: 0,
      medium: 0,
      high: 0,
    }));

    patients.forEach((patient) => {
      const bucket = grouped.find((item) => item.age === ageGroupFor(patient.age));

      if (!bucket) {
        return;
      }

      if (patient.riskLevel === "low") {
        bucket.low += 1;
        return;
      }

      if (patient.riskLevel === "medium") {
        bucket.medium += 1;
        return;
      }

      bucket.high += 1;
    });

    return grouped;
  }, [patients]);

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.55,
      ease: "power3.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Live patient, appointment, and doctor trends from the current workspace data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 gsap-in">
        {[
          {
            label: "Patients Connected",
            value: totalPatients.toString(),
            icon: Brain,
            color: "stat-gradient-blue",
          },
          {
            label: "High Risk Patients",
            value: highRiskPatients.toString(),
            icon: AlertTriangle,
            color: "stat-gradient-red",
          },
          {
            label: "Avg Risk Score",
            value: averageRiskScore.toFixed(1),
            icon: Target,
            color: "stat-gradient-orange",
          },
          {
            label: "Resolved Appointments",
            value: `${Math.round(preventionRate)}%`,
            icon: TrendingUp,
            color: "stat-gradient-green",
          },
        ].map((item) => (
          <div key={item.label} className="premium-card p-5">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${item.color} text-white shadow-md`}>
              <item.icon size={20} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{item.value}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="premium-card p-6 gsap-in">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="mb-1 text-lg font-bold text-foreground">Risk Level by Age Group</h3>
            <p className="text-sm text-muted-foreground">
              Patient distribution across live risk categories
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalPatients} patients, {activeDoctors} active doctors, {pendingRequests} pending requests
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 32% 91%)" />
              <XAxis
                dataKey="age"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgb(0 0 0/0.1)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" />
              <Bar dataKey="medium" name="Medium Risk" stackId="a" fill="#f59e0b" />
              <Bar dataKey="high" name="High / Critical" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="premium-card p-6 gsap-in">
          <h3 className="mb-4 text-lg font-bold text-foreground">Top Risk Factors</h3>
          <div className="space-y-4">
            {riskFactorData.map((item) => (
              <div key={item.factor}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.factor}</span>
                  <span className="text-muted-foreground">
                    {item.patients} patients ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(item.percentage, item.patients > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card p-6 gsap-in">
          <h3 className="mb-2 text-lg font-bold text-foreground">Disease Distribution</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Breakdown by condition type from current patient records
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgb(0 0 0/0.1)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
