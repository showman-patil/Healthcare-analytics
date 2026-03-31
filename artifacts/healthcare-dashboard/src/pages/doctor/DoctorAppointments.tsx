import React, { useMemo, useRef, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "wouter";

import { useListAppointments } from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { usePortalData } from "@/lib/portal-data-context";

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] ?? styles.pending
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
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

export default function DoctorAppointments() {
  const container = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("all");
  const [activeApprovalId, setActiveApprovalId] = useState<number | null>(null);
  const [approvalDate, setApprovalDate] = useState("");
  const [approvalTime, setApprovalTime] = useState(TIME_SLOTS[0]);

  const { data: apiAppointments = MOCK_APPOINTMENTS } = useListAppointments();
  const {
    approveAppointmentRequest,
    getDoctorAppointments,
    rescheduleAppointment,
    updateAppointmentStatus,
  } = usePortalData();

  const appointments = useMemo(() => {
    const merged = getDoctorAppointments(apiAppointments);

    return [...merged].sort((left, right) => {
      if (left.status === "pending" && right.status !== "pending") {
        return -1;
      }

      if (left.status !== "pending" && right.status === "pending") {
        return 1;
      }

      return new Date(left.date).getTime() - new Date(right.date).getTime();
    });
  }, [apiAppointments, getDoctorAppointments]);

  useGSAP(() => {
    gsap.from(".gsap-in", {
      y: 25,
      opacity: 0,
      stagger: 0.08,
      duration: 0.5,
      ease: "power3.out",
    });
  }, { scope: container });

  const filteredAppointments = appointments.filter(
    (appointment) => filter === "all" || appointment.status === filter,
  );

  const stats = [
    {
      label: "Pending Requests",
      value: appointments.filter((appointment) => appointment.status === "pending").length,
      icon: Calendar,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Scheduled",
      value: appointments.filter((appointment) => appointment.status === "scheduled").length,
      icon: Clock,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Completed",
      value: appointments.filter((appointment) => appointment.status === "completed").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Cancelled",
      value: appointments.filter((appointment) => appointment.status === "cancelled").length,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
    },
  ];

  const openApprovalPanel = (appointment: (typeof appointments)[number]) => {
    setActiveApprovalId(appointment.id);
    setApprovalDate(appointment.date);
    setApprovalTime(
      appointment.status === "scheduled" &&
        appointment.time !== "Pending doctor confirmation"
        ? appointment.time
        : TIME_SLOTS[0],
    );
  };

  const closeApprovalPanel = () => {
    setActiveApprovalId(null);
    setApprovalDate("");
    setApprovalTime(TIME_SLOTS[0]);
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Appointments</h1>
          <p className="mt-1 text-muted-foreground">
            Review patient appointment requests, accept them, and assign the final time.
          </p>
        </div>
        <Link href="/doctor/patients" className="premium-button flex items-center gap-2 text-sm">
          <Plus size={15} />
          Open Patient Directory
        </Link>
      </div>

      <div className="gsap-in grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="premium-card p-4">
            <div
              className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}
            >
              <item.icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="gsap-in flex flex-wrap gap-2">
        {["all", "pending", "scheduled", "completed", "cancelled"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="premium-card gsap-in p-6">
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No appointments found for this view.
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const isPending = appointment.status === "pending";
              const approvalOpen = activeApprovalId === appointment.id;

              return (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {(appointment.patientName ?? "P").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {appointment.patientName}
                          </p>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {appointment.type ?? "Consultation"} with{" "}
                          {appointment.doctorName ?? "Care team"}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-foreground/80">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary" />
                            {formatDateLabel(appointment.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            {isPending ? "Doctor time not assigned yet" : appointment.time}
                          </span>
                        </div>
                        {appointment.notes ? (
                          <div className="mt-3 rounded-xl border border-border/60 bg-white px-3 py-2.5 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Patient note:</span>{" "}
                            {appointment.notes}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openApprovalPanel(appointment)}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Accept & Set Time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextAppointment = updateAppointmentStatus(
                                appointment,
                                "cancelled",
                              );
                              toast({
                                title: "Request cancelled",
                                description: `${nextAppointment.patientName}'s appointment request was cancelled.`,
                              });
                            }}
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            <XCircle size={11} />
                            Decline
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const nextAppointment = rescheduleAppointment(appointment);
                              toast({
                                title: "Appointment moved",
                                description: `${nextAppointment.patientName} now needs a new time for ${formatDateLabel(nextAppointment.date)}.`,
                              });
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                          >
                            <RefreshCw size={11} />
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextAppointment = updateAppointmentStatus(
                                appointment,
                                "cancelled",
                              );
                              toast({
                                title: "Appointment cancelled",
                                description: `${nextAppointment.patientName}'s appointment was marked cancelled.`,
                              });
                            }}
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            <XCircle size={11} />
                            Cancel
                          </button>
                          {appointment.status !== "completed" ? (
                            <button
                              type="button"
                              onClick={() => {
                                const nextAppointment = updateAppointmentStatus(
                                  appointment,
                                  "completed",
                                );
                                toast({
                                  title: "Appointment completed",
                                  description: `${nextAppointment.patientName} has been marked as completed.`,
                                });
                              }}
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              <CheckCircle size={11} />
                              Complete
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {approvalOpen ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr_auto] md:items-end">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                            Confirm Date
                          </label>
                          <input
                            type="date"
                            value={approvalDate}
                            onChange={(event) => setApprovalDate(event.target.value)}
                            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                            Assign Time
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {TIME_SLOTS.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setApprovalTime(slot)}
                                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                                  approvalTime === slot
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-white text-foreground hover:bg-muted"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 md:flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              if (!approvalDate || !approvalTime) {
                                toast({
                                  title: "Add date and time",
                                  description: "Select the confirmed appointment date and time before approving.",
                                });
                                return;
                              }

                              const nextAppointment = approveAppointmentRequest(
                                appointment,
                                {
                                  date: approvalDate,
                                  time: approvalTime,
                                },
                              );

                              toast({
                                title: "Appointment approved",
                                description: `${nextAppointment.patientName} is scheduled for ${formatDateLabel(nextAppointment.date)} at ${nextAppointment.time}.`,
                              });
                              closeApprovalPanel();
                            }}
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={closeApprovalPanel}
                            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
