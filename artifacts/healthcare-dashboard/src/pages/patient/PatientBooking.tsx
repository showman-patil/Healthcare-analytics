import React, { useMemo, useRef, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Send,
  Star,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  type Appointment,
  type Doctor,
  useListAppointments,
  useListDoctors,
} from "@workspace/api-client-react";

import { toast } from "@/hooks/use-toast";
import { MOCK_APPOINTMENTS, MOCK_DOCTORS } from "@/lib/mock-data";
import { useDynamicDoctors } from "@/lib/doctor-directory";
import { usePortalData } from "@/lib/portal-data-context";

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

function statusClasses(status: Appointment["status"]) {
  if (status === "scheduled") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (status === "completed") {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

function timeLabel(appointment: Appointment) {
  return appointment.status === "pending"
    ? "Waiting for doctor time"
    : appointment.time;
}

export default function PatientBooking() {
  const container = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [type, setType] = useState("Consultation");
  const [notes, setNotes] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<Appointment | null>(null);

  const { data: apiDoctors } = useListDoctors();
  const { data: apiAppointments } = useListAppointments();
  const {
    createAppointmentRequest,
    currentPatientId,
    currentPatientReady,
    getPatientAppointments,
    patientProfile,
  } = usePortalData();
  const doctors = useDynamicDoctors(
    apiDoctors?.length ? [...apiDoctors, ...MOCK_DOCTORS] : MOCK_DOCTORS,
  );

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.07,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  const specialties = useMemo(
    () => ["all", ...Array.from(new Set(doctors.map((doctor) => doctor.specialty)))],
    [doctors],
  );

  const filteredDoctors = useMemo(
    () =>
      doctors.filter((doctor) => {
        const matchSearch = doctor.name.toLowerCase().includes(search.toLowerCase());
        const matchSpecialty = specialty === "all" || doctor.specialty === specialty;
        return matchSearch && matchSpecialty;
      }),
    [doctors, search, specialty],
  );

  const appointmentHistory = useMemo(
    () =>
      getPatientAppointments(apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS).slice(
        0,
        4,
      ),
    [apiAppointments, getPatientAppointments],
  );

  const handleRequest = () => {
    if (!currentPatientReady || !currentPatientId) {
      toast({
        title: "Patient profile syncing",
        description: "Please wait a moment while your portal profile connects to appointments.",
      });
      return;
    }

    if (!selectedDoctor || !selectedDate) {
      toast({
        title: "Select a doctor and date",
        description: "Choose your doctor and preferred appointment date before sending the request.",
      });
      return;
    }

    const nextRequest = createAppointmentRequest({
      date: selectedDate,
      doctorId: selectedDoctor.id,
      doctorEmail: selectedDoctor.email,
      doctorName: selectedDoctor.name,
      notes,
      type,
    });

    if (!nextRequest) {
      toast({
        title: "Request could not be sent",
        description: "Please try again once your patient profile is connected.",
        variant: "destructive",
      });
      return;
    }

    setSubmittedRequest(nextRequest);
    setTimeout(() => {
      gsap.from(".success-anim", {
        scale: 0.85,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(1.4)",
      });
    }, 40);
  };

  if (submittedRequest) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="success-anim premium-card w-full max-w-lg p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <CheckCircle size={32} className="text-blue-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Request Sent</h2>
          <p className="mb-6 text-muted-foreground">
            Your appointment request for{" "}
            <strong>{formatDateLabel(submittedRequest.date)}</strong> with{" "}
            <strong>{submittedRequest.doctorName}</strong> is now waiting for doctor approval.
            The doctor will assign a time and it will appear automatically in your portal.
          </p>

          <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Request Summary
            </p>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              <p>Doctor: {submittedRequest.doctorName}</p>
              <p>Date: {formatDateLabel(submittedRequest.date)}</p>
              <p>Type: {submittedRequest.type}</p>
              <p>Status: Awaiting doctor approval</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmittedRequest(null);
              setSelectedDoctor(null);
              setSelectedDate("");
              setType("Consultation");
              setNotes("");
            }}
            className="premium-button"
          >
            Send Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Request Appointment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick your doctor and preferred date. The doctor will review the request and
          assign the exact appointment time for {patientProfile.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="gsap-in space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
              <Search size={14} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {specialties.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Specialties" : item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No doctors match this search or specialty filter right now.
              </div>
            ) : (
              filteredDoctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`premium-card p-5 text-left transition-all hover:shadow-md ${
                    selectedDoctor?.id === doctor.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 font-bold text-white">
                      {doctor.name.split(" ").pop()?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                    </div>
                    {selectedDoctor?.id === doctor.id ? (
                      <CheckCircle size={18} className="ml-auto text-primary" />
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star size={11} className="fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">
                        {doctor.rating ?? "4.8"}
                      </span>
                    </span>
                    <span className="text-muted-foreground">{doctor.patients ?? 0} patients</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        doctor.status === "active"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-yellow-200 bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="gsap-in space-y-6 self-start">
          <div className="premium-card p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              {selectedDoctor ? `Request with ${selectedDoctor.name}` : "Select a Doctor"}
            </h2>

            {!currentPatientReady ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Connecting your patient profile to the appointment system...
              </div>
            ) : null}

            {!selectedDoctor ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Choose a doctor from the list to send an appointment request</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                  You choose the preferred date. The doctor approves the request and assigns
                  the final time.
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Appointment Type
                  </label>
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>Consultation</option>
                    <option>Follow-up</option>
                    <option>Emergency</option>
                    <option>Checkup</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Notes for Doctor
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Describe symptoms, urgency, or any timing preference..."
                    className="h-24 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRequest}
                  disabled={!selectedDate || !currentPatientReady}
                  className="flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50 premium-button"
                >
                  <Send size={15} />
                  Send Appointment Request
                </button>
              </div>
            )}
          </div>

          <div className="premium-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">My Request Status</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {appointmentHistory.length} tracked
              </span>
            </div>

            <div className="max-h-[15rem] space-y-3 overflow-y-auto pr-2">
              {appointmentHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No appointment requests yet. Once you send one, approval updates will appear here automatically.
                </div>
              ) : (
                appointmentHistory.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {appointment.doctorName || "Doctor"}
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClasses(
                          appointment.status,
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{appointment.type}</p>
                    <div className="mt-3 space-y-1.5 text-xs text-foreground/80">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-primary" />
                        <span>{formatDateLabel(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-primary" />
                        <span>{timeLabel(appointment)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
