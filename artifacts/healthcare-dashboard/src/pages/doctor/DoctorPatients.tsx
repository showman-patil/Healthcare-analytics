import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  FileText,
  Filter,
  Heart,
  Search,
  Upload,
  UserPlus,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  type Appointment,
  type Patient,
  useListAppointments,
  useListPatients,
} from "@workspace/api-client-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/auth";
import { MOCK_APPOINTMENTS, MOCK_PATIENTS } from "@/lib/mock-data";
import { isPlaceholderDocumentLabel, usePortalData } from "@/lib/portal-data-context";

type PatientWorkspacePatient = Patient & {
  avatar?: string;
};

type RecordItem = {
  date: string;
  downloadFileName?: string;
  downloadText?: string;
  downloadUrl?: string;
  id: string;
  size: string;
  status: "reviewed" | "pending";
  summary: string;
  title: string;
  type: string;
};

type TimelineItem = {
  date: string;
  detail: string;
  id: string;
  label: string;
  type: "appointment" | "record";
};

function RiskBadge({ level }: { level: string }) {
  const classes: Record<string, string> = {
    critical: "risk-critical",
    high: "risk-high",
    medium: "risk-medium",
    low: "risk-low",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        classes[level] ?? "risk-low"
      }`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

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

function formatFileSize(bytes: number) {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  if (bytes >= 1_000) {
    return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  }

  return `${bytes} B`;
}

function downloadRecord(record: RecordItem) {
  const href =
    record.downloadUrl ??
    URL.createObjectURL(
      new Blob([record.downloadText ?? `${record.title}\n\n${record.summary}`], {
        type: "text/plain;charset=utf-8",
      }),
    );
  const anchor = document.createElement("a");
  const isGenerated = !record.downloadUrl;

  anchor.href = href;
  anchor.download = record.downloadFileName ?? `${record.title}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (isGenerated) {
    URL.revokeObjectURL(href);
  }
}

function createRecordItems(
  patient: PatientWorkspacePatient,
  appointments: Appointment[],
): RecordItem[] {
  const condition = patient.condition || "General wellness";
  const lastVisit = patient.lastVisit || "2026-03-18";

  const baseRecords: RecordItem[] = [
    {
      date: lastVisit,
      downloadFileName: "consultation-summary.txt",
      downloadText: `Consultation Summary\nPatient: ${patient.name}\nDate: ${formatDateLabel(lastVisit)}\nCondition: ${condition}\n\nClinical summary updated for ${condition.toLowerCase()} follow-up and ongoing treatment planning.`,
      id: `${patient.id}-record-summary`,
      size: "420 KB",
      status: "reviewed",
      summary: `Clinical summary updated for ${condition.toLowerCase()} follow-up and ongoing treatment planning.`,
      title: "Consultation Summary",
      type: "Clinical Note",
    },
    {
      date: "2026-03-24",
      downloadFileName: `${condition.toLowerCase().replace(/\s+/g, "-")}-lab-panel.txt`,
      downloadText: `${condition} Lab Panel\nPatient: ${patient.name}\nCollected: ${formatDateLabel("2026-03-24")}\n\nLatest lab panel and diagnostic markers uploaded for review.`,
      id: `${patient.id}-record-lab`,
      size: "780 KB",
      status:
        patient.riskLevel === "high" || patient.riskLevel === "critical"
          ? "pending"
          : "reviewed",
      summary: "Latest lab panel and diagnostic markers uploaded for review.",
      title: `${condition} Lab Panel`,
      type: "Lab Result",
    },
  ];

  const appointmentRecords = appointments.slice(0, 2).map((appointment, index) => ({
    date: appointment.date,
    downloadFileName: `${(appointment.type || "appointment").toLowerCase().replace(/\s+/g, "-")}-summary.txt`,
    downloadText: `${appointment.type || "Appointment Record"}\nPatient: ${patient.name}\nDoctor: ${appointment.doctorName || "Care team"}\nDate: ${formatDateLabel(appointment.date)}\nTime: ${appointment.time}\nStatus: ${appointment.status}\n\n${appointment.type || "Visit"} with ${appointment.doctorName || "care team"} at ${appointment.time}.`,
    id: `${patient.id}-appointment-record-${appointment.id}`,
    size: `${1.1 + index * 0.3} MB`,
    status: appointment.status === "completed" ? "reviewed" as const : "pending" as const,
    summary: `${appointment.type || "Visit"} with ${appointment.doctorName || "care team"} at ${appointment.time}.`,
    title: appointment.type || "Appointment Record",
    type: "Visit Record",
  }));

  return [...appointmentRecords, ...baseRecords].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

function createTimeline(
  patient: PatientWorkspacePatient,
  appointments: Appointment[],
  records: RecordItem[],
): TimelineItem[] {
  const appointmentItems: TimelineItem[] = appointments.map((appointment) => ({
    date: appointment.date,
    detail: `${appointment.type || "Appointment"} at ${appointment.time} with ${appointment.doctorName || "care team"}`,
    id: `${patient.id}-timeline-appointment-${appointment.id}`,
    label: "Appointment",
    type: "appointment",
  }));

  const recordItems: TimelineItem[] = records.map((record) => ({
    date: record.date,
    detail:
      record.type === "Uploaded Document"
        ? `${record.title} attached to the patient record.`
        : `${record.title} updated in the medical record.`,
    id: `${patient.id}-timeline-record-${record.id}`,
    label:
      record.type === "Uploaded Document"
        ? "Document Added"
        : record.status === "reviewed"
          ? "Record Reviewed"
          : "Record Pending",
    type: "record",
  }));

  return [...appointmentItems, ...recordItems]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 6);
}

