import React, { useMemo, useRef } from "react";
import { Clock, Download, FileText, Pill } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useListAppointments } from "@workspace/api-client-react";

import {
  formatRelativeTime,
  usePortalData,
} from "@/lib/portal-data-context";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";

type ReportItem = {
  createdAt: string;
  downloadFileName: string;
  downloadText?: string;
  downloadUrl?: string;
  id: string;
  source: string;
  summary: string;
  title: string;
  type: string;
};

function formatDateLabel(dateValue: string) {
  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function triggerDownload(report: ReportItem) {
  const href =
    report.downloadUrl ??
    URL.createObjectURL(
      new Blob([report.downloadText ?? report.summary], {
        type: "text/plain;charset=utf-8",
      }),
    );
  const anchor = document.createElement("a");
  const generated = !report.downloadUrl;

  anchor.href = href;
  anchor.download = report.downloadFileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (generated) {
    URL.revokeObjectURL(href);
  }
}

export default function PatientRecords() {
  const container = useRef<HTMLDivElement>(null);
  const { data: apiAppointments } = useListAppointments();
  const {
    assessmentHistory,
    currentPatientId,
    getDocumentsForPatient,
    getPatientAppointments,
    patientProfile,
  } = usePortalData();

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  const patientAppointments = useMemo(
    () =>
      getPatientAppointments(
        apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS,
      ),
    [apiAppointments, getPatientAppointments],
  );

  const uploadedDocuments = useMemo(
    () =>
      getDocumentsForPatient({
        email: patientProfile.email,
        id: currentPatientId,
        name: patientProfile.name,
      }),
    [currentPatientId, getDocumentsForPatient, patientProfile.email, patientProfile.name],
  );

  const reports = useMemo<ReportItem[]>(() => {
    const generatedSummary: ReportItem = {
      createdAt: assessmentHistory[0]?.createdAt ?? new Date().toISOString(),
      downloadFileName: "baseline-health-summary.txt",
      downloadText: [
        "Baseline Health Summary",
        `Patient: ${patientProfile.name}`,
        `Age: ${patientProfile.age || "Not provided"}`,
        `Gender: ${patientProfile.gender || "Not provided"}`,
        `Blood Type: ${patientProfile.bloodType || "Not provided"}`,
        `Phone: ${patientProfile.phone || "Not provided"}`,
        `Email: ${patientProfile.email || "Not provided"}`,
        `Address: ${patientProfile.address || "Not provided"}`,
        `Chronic Conditions: ${patientProfile.chronicConditions || "None listed"}`,
        `Current Medications: ${patientProfile.currentMedications || "None listed"}`,
        `Allergies: ${patientProfile.allergies || "None listed"}`,
        `Insurance: ${patientProfile.insuranceProvider || "Not provided"} (${patientProfile.insuranceId || "Not provided"})`,
      ].join("\n"),
      id: "baseline-report",
      source: "Primary Care Team",
      summary: "Profile-connected health summary generated from your current patient information.",
      title: "Baseline Health Summary",
      type: "Clinical Note",
    };

    const appointmentReports = patientAppointments.map<ReportItem>((appointment) => ({
      createdAt: appointment.date,
      downloadFileName: `appointment-${appointment.id}-summary.txt`,
      downloadText: [
        `${appointment.type || "Appointment"} Summary`,
        `Doctor: ${appointment.doctorName || "Care team"}`,
        `Date: ${formatDateLabel(appointment.date)}`,
        `Time: ${appointment.time}`,
        `Status: ${appointment.status}`,
        `Notes: ${appointment.notes || "No additional notes"}`,
      ].join("\n"),
      id: `appointment-report-${appointment.id}`,
      source: appointment.doctorName || "Care team",
      summary: `${appointment.type || "Appointment"} scheduled for ${formatDateLabel(appointment.date)} at ${appointment.time}.`,
      title: `${appointment.type || "Appointment"} Summary`,
      type: appointment.status === "cancelled" ? "Visit Update" : "Visit Summary",
    }));

    const assessmentReports = assessmentHistory.map<ReportItem>((assessment) => ({
      createdAt: assessment.createdAt,
      downloadFileName: `assessment-${assessment.id}.txt`,
      downloadText: [
        `AI Assessment - ${assessment.primaryDiagnosis}`,
        `Generated: ${formatDateLabel(assessment.createdAt)}`,
        `Urgency: ${assessment.urgency}`,
        `Risk Level: ${assessment.riskLevel}`,
        `Risk Score: ${assessment.riskScore}/100`,
        `Blood Pressure: ${assessment.bloodPressure}`,
        `Blood Sugar: ${assessment.bloodSugar} mg/dL`,
        `BMI: ${assessment.bmi}`,
        `Cholesterol: ${assessment.cholesterol} mg/dL`,
        "",
        "Summary",
        assessment.summary,
        "",
        "Recommendations",
        ...assessment.recommendations.map((item) => `- ${item}`),
      ].join("\n"),
      id: assessment.id,
      source: "AI Symptom Checker",
      summary: assessment.summary,
      title: `AI Assessment - ${assessment.primaryDiagnosis}`,
      type: "Assessment",
    }));

    const uploadedReports = uploadedDocuments.map<ReportItem>((document) => ({
      createdAt: document.createdAt,
      downloadFileName: document.fileName,
      downloadUrl: document.dataUrl,
      id: document.id,
      source: document.uploadedBy,
      summary: document.description,
      title: document.title,
      type: "Uploaded Document",
    }));

    return [
      ...uploadedReports,
      ...assessmentReports,
      ...appointmentReports,
      generatedSummary,
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [assessmentHistory, patientAppointments, patientProfile, uploadedDocuments]);

  const prescriptions = useMemo(
    () =>
      patientProfile.currentMedications
        .split(",")
        .map((item) => item.trim())
        .filter(
          (item) =>
            item.length > 0 &&
            !["none", "none listed", "n/a", "na"].includes(item.toLowerCase()),
        )
        .map((drug, index) => ({
          dosage: "Follow the prescribed directions",
          drug,
          id: index + 1,
          prescriber: "Care team",
          refills: Math.max(1, 3 - index),
        })),
    [patientProfile.currentMedications],
  );

  const timeline = useMemo(() => {
    const appointmentItems = patientAppointments.map((appointment) => ({
      date: appointment.date,
      event: `${appointment.type} with ${appointment.doctorName}`,
      type: appointment.status === "cancelled" ? "alert" : "appointment",
    }));

    const assessmentItems = assessmentHistory.map((assessment) => ({
      date: assessment.createdAt,
      event: `AI assessment added - ${assessment.primaryDiagnosis}`,
      type:
        assessment.riskLevel === "high" || assessment.riskLevel === "critical"
          ? "alert"
          : "assessment",
    }));

    const documentItems = uploadedDocuments.map((document) => ({
      date: document.createdAt,
      event: `${document.title} uploaded by ${document.uploadedBy}`,
      type: "document",
    }));

    return [...appointmentItems, ...assessmentItems, ...documentItems]
      .sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      )
      .slice(0, 10);
  }, [assessmentHistory, patientAppointments, uploadedDocuments]);

  const typeColor = (type: string) =>
    ({
      alert: "bg-red-50 text-red-700",
      appointment: "bg-blue-50 text-blue-700",
      assessment: "bg-emerald-50 text-emerald-700",
      document: "bg-violet-50 text-violet-700",
    }[type] ?? "bg-gray-50 text-gray-700");

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">My Health Records</h1>
        <p className="mt-1 text-muted-foreground">
          Your records are now connected to profile details, appointments, AI assessments, and doctor-uploaded documents.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="premium-card gsap-in p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Medical Reports</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {reports.length} connected
            </span>
          </div>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.source} | {formatDateLabel(report.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-foreground/80">{report.summary}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {report.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerDownload(report)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted"
                  >
                    <Download size={13} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card gsap-in p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Active Medications</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {prescriptions.length} listed
            </span>
          </div>
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No medications listed in your profile yet. Add them in your profile so they stay connected here.
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
                      <Pill size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{prescription.drug}</p>
                      <p className="mb-2 text-xs text-muted-foreground">{prescription.dosage}</p>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
                        <span>
                          By: <span className="font-medium text-foreground">{prescription.prescriber}</span>
                        </span>
                        <span>
                          Refills: <span className="font-medium text-green-600">{prescription.refills}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="premium-card gsap-in p-6">
        <h2 className="mb-5 text-lg font-bold text-foreground">Health History Timeline</h2>
        <div className="relative">
          <div className="absolute bottom-2 left-4 top-2 w-px bg-border" />
          <div className="space-y-5">
            {timeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No connected history yet. Book an appointment, run an assessment, or upload a doctor document to start your timeline.
              </div>
            ) : (
              timeline.map((item, index) => (
                <div key={`${item.event}-${index}`} className="relative flex gap-4">
                  <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
                    <Clock size={13} className="text-primary" />
                  </div>
                  <div className="pt-1">
                    <span
                      className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor(item.type)}`}
                    >
                      {item.type}
                    </span>
                    <p className="text-sm font-medium text-foreground">{item.event}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === "assessment" || item.type === "document"
                        ? formatRelativeTime(item.date)
                        : formatDateLabel(item.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
