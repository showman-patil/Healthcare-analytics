import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  FileText,
  Search,
  Stethoscope,
  type LucideIcon,
  UserCheck,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  getListAppointmentsQueryKey,
  getListDoctorsQueryKey,
  getListPatientsQueryKey,
  useListAppointments,
  useListDoctors,
  useListPatients,
} from "@workspace/api-client-react";

import type { UserRole } from "@/lib/auth";
import { useDynamicDoctors } from "@/lib/doctor-directory";
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_PATIENTS } from "@/lib/mock-data";
import { formatRelativeTime, usePortalData } from "@/lib/portal-data-context";

type NavLink = {
  icon: LucideIcon;
  label: string;
  path: string;
};

type SearchItem = {
  category: string;
  description: string;
  icon: LucideIcon;
  id: string;
  keywords: string[];
  path: string;
  title: string;
};

const placeholderByRole: Record<UserRole, string> = {
  admin: "Search users, doctors, analytics...",
  doctor: "Search patients, appointments, records...",
  patient: "Search doctors, appointments, records...",
};

const pageDescriptionByPath: Record<string, string> = {
  "/admin/dashboard": "Facility overview and system metrics",
  "/admin/users": "Manage doctors, patients, and access",
  "/admin/analytics": "Trends, capacity, and performance insights",
  "/admin/settings": "Permissions, notifications, and system setup",
  "/doctor/dashboard": "Today's schedule and clinical alerts",
  "/doctor/patients": "Assigned patients and case details",
  "/doctor/records": "Medical records and treatment history",
  "/doctor/appointments": "Upcoming visits and status updates",
  "/doctor/notifications": "Appointment requests and patient updates",
  "/doctor/messages": "Messages with patients and colleagues",
  "/patient/dashboard": "Overview, vitals, and recent activity",
  "/patient/records": "Reports, medications, and health history",
  "/patient/prediction": "Run AI symptom checks and assessments",
  "/patient/booking": "Find doctors and manage appointments",
  "/patient/notifications": "Alerts, reminders, and updates",
  "/patient/profile": "Personal details and medical profile",
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function formatCalendarDate(dateValue: string) {
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

function scoreItem(item: SearchItem, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const keywords = item.keywords.map((keyword) => normalizeText(keyword));

  let score = 0;

  if (title === normalizedQuery) {
    score += 120;
  } else if (title.startsWith(normalizedQuery)) {
    score += 95;
  } else if (title.includes(normalizedQuery)) {
    score += 72;
  }

  if (description.includes(normalizedQuery)) {
    score += 18;
  }

  keywords.forEach((keyword) => {
    if (!keyword) {
      return;
    }

    if (keyword === normalizedQuery) {
      score += 88;
    } else if (keyword.startsWith(normalizedQuery)) {
      score += 48;
    } else if (keyword.includes(normalizedQuery)) {
      score += 24;
    }
  });

  if (item.category === "Page") {
    score += 4;
  }

  return score;
}

export function PortalSearchBar({
  links,
  role,
}: {
  links: NavLink[];
  role: UserRole;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const {
    assessmentHistory,
    findPatientProfile,
    getAugmentedAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    notifications,
    patientProfile,
  } = usePortalData();

  const { data: apiPatients } = useListPatients({
    query: {
      enabled: role === "admin" || role === "doctor",
      queryKey: getListPatientsQueryKey(),
    },
  });
  const { data: apiDoctors } = useListDoctors({
    query: {
      enabled: role === "admin" || role === "patient",
      queryKey: getListDoctorsQueryKey(),
    },
  });
  const { data: apiAppointments } = useListAppointments({
    query: {
      enabled: role === "doctor" || role === "patient",
      queryKey: getListAppointmentsQueryKey(),
    },
  });

  const appointments = useMemo(() => {
    if (role === "doctor") {
      return getDoctorAppointments(
        apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS,
      );
    }

    if (role === "patient") {
      return getPatientAppointments(
        apiAppointments?.length ? apiAppointments : MOCK_APPOINTMENTS,
      );
    }

    return [];
  }, [
    apiAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    role,
  ]);

  const patients = useMemo(() => {
    if (role !== "admin" && role !== "doctor") {
      return [];
    }

    const basePatients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;
    const doctorPatientIds =
      role === "doctor"
        ? new Set(appointments.map((appointment) => appointment.patientId))
        : null;
    const mergedPatients = basePatients.map((patient) => {
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
        bloodType: sharedProfile.bloodType || patient.bloodType,
        condition: sharedProfile.chronicConditions || patient.condition,
        email: sharedProfile.email || patient.email,
        gender: sharedProfile.gender || patient.gender,
        name: sharedProfile.name || patient.name,
        phone: sharedProfile.phone || patient.phone,
      };
    });
    
    return role === "doctor"
      ? mergedPatients.filter((patient) => doctorPatientIds?.has(patient.id))
      : mergedPatients;
  }, [apiPatients, appointments, findPatientProfile, role]);

  const doctors = useDynamicDoctors(
    apiDoctors?.length ? [...apiDoctors, ...MOCK_DOCTORS] : MOCK_DOCTORS,
  );

  const searchableDoctors = useMemo(() => {
    if (role !== "admin" && role !== "patient") {
      return [];
    }

    return doctors;
  }, [doctors, role]);

  const searchItems = useMemo(() => {
    const pageItems: SearchItem[] = links.map((link) => ({
      category: "Page",
      description:
        pageDescriptionByPath[link.path] ?? `Open ${link.label.toLowerCase()}`,
      icon: link.icon,
      id: `page-${link.path}`,
      keywords: [link.label, link.path.replaceAll("/", " ")],
      path: link.path,
      title: link.label,
    }));

    if (role === "admin") {
      return [
        ...pageItems,
        ...patients.map((patient) => ({
          category: "Patient",
          description: `${patient.condition || "No condition"} • ${patient.email || patient.phone || "Open user management"}`,
          icon: Users,
          id: `admin-patient-${patient.id}`,
          keywords: [
            patient.name,
            patient.email ?? "",
            patient.phone ?? "",
            patient.condition ?? "",
            patient.bloodType ?? "",
            patient.status,
            patient.riskLevel,
          ],
          path: "/admin/users",
          title: patient.name,
        })),
        ...searchableDoctors.map((doctor) => ({
          category: "Doctor",
          description: `${doctor.specialty} • ${doctor.email || doctor.phone || "Open user management"}`,
          icon: Stethoscope,
          id: `admin-doctor-${doctor.id}`,
          keywords: [
            doctor.name,
            doctor.specialty,
            doctor.email ?? "",
            doctor.phone ?? "",
            doctor.status,
          ],
          path: "/admin/users",
          title: doctor.name,
        })),
      ];
    }

    if (role === "doctor") {
      return [
        ...pageItems,
        ...patients.map((patient) => ({
          category: "Patient",
          description: `${patient.condition || "No condition"} • ${patient.riskLevel} risk • ${patient.email || patient.phone || "Open patient directory"}`,
          icon: Users,
          id: `doctor-patient-${patient.id}`,
          keywords: [
            patient.name,
            patient.email ?? "",
            patient.phone ?? "",
            patient.condition ?? "",
            patient.bloodType ?? "",
            patient.status,
            patient.riskLevel,
          ],
          path: "/doctor/patients",
          title: patient.name,
        })),
        ...appointments.map((appointment) => ({
          category: "Appointment",
          description: `${appointment.type || "Appointment"} • ${formatCalendarDate(appointment.date)} • ${appointment.status}`,
          icon: Calendar,
          id: `doctor-appointment-${appointment.id}`,
          keywords: [
            appointment.patientName ?? "",
            appointment.doctorName ?? "",
            appointment.type ?? "",
            appointment.time,
            appointment.status,
            appointment.date,
          ],
          path: "/doctor/appointments",
          title: `${appointment.patientName || "Patient"} • ${appointment.time}`,
        })),
      ];
    }

    return [
      ...pageItems,
      {
        category: "Profile",
        description: `${patientProfile.email || "Profile"} • ${patientProfile.bloodType || "Blood type pending"} • ${patientProfile.phone || "No phone listed"}`,
        icon: UserCheck,
        id: "patient-profile",
        keywords: [
          patientProfile.name,
          patientProfile.email,
          patientProfile.phone,
          patientProfile.address,
          patientProfile.bloodType,
          patientProfile.allergies,
          patientProfile.chronicConditions,
          patientProfile.currentMedications,
          patientProfile.insuranceProvider,
        ],
        path: "/patient/profile",
        title: patientProfile.name || "My Profile",
      },
      ...searchableDoctors.map((doctor) => ({
        category: "Doctor",
        description: `${doctor.specialty} • ${doctor.status} • Open booking`,
        icon: Stethoscope,
        id: `patient-doctor-${doctor.id}`,
        keywords: [
          doctor.name,
          doctor.specialty,
          doctor.email ?? "",
          doctor.phone ?? "",
          doctor.status,
        ],
        path: "/patient/booking",
        title: doctor.name,
      })),
      ...appointments.map((appointment) => ({
        category: "Appointment",
        description: `${appointment.type || "Appointment"} • ${formatCalendarDate(appointment.date)} • ${appointment.status}`,
        icon: Calendar,
        id: `patient-appointment-${appointment.id}`,
        keywords: [
          appointment.doctorName ?? "",
          appointment.patientName ?? "",
          appointment.type ?? "",
          appointment.time,
          appointment.status,
          appointment.date,
        ],
        path: "/patient/booking",
        title: `${appointment.doctorName || "Appointment"} • ${appointment.time}`,
      })),
      ...assessmentHistory.map((assessment) => ({
        category: "Record",
        description: `${assessment.urgency} • ${assessment.summary}`,
        icon: FileText,
        id: `patient-assessment-${assessment.id}`,
        keywords: [
          assessment.primaryDiagnosis,
          assessment.summary,
          assessment.urgency,
          ...assessment.symptoms,
          ...assessment.recommendations,
        ],
        path: "/patient/records",
        title: `Assessment • ${assessment.primaryDiagnosis}`,
      })),
      ...notifications.map((notification) => ({
        category: "Alert",
        description: `${notification.read ? "Read" : "Unread"} • ${formatRelativeTime(notification.createdAt)}`,
        icon: Bell,
        id: `patient-notification-${notification.id}`,
        keywords: [
          notification.title,
          notification.message,
          notification.type,
          notification.read ? "read" : "unread",
        ],
        path: "/patient/notifications",
        title: notification.title,
      })),
    ];
  }, [
    appointments,
    assessmentHistory,
    searchableDoctors,
    links,
    notifications,
    patients,
    patientProfile,
    role,
  ]);

  const quickResults = useMemo(
    () => searchItems.filter((item) => item.category === "Page").slice(0, 6),
    [searchItems],
  );

  const normalizedQuery = normalizeText(query);

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return quickResults;
    }

    return searchItems
      .map((item) => ({
        item,
        score: scoreItem(item, normalizedQuery),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [normalizedQuery, quickResults, searchItems]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [normalizedQuery, results.length]);

  useEffect(() => {
    setIsOpen(false);
    setQuery("");
  }, [location]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleSelect = (item: SearchItem) => {
    setLocation(item.path);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setIsOpen(true);
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        current === 0 ? results.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(results[highlightedIndex] ?? results[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative hidden w-72 md:flex xl:w-96">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
        size={18}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholderByRole[role]}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-label={`${role} portal search`}
        className="w-full rounded-full bg-muted/50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
      />

      {isOpen && (results.length > 0 || normalizedQuery) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="border-b border-border/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {normalizedQuery ? "Search Results" : "Quick Links"}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No matches found in the {role} portal.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto p-2">
              {results.map((result, index) => {
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={result.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(result)}
                    className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                      isHighlighted
                        ? "bg-primary/8"
                        : "hover:bg-muted/60"
                    } ${location === result.path ? "ring-1 ring-primary/15" : ""}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <result.icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {result.title}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {result.category}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {result.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