export default function DoctorPatients() {
  const container = useRef<HTMLDivElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const { data: apiPatients } = useListPatients();
  const { data: apiAppointments } = useListAppointments();
  const {
    addPatientDocument,
    findPatientProfile,
    getDoctorAppointments,
    getDocumentsForPatient,
  } = usePortalData();

  const basePatients = useMemo<PatientWorkspacePatient[]>(() => {
    const basePatients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;

    return basePatients.map((patient) => {
      const sharedProfile = findPatientProfile({
        email: patient.email,
        name: patient.name,
      });

      if (!sharedProfile) {
        return patient;
      }

      return {
        ...patient,
        age: Number.parseInt(sharedProfile.age, 10) || patient.age,
        avatar: sharedProfile.profileImage || undefined,
        bloodType: sharedProfile.bloodType || patient.bloodType,
        condition: sharedProfile.chronicConditions || patient.condition,
        email: sharedProfile.email || patient.email,
        gender: sharedProfile.gender || patient.gender,
        name: sharedProfile.name || patient.name,
        phone: sharedProfile.phone || patient.phone,
      };
    });
  }, [apiPatients, findPatientProfile]);

  const appointments = useMemo(
    () => getDoctorAppointments(apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS),
    [apiAppointments, getDoctorAppointments],
  );

  const patients = useMemo<PatientWorkspacePatient[]>(() => {
    const doctorPatientIds = new Set(appointments.map((appointment) => appointment.patientId));

    return basePatients.filter((patient) => doctorPatientIds.has(patient.id));
  }, [appointments, basePatients]);

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const query = search.toLowerCase();
        const matchesSearch =
          patient.name.toLowerCase().includes(query) ||
          (patient.condition ?? "").toLowerCase().includes(query) ||
          (patient.email ?? "").toLowerCase().includes(query);
        const matchesRisk = riskFilter === "all" || patient.riskLevel === riskFilter;

        return matchesSearch && matchesRisk;
      }),
    [patients, riskFilter, search],
  );

  useEffect(() => {
    if (filteredPatients.length === 0) {
      setSelectedPatientId(null);
      return;
    }

    if (!filteredPatients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(filteredPatients[0].id);
      setActiveTab("overview");
    }
  }, [filteredPatients, selectedPatientId]);

  const selectedPatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ??
    patients.find((patient) => patient.id === selectedPatientId) ??
    null;

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) {
      return [];
    }

    return appointments
      .filter(
        (appointment) =>
          appointment.patientId === selectedPatient.id ||
          appointment.patientName === selectedPatient.name,
      )
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [appointments, selectedPatient]);

  const selectedPatientRecords = useMemo(
    () =>
      selectedPatient
        ? [
            ...getDocumentsForPatient({
              email: selectedPatient.email,
              id: selectedPatient.id,
              name: selectedPatient.name,
            }).map((document) => ({
              date: document.createdAt,
              downloadFileName: document.fileName,
              downloadUrl: document.dataUrl,
              id: document.id,
              size: document.sizeLabel,
              status: "reviewed" as const,
              summary: document.description,
              title: document.title,
              type: "Uploaded Document",
            })),
            ...createRecordItems(selectedPatient, selectedPatientAppointments),
          ].sort(
            (left, right) =>
              new Date(right.date).getTime() - new Date(left.date).getTime(),
          )
        : [],
    [getDocumentsForPatient, selectedPatient, selectedPatientAppointments],
  );

  const timeline = useMemo(
    () =>
      selectedPatient
        ? createTimeline(selectedPatient, selectedPatientAppointments, selectedPatientRecords)
        : [],
    [selectedPatient, selectedPatientAppointments, selectedPatientRecords],
  );

  const upcomingAppointment = selectedPatientAppointments.find(
    (appointment) => appointment.status !== "completed" && appointment.status !== "cancelled",
  );

  const triggerDocumentPicker = () => {
    if (!selectedPatient) {
      toast({
        title: "Select a patient first",
        description: "Choose a patient before uploading a record to the workspace.",
      });
      return;
    }

    documentInputRef.current?.click();
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedPatient) {
      event.target.value = "";
      return;
    }

    const documentTitle = file.name.replace(/\.[^/.]+$/, "");

    if (isPlaceholderDocumentLabel(documentTitle)) {
      toast({
        title: "Rename the file before uploading",
        description:
          "Use a meaningful medical document name instead of placeholder names like photo or test.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 900_000) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 900 KB for this demo workspace.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;

      if (typeof dataUrl !== "string") {
        return;
      }

      addPatientDocument({
        dataUrl,
        description: `Uploaded to ${selectedPatient.name}'s workspace for care review.`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        patientEmail: selectedPatient.email,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        sizeLabel: formatFileSize(file.size),
        title: file.name.replace(/\.[^/.]+$/, ""),
        uploadedBy: "Doctor Workspace",
      });

      toast({
        title: "Document uploaded",
        description: `${file.name} is now connected to ${selectedPatient.name}'s records.`,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const criticalCount = filteredPatients.filter(
    (patient) => patient.riskLevel === "critical",
  ).length;

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Patients</h1>
          <p className="mt-1 text-muted-foreground">
            Review patient details and medical records in one connected workspace.
          </p>
        </div>
        <button className="premium-button flex items-center gap-2 text-sm">
          <UserPlus size={15} />
          Add Patient
        </button>
      </div>

      <div className="gsap-in grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="premium-card p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                <Search size={14} className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, condition, or email..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                <Filter size={14} className="text-muted-foreground" />
                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {criticalCount > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="shrink-0 text-red-600" />
                <p className="text-sm font-medium text-red-700">
                  {criticalCount} patient(s) need immediate attention.
                </p>
              </div>
            </div>
          ) : null}

          <div className="premium-card p-3">
            <div className="space-y-2">
              {filteredPatients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  No patients match the current search or filter.
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const patientAppointments = appointments.filter(
                    (appointment) =>
                      appointment.patientId === patient.id ||
                      appointment.patientName === patient.name,
                  );
                  const patientRecordCount =
                    createRecordItems(patient, patientAppointments).length +
                    getDocumentsForPatient({
                      email: patient.email,
                      id: patient.id,
                      name: patient.name,
                    }).length;
                  const isActive = patient.id === selectedPatientId;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setActiveTab("overview");
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-white hover:border-primary/30 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-11 w-11 border border-border/60">
                            {patient.avatar ? (
                              <AvatarImage
                                src={patient.avatar}
                                alt={`${patient.name} profile`}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                              {getInitials(patient.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {patient.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.age} yr | {patient.gender}
                            </p>
                          </div>
                        </div>
                        <RiskBadge level={patient.riskLevel} />
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <p className="truncate">
                          Condition:{" "}
                          <span className="font-medium text-foreground">
                            {patient.condition || "No condition listed"}
                          </span>
                        </p>
                        <p>
                          Records:{" "}
                          <span className="font-medium text-foreground">
                            {patientRecordCount}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="premium-card min-h-[38rem] p-6">
          {!selectedPatient ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Select a patient to open the unified workspace.
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
                    {selectedPatient.avatar ? (
                      <AvatarImage
                        src={selectedPatient.avatar}
                        alt={`${selectedPatient.name} profile`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-lg font-bold text-white">
                      {getInitials(selectedPatient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-foreground">
                        {selectedPatient.name}
                      </h2>
                      <RiskBadge level={selectedPatient.riskLevel} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedPatient.age} years | {selectedPatient.gender} |{" "}
                      {selectedPatient.bloodType || "Blood type pending"}
                    </p>
                    <p className="mt-2 text-sm text-foreground/80">
                      {selectedPatient.condition || "General care monitoring"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat
                    label="Next Visit"
                    value={upcomingAppointment ? formatDateLabel(upcomingAppointment.date) : "No visit"}
                  />
                  <MiniStat
                    label="Last Visit"
                    value={selectedPatient.lastVisit ? formatDateLabel(selectedPatient.lastVisit) : "N/A"}
                  />
                  <MiniStat label="Records" value={String(selectedPatientRecords.length)} />
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-6 flex min-h-0 flex-1 flex-col"
              >
                <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl bg-muted/60 p-1.5">
                  <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="records" className="rounded-xl px-4 py-2.5">
                    Medical Record
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-5 flex-1">
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {[
                          { label: "Email", value: selectedPatient.email || "Not provided" },
                          { label: "Phone", value: selectedPatient.phone || "Not provided" },
                          { label: "Status", value: selectedPatient.status },
                          { label: "Doctor ID", value: String(selectedPatient.doctorId ?? "Unassigned") },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-foreground">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Heart size={18} className="text-red-500" />
                          <h3 className="text-base font-bold text-foreground">
                            Care Summary
                          </h3>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {selectedPatient.name} is being monitored for{" "}
                          <span className="font-semibold text-foreground">
                            {selectedPatient.condition || "general wellness"}
                          </span>
                          . Use the records tab to review uploaded documents and
                          ongoing patient follow-up details.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-primary" />
                        <h3 className="text-base font-bold text-foreground">
                          Appointment Activity
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {selectedPatientAppointments.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            No appointments connected to this patient yet.
                          </div>
                        ) : (
                          selectedPatientAppointments.slice(0, 4).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="rounded-xl border border-border/60 bg-muted/20 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {appointment.type || "Appointment"}
                                </p>
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                  {appointment.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateLabel(appointment.date)} | {appointment.time}
                              </p>
                              <p className="mt-2 text-xs text-foreground/80">
                                Doctor: {appointment.doctorName || "Care team"}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="records" className="mt-5 flex-1">
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 p-6">
                        <div className="flex flex-col items-center py-4 text-center">
                          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                            <Upload size={24} className="text-primary" />
                          </div>
                          <h3 className="text-base font-bold text-foreground">
                            Upload Documents for {selectedPatient.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Attach PDF, scan, or report files directly to this patient workspace.
                          </p>
                          <button
                            type="button"
                            onClick={triggerDocumentPicker}
                            className="premium-button mt-4 text-sm"
                          >
                            Browse Files
                          </button>
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedPatientRecords.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-2xl border border-border/60 bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                  <FileText size={18} className="text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {record.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {record.type} | {formatDateLabel(record.date)} | {record.size}
                                  </p>
                                  <p className="mt-2 text-sm text-foreground/80">
                                    {record.summary}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-start">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                    record.status === "reviewed"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {record.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => downloadRecord(record)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
                                >
                                  <Download size={14} className="text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-primary" />
                        <h3 className="text-base font-bold text-foreground">
                          Patient Timeline
                        </h3>
                      </div>
                      <div className="relative">
                        <div className="absolute bottom-2 left-4 top-2 w-px bg-border" />
                        <div className="space-y-4">
                          {timeline.map((item) => (
                            <div key={item.id} className="relative flex gap-3">
                              <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              </div>
                              <div className="pt-1">
                                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                  {item.label}
                                </span>
                                <p className="mt-1 text-sm font-medium text-foreground">
                                  {item.detail}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateLabel(item.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
