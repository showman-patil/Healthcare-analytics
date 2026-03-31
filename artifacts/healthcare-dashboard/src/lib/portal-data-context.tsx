import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Appointment,
  type PredictionResult,
  getListAppointmentsQueryKey,
  getListPatientsQueryKey,
  useCreatePatient,
  useListPatients,
} from "@workspace/api-client-react";

import type { UserRole } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import type { PatientAssessmentContext } from "@/lib/patient-report";

type NotificationType = "critical" | "warning" | "info" | "success";
type NotificationRole = Exclude<UserRole, "admin">;

export type PatientPortalProfile = {
  name: string;
  age: string;
  gender: string;
  email: string;
  profileImage?: string;
  phone: string;
  address: string;
  bloodType: string;
  weight: string;
  height: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  smoking: string;
  alcohol: string;
  exercise: string;
  chronicConditions: string;
  currentMedications: string;
  insuranceProvider: string;
  insuranceId: string;
};

export type PatientPortalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type PatientAssessmentEntry = {
  id: string;
  createdAt: string;
  primaryDiagnosis: string;
  riskLevel: PredictionResult["riskLevel"];
  riskScore: number;
  urgency: string;
  summary: string;
  symptoms: string[];
  bloodPressure: string;
  bloodSugar: number;
  bmi: number;
  cholesterol: number;
  recommendations: string[];
  redFlags: string[];
};

export type PatientPortalDocument = {
  createdAt: string;
  dataUrl: string;
  description: string;
  fileName: string;
  id: string;
  mimeType: string;
  patientEmail?: string;
  patientId?: number;
  patientName: string;
  sizeLabel: string;
  title: string;
  uploadedBy: string;
};

type AppointmentOverride = {
  date?: string;
  status?: Appointment["status"];
  time?: string;
};

type PortalStore = {
  appointmentOverrides: Record<string, AppointmentOverride>;
  assessmentsByEmail: Record<string, PatientAssessmentEntry[]>;
  documents: PatientPortalDocument[];
  localAppointments: Appointment[];
  notificationsByAccount: Record<string, PatientPortalNotification[]>;
  notificationsByEmail: Record<string, PatientPortalNotification[]>;
  profilesByEmail: Record<string, PatientPortalProfile>;
};

type PortalDataContextValue = {
  addAssessment: (params: {
    context: PatientAssessmentContext;
    recommendations: string[];
    result: PredictionResult;
    summary: string;
  }) => void;
  adminDeleteDoctorData: (match: {
    email?: string | null;
    name?: string | null;
  }) => void;
  adminDeletePatientData: (match: {
    email?: string | null;
    name?: string | null;
  }) => void;
  adminSyncDoctorData: (params: {
    nextEmail?: string | null;
    nextName?: string | null;
    previousEmail?: string | null;
    previousName?: string | null;
  }) => void;
  adminUpsertPatientProfile: (params: {
    nextEmail: string;
    nextName: string;
    previousEmail?: string | null;
    previousName?: string | null;
    updates: Partial<PatientPortalProfile>;
  }) => void;
  addNotification: (notification: {
    message: string;
    title: string;
    type: NotificationType;
  }) => void;
  addPatientDocument: (document: {
    dataUrl: string;
    description: string;
    fileName: string;
    mimeType: string;
    patientEmail?: string | null;
    patientId?: number | null;
    patientName: string;
    sizeLabel: string;
    title: string;
    uploadedBy: string;
  }) => PatientPortalDocument;
  approveAppointmentRequest: (
    appointment: Appointment,
    schedule: {
      date: string;
      time: string;
    },
  ) => Appointment;
  assessmentHistory: PatientAssessmentEntry[];
  createAppointmentRequest: (params: {
    date: string;
    doctorId: number;
    doctorEmail?: string;
    doctorName?: string;
    notes?: string;
    type?: string;
  }) => Appointment | null;
  currentPatientId: number | null;
  currentPatientReady: boolean;
  dismissNotification: (id: string) => void;
  findPatientProfile: (match: {
    email?: string | null;
    name?: string | null;
  }) => PatientPortalProfile | null;
  getDocumentsForPatient: (match: {
    email?: string | null;
    id?: number | null;
    name?: string | null;
  }) => PatientPortalDocument[];
  getAugmentedAppointments: (appointments: Appointment[]) => Appointment[];
  getDoctorAppointments: (appointments: Appointment[]) => Appointment[];
  getPatientAppointments: (appointments: Appointment[]) => Appointment[];
  lastAssessment: PatientAssessmentEntry | null;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  notifications: PatientPortalNotification[];
  patientProfile: PatientPortalProfile;
  rescheduleAppointment: (appointment: Appointment) => Appointment;
  updateAppointmentStatus: (
    appointment: Appointment,
    status: Appointment["status"],
  ) => Appointment;
  updatePatientProfile: (updates: Partial<PatientPortalProfile>) => void;
};

const STORAGE_KEY = "medixai.portal-data.v1";
const PLACEHOLDER_DOCUMENT_LABELS = new Set([
  "document",
  "file",
  "image",
  "img",
  "photo",
  "pp 4",
  "pp4",
  "sample",
  "test",
  "untitled",
  "upload",
]);

const emptyStore: PortalStore = {
  appointmentOverrides: {},
  assessmentsByEmail: {},
  documents: [],
  localAppointments: [],
  notificationsByAccount: {},
  notificationsByEmail: {},
  profilesByEmail: {},
};

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeDocumentLabel(value: string) {
  return value
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function isPlaceholderDocumentLabel(value: string) {
  const normalizedValue = normalizeDocumentLabel(value);

  return !normalizedValue || PLACEHOLDER_DOCUMENT_LABELS.has(normalizedValue);
}

const LEGACY_DEFAULT_PROFILE_VALUES = {
  age: "45",
  gender: "Male",
  phone: "+1-555-1001",
  address: "123 Health Avenue, Springfield",
  bloodType: "A+",
  weight: "82 kg",
  height: "175 cm",
  allergies: "No known allergies",
  emergencyContact: "Primary caregiver",
  emergencyPhone: "+1-555-9001",
  smoking: "Never",
  alcohol: "Occasional",
  exercise: "Moderate (3x/week)",
  chronicConditions: "Hypertension",
  currentMedications: "None listed",
  insuranceProvider: "BlueCross BlueShield",
  insuranceId: "BCB-448291-A",
} satisfies Partial<PatientPortalProfile>;

function sanitizeProfileDefaults(profile: PatientPortalProfile): PatientPortalProfile {
  const matchesLegacyDefaults = Object.entries(LEGACY_DEFAULT_PROFILE_VALUES).every(
    ([field, value]) =>
      (profile[field as keyof typeof LEGACY_DEFAULT_PROFILE_VALUES] ?? "") === value,
  );

  if (!matchesLegacyDefaults) {
    return profile;
  }

  return {
    ...profile,
    age: "",
    gender: "",
    phone: "",
    address: "",
    bloodType: "",
    weight: "",
    height: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    smoking: "",
    alcohol: "",
    exercise: "",
    chronicConditions: "",
    currentMedications: "",
    insuranceProvider: "",
    insuranceId: "",
  };
}

function sanitizeDocuments(documents: PatientPortalDocument[]) {
  return documents.filter((document) => {
    const normalizedTitle = normalizeDocumentLabel(document.title ?? "");
    const normalizedFileName = normalizeDocumentLabel(document.fileName ?? "");
    const hasPlaceholderTitle =
      normalizedTitle.length > 0 && isPlaceholderDocumentLabel(normalizedTitle);
    const hasPlaceholderFileName =
      normalizedFileName.length > 0 && isPlaceholderDocumentLabel(normalizedFileName);

    return !hasPlaceholderTitle && !hasPlaceholderFileName;
  });
}

function sanitizeStore(store: PortalStore): PortalStore {
  const nextStore = { ...emptyStore, ...store };
  const sanitizedProfilesByEmail = Object.fromEntries(
    Object.entries(nextStore.profilesByEmail ?? {}).map(([email, profile]) => [
      email,
      sanitizeProfileDefaults(profile),
    ]),
  );

  return {
    ...nextStore,
    documents: sanitizeDocuments(Array.isArray(nextStore.documents) ? nextStore.documents : []),
    profilesByEmail: sanitizedProfilesByEmail,
  };
}

function readStore(): PortalStore {
  if (!canUseStorage()) {
    return emptyStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeStore(JSON.parse(raw) as PortalStore) : emptyStore;
  } catch {
    return emptyStore;
  }
}

function writeStore(store: PortalStore) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLocalAppointmentId() {
  return -(Date.now() + Math.floor(Math.random() * 1000));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function canHaveNotifications(role: UserRole | null | undefined): role is NotificationRole {
  return role === "doctor" || role === "patient";
}

function createNotificationAccountKey(role: NotificationRole, email: string) {
  return `${role}:${normalizeEmail(email)}`;
}

function documentMatchesPatient(
  document: PatientPortalDocument,
  match: {
    email?: string | null;
    id?: number | null;
    name?: string | null;
  },
) {
  const normalizedMatchEmail = match.email ? normalizeEmail(match.email) : "";
  const normalizedMatchName = match.name ? normalizeName(match.name) : "";

  return Boolean(
    (match.id && document.patientId === match.id) ||
      (normalizedMatchEmail &&
        normalizeEmail(document.patientEmail ?? "") === normalizedMatchEmail) ||
      (normalizedMatchName &&
        normalizeName(document.patientName) === normalizedMatchName),
  );
}

function shiftDate(dateValue: string, days: number) {
  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function formatAppointmentDate(dateValue: string) {
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

function defaultProfile(fullName: string, email: string): PatientPortalProfile {
  return {
    name: fullName,
    age: "",
    gender: "",
    email,
    profileImage: "",
    phone: "",
    address: "",
    bloodType: "",
    weight: "",
    height: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    smoking: "",
    alcohol: "",
    exercise: "",
    chronicConditions: "",
    currentMedications: "",
    insuranceProvider: "",
    insuranceId: "",
  };
}

function seedNotifications(
  role: NotificationRole,
  fullName: string,
): PatientPortalNotification[] {
  const createdAt = new Date().toISOString();

  if (role === "doctor") {
    return [
      {
        id: createId("notif"),
        type: "info",
        title: "Doctor panel ready",
        message: `${fullName}, your doctor workspace is connected. New appointment requests and patient updates will appear here automatically.`,
        createdAt,
        read: false,
      },
      {
        id: createId("notif"),
        type: "success",
        title: "Patient requests connected",
        message: "When a patient books with your account, the request will show up in your notifications and appointments instantly.",
        createdAt,
        read: false,
      },
    ];
  }

  return [
    {
      id: createId("notif"),
      type: "info",
      title: "Portal Ready",
      message: `${fullName}, your patient workspace is ready. You can now check symptoms, book appointments, and review records in one place.`,
      createdAt,
      read: false,
    },
    {
      id: createId("notif"),
      type: "success",
      title: "Symptom Checker Connected",
      message: "New AI assessments will now appear in your dashboard, records, and notifications automatically.",
      createdAt,
      read: false,
    },
  ];
}

export function formatRelativeTime(isoString: string): string {
  const timestamp = new Date(isoString).getTime();

  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [store, setStore] = useState<PortalStore>(() => readStore());
  const ensureAttemptRef = useRef<string | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);

  const notificationAccountKey =
    session && canHaveNotifications(session.role)
      ? createNotificationAccountKey(session.role, session.email)
      : null;
  const patientEmailKey =
    session?.role === "patient" ? normalizeEmail(session.email) : null;

  const profileFallback = useMemo(
    () => defaultProfile(session?.fullName ?? "Patient User", session?.email ?? ""),
    [session?.email, session?.fullName],
  );

  const patientProfile = patientEmailKey
    ? {
        ...profileFallback,
        ...(store.profilesByEmail[patientEmailKey] ?? {}),
      }
    : profileFallback;

  const notifications = notificationAccountKey
    ? store.notificationsByAccount[notificationAccountKey] ??
      (patientEmailKey ? store.notificationsByEmail[patientEmailKey] ?? [] : [])
    : [];

  const assessmentHistory = patientEmailKey
    ? store.assessmentsByEmail[patientEmailKey] ?? []
    : [];

  const { data: patientsData } = useListPatients();
  const { mutate: createPatient, isPending: isCreatingPatient } = useCreatePatient();

  useEffect(() => {
    setStore((current) => {
      const nextStore = sanitizeStore(current);
      const sameDocuments =
        nextStore.documents.length === current.documents.length &&
        nextStore.documents.every(
          (document, index) => document.id === current.documents[index]?.id,
        );

      return sameDocuments ? current : nextStore;
    });
  }, []);

  useEffect(() => {
    writeStore(store);
  }, [store]);

  useEffect(() => {
    if (!session || !notificationAccountKey) {
      return;
    }

    setStore((current) => {
      const notificationRole = canHaveNotifications(session.role) ? session.role : null;

      if (!notificationRole) {
        return current;
      }

      const nextProfiles =
        session.role === "patient" && patientEmailKey && !current.profilesByEmail[patientEmailKey]
          ? {
              ...current.profilesByEmail,
              [patientEmailKey]: defaultProfile(session.fullName, session.email),
            }
          : current.profilesByEmail;
      const migratedLegacyNotifications =
        session.role === "patient" && patientEmailKey
          ? current.notificationsByEmail[patientEmailKey]
          : undefined;
      const nextNotifications =
        current.notificationsByAccount[notificationAccountKey] ||
        migratedLegacyNotifications?.length
          ? {
              ...current.notificationsByAccount,
              ...(current.notificationsByAccount[notificationAccountKey]
                ? {}
                : {
                    [notificationAccountKey]:
                      migratedLegacyNotifications && migratedLegacyNotifications.length > 0
                        ? migratedLegacyNotifications
                        : seedNotifications(notificationRole, session.fullName),
                  }),
            }
          : {
              ...current.notificationsByAccount,
              [notificationAccountKey]: seedNotifications(notificationRole, session.fullName),
            };

      if (
        nextProfiles === current.profilesByEmail &&
        nextNotifications === current.notificationsByAccount
      ) {
        return current;
      }

      return {
        ...current,
        notificationsByAccount: nextNotifications,
        profilesByEmail: nextProfiles,
      };
    });
  }, [notificationAccountKey, patientEmailKey, session]);

  useEffect(() => {
    if (session?.role !== "patient" || !patientEmailKey) {
      setCurrentPatientId(null);
      return;
    }

    const patients = patientsData ?? [];
    const existingPatient = patients.find(
      (patient) =>
        normalizeEmail(patient.email ?? "") === patientEmailKey ||
        patient.name === patientProfile.name,
    );

    if (existingPatient) {
      setCurrentPatientId(existingPatient.id);
      ensureAttemptRef.current = null;
      return;
    }

    if (isCreatingPatient || ensureAttemptRef.current === patientEmailKey) {
      return;
    }

    ensureAttemptRef.current = patientEmailKey;

    createPatient(
      {
        data: {
          name: patientProfile.name,
          age: Number(patientProfile.age) || 45,
          gender: patientProfile.gender,
          bloodType: patientProfile.bloodType || undefined,
          phone: patientProfile.phone || undefined,
          email: patientProfile.email || session.email,
          condition: patientProfile.chronicConditions || "General care",
          doctorId: 1,
        },
      },
      {
        onError: () => {
          ensureAttemptRef.current = null;
        },
        onSuccess: (patient) => {
          setCurrentPatientId(patient.id);
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        },
      },
    );
  }, [
    createPatient,
    isCreatingPatient,
    patientEmailKey,
    patientProfile,
    patientsData,
    queryClient,
    session,
  ]);

  const upsertNotification = (
    existing: PatientPortalNotification[],
    notification: PatientPortalNotification,
  ) => [notification, ...existing].slice(0, 25);

  const appendNotification = (
    existingNotifications: Record<string, PatientPortalNotification[]>,
    accountKey: string,
    notification: {
      message: string;
      title: string;
      type: NotificationType;
    },
  ) => ({
    ...existingNotifications,
    [accountKey]: upsertNotification(existingNotifications[accountKey] ?? [], {
      id: createId("notif"),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: new Date().toISOString(),
      read: false,
    }),
  });

  const appendNotificationForRole = (
    existingNotifications: Record<string, PatientPortalNotification[]>,
    role: NotificationRole,
    email: string,
    notification: {
      message: string;
      title: string;
      type: NotificationType;
    },
  ) =>
    appendNotification(
      existingNotifications,
      createNotificationAccountKey(role, email),
      notification,
    );

  const resolvePatientEmailKey = (current: PortalStore, appointment: Appointment) => {
    const patientById = (patientsData ?? []).find(
      (patient) => patient.id === appointment.patientId,
    );

    if (patientById?.email) {
      return normalizeEmail(patientById.email);
    }

    const normalizedPatientName = normalizeName(
      appointment.patientName ?? patientById?.name ?? "",
    );

    if (!normalizedPatientName) {
      return null;
    }

    const matchedEntry = Object.entries(current.profilesByEmail).find(([, profile]) => {
      return normalizeName(profile.name) === normalizedPatientName;
    });

    return matchedEntry?.[0] ?? null;
  };

  const addNotification = (notification: {
    message: string;
    title: string;
    type: NotificationType;
  }) => {
    if (!notificationAccountKey) {
      return;
    }

    setStore((current) => ({
      ...current,
      notificationsByAccount: appendNotification(
        current.notificationsByAccount,
        notificationAccountKey,
        notification,
      ),
    }));
  };

  const addPatientDocument = (document: {
    dataUrl: string;
    description: string;
    fileName: string;
    mimeType: string;
    patientEmail?: string | null;
    patientId?: number | null;
    patientName: string;
    sizeLabel: string;
    title: string;
    uploadedBy: string;
  }) => {
    const nextDocument: PatientPortalDocument = {
      createdAt: new Date().toISOString(),
      dataUrl: document.dataUrl,
      description: document.description,
      fileName: document.fileName,
      id: createId("document"),
      mimeType: document.mimeType,
      patientEmail: document.patientEmail ? normalizeEmail(document.patientEmail) : undefined,
      patientId: document.patientId ?? undefined,
      patientName: document.patientName,
      sizeLabel: document.sizeLabel,
      title: document.title,
      uploadedBy: document.uploadedBy,
    };

    setStore((current) => ({
      ...current,
      documents: [nextDocument, ...current.documents].slice(0, 50),
    }));

    return nextDocument;
  };

  const updatePatientProfile = (updates: Partial<PatientPortalProfile>) => {
    if (!patientEmailKey) {
      return;
    }

    setStore((current) => ({
      ...current,
      profilesByEmail: {
        ...current.profilesByEmail,
        [patientEmailKey]: {
          ...(current.profilesByEmail[patientEmailKey] ?? profileFallback),
          ...updates,
        },
      },
    }));
  };

  const adminUpsertPatientProfile = (params: {
    nextEmail: string;
    nextName: string;
    previousEmail?: string | null;
    previousName?: string | null;
    updates: Partial<PatientPortalProfile>;
  }) => {
    const nextEmailKey = normalizeEmail(params.nextEmail);
    const previousEmailKey = params.previousEmail ? normalizeEmail(params.previousEmail) : "";
    const previousNameKey = params.previousName ? normalizeName(params.previousName) : "";
    const nextName = params.nextName.trim() || params.updates.name?.trim() || "Patient User";

    if (!nextEmailKey) {
      return;
    }

    setStore((current) => {
      const baseProfile =
        current.profilesByEmail[previousEmailKey] ??
        current.profilesByEmail[nextEmailKey] ??
        defaultProfile(nextName, nextEmailKey);

      const nextProfiles = { ...current.profilesByEmail };
      const nextAssessments = { ...current.assessmentsByEmail };
      const nextNotificationsByAccount = { ...current.notificationsByAccount };
      const nextLegacyNotifications = { ...current.notificationsByEmail };
      const previousNotificationKey = previousEmailKey
        ? createNotificationAccountKey("patient", previousEmailKey)
        : "";
      const nextNotificationKey = createNotificationAccountKey("patient", nextEmailKey);

      if (previousEmailKey && previousEmailKey !== nextEmailKey) {
        delete nextProfiles[previousEmailKey];

        if (nextAssessments[previousEmailKey]) {
          nextAssessments[nextEmailKey] = nextAssessments[previousEmailKey];
          delete nextAssessments[previousEmailKey];
        }

        if (previousNotificationKey && nextNotificationsByAccount[previousNotificationKey]) {
          nextNotificationsByAccount[nextNotificationKey] =
            nextNotificationsByAccount[previousNotificationKey];
          delete nextNotificationsByAccount[previousNotificationKey];
        }

        if (nextLegacyNotifications[previousEmailKey]) {
          nextLegacyNotifications[nextEmailKey] = nextLegacyNotifications[previousEmailKey];
          delete nextLegacyNotifications[previousEmailKey];
        }
      }

      nextProfiles[nextEmailKey] = {
        ...baseProfile,
        ...params.updates,
        name: nextName,
        email: nextEmailKey,
      };

      if (!nextNotificationsByAccount[nextNotificationKey]) {
        nextNotificationsByAccount[nextNotificationKey] = seedNotifications("patient", nextName);
      }

      return {
        ...current,
        assessmentsByEmail: nextAssessments,
        documents: current.documents.map((document) => {
          const matchesPreviousPatient =
            (previousEmailKey &&
              normalizeEmail(document.patientEmail ?? "") === previousEmailKey) ||
            (previousNameKey &&
              normalizeName(document.patientName) === previousNameKey);

          return matchesPreviousPatient
            ? {
                ...document,
                patientEmail: nextEmailKey,
                patientName: nextName,
              }
            : document;
        }),
        localAppointments: current.localAppointments.map((appointment) => {
          const matchesPreviousPatient =
            previousNameKey &&
            normalizeName(appointment.patientName ?? "") === previousNameKey;

          return matchesPreviousPatient
            ? {
                ...appointment,
                patientName: nextName,
              }
            : appointment;
        }),
        notificationsByAccount: nextNotificationsByAccount,
        notificationsByEmail: nextLegacyNotifications,
        profilesByEmail: nextProfiles,
      };
    });
  };

  const adminDeletePatientData = (match: {
    email?: string | null;
    name?: string | null;
  }) => {
    const emailKey = match.email ? normalizeEmail(match.email) : "";
    const nameKey = match.name ? normalizeName(match.name) : "";

    setStore((current) => {
      const nextProfiles = { ...current.profilesByEmail };
      const nextAssessments = { ...current.assessmentsByEmail };
      const nextNotificationsByAccount = { ...current.notificationsByAccount };
      const nextLegacyNotifications = { ...current.notificationsByEmail };

      if (emailKey) {
        delete nextProfiles[emailKey];
        delete nextAssessments[emailKey];
        delete nextLegacyNotifications[emailKey];
        delete nextNotificationsByAccount[createNotificationAccountKey("patient", emailKey)];
      }

      return {
        ...current,
        assessmentsByEmail: nextAssessments,
        documents: current.documents.filter((document) => {
          const matchesEmail =
            emailKey && normalizeEmail(document.patientEmail ?? "") === emailKey;
          const matchesName =
            nameKey && normalizeName(document.patientName) === nameKey;

          return !(matchesEmail || matchesName);
        }),
        localAppointments: current.localAppointments.filter((appointment) => {
          const matchesName =
            nameKey && normalizeName(appointment.patientName ?? "") === nameKey;

          return !matchesName;
        }),
        notificationsByAccount: nextNotificationsByAccount,
        notificationsByEmail: nextLegacyNotifications,
        profilesByEmail: nextProfiles,
      };
    });
  };

  const adminSyncDoctorData = (params: {
    nextEmail?: string | null;
    nextName?: string | null;
    previousEmail?: string | null;
    previousName?: string | null;
  }) => {
    const previousEmailKey = params.previousEmail ? normalizeEmail(params.previousEmail) : "";
    const nextEmailKey = params.nextEmail ? normalizeEmail(params.nextEmail) : "";
    const previousNameKey = params.previousName ? normalizeName(params.previousName) : "";
    const nextName = params.nextName?.trim() ?? "";

    setStore((current) => {
      const nextNotificationsByAccount = { ...current.notificationsByAccount };

      if (
        previousEmailKey &&
        nextEmailKey &&
        previousEmailKey !== nextEmailKey
      ) {
        const previousNotificationKey = createNotificationAccountKey("doctor", previousEmailKey);
        const nextNotificationKey = createNotificationAccountKey("doctor", nextEmailKey);

        if (nextNotificationsByAccount[previousNotificationKey]) {
          nextNotificationsByAccount[nextNotificationKey] =
            nextNotificationsByAccount[previousNotificationKey];
          delete nextNotificationsByAccount[previousNotificationKey];
        }
      }

      return {
        ...current,
        localAppointments: current.localAppointments.map((appointment) => {
          const matchesPreviousDoctor =
            previousNameKey &&
            normalizeName(appointment.doctorName ?? "") === previousNameKey;

          return matchesPreviousDoctor && nextName
            ? {
                ...appointment,
                doctorName: nextName,
              }
            : appointment;
        }),
        notificationsByAccount: nextNotificationsByAccount,
      };
    });
  };

  const adminDeleteDoctorData = (match: {
    email?: string | null;
    name?: string | null;
  }) => {
    const emailKey = match.email ? normalizeEmail(match.email) : "";
    const nameKey = match.name ? normalizeName(match.name) : "";

    setStore((current) => {
      const nextNotificationsByAccount = { ...current.notificationsByAccount };

      if (emailKey) {
        delete nextNotificationsByAccount[createNotificationAccountKey("doctor", emailKey)];
      }

      return {
        ...current,
        localAppointments: current.localAppointments.filter((appointment) => {
          const matchesName =
            nameKey && normalizeName(appointment.doctorName ?? "") === nameKey;

          return !matchesName;
        }),
        notificationsByAccount: nextNotificationsByAccount,
      };
    });
  };

  const findPatientProfile = (match: {
    email?: string | null;
    name?: string | null;
  }) => {
    const normalizedMatchEmail = match.email ? normalizeEmail(match.email) : "";
    const normalizedMatchName = match.name ? normalizeName(match.name) : "";

    if (normalizedMatchEmail && store.profilesByEmail[normalizedMatchEmail]) {
      return store.profilesByEmail[normalizedMatchEmail] ?? null;
    }

    return (
      Object.values(store.profilesByEmail).find((profile) => {
        const emailMatches =
          normalizedMatchEmail &&
          normalizeEmail(profile.email ?? "") === normalizedMatchEmail;
        const nameMatches =
          normalizedMatchName &&
          normalizeName(profile.name) === normalizedMatchName;

        return Boolean(emailMatches || nameMatches);
      }) ?? null
    );
  };

  const getDocumentsForPatient = (match: {
    email?: string | null;
    id?: number | null;
    name?: string | null;
  }) =>
    store.documents
      .filter((document) => documentMatchesPatient(document, match))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

  const addAssessment = (params: {
    context: PatientAssessmentContext;
    recommendations: string[];
    result: PredictionResult;
    summary: string;
  }) => {
    if (!patientEmailKey) {
      return;
    }

    const assessment: PatientAssessmentEntry = {
      id: createId("assessment"),
      createdAt: new Date().toISOString(),
      primaryDiagnosis: params.result.primaryDiagnosis,
      riskLevel: params.result.riskLevel,
      riskScore: params.result.riskScore,
      urgency: params.result.urgency,
      summary: params.summary,
      symptoms: params.context.symptoms,
      bloodPressure: `${params.context.systolic}/${params.context.diastolic}`,
      bloodSugar: params.context.bloodSugar,
      bmi: params.context.bmi,
      cholesterol: params.context.cholesterol,
      recommendations: params.recommendations,
      redFlags: params.result.redFlags,
    };

    setStore((current) => ({
      ...current,
      assessmentsByEmail: {
        ...current.assessmentsByEmail,
        [patientEmailKey]: [
          assessment,
          ...(current.assessmentsByEmail[patientEmailKey] ?? []),
        ].slice(0, 15),
      },
      notificationsByAccount: appendNotification(
        current.notificationsByAccount,
        notificationAccountKey ?? createNotificationAccountKey("patient", patientEmailKey),
        {
          type:
            params.result.riskLevel === "critical" || params.result.riskLevel === "high"
              ? "warning"
              : "info",
          title: "New AI Health Assessment",
          message: `${params.result.primaryDiagnosis} was added to your records with ${params.result.urgency.toLowerCase()} guidance.`,
        },
      ),
    }));
  };

  const markNotificationRead = (id: string) => {
    if (!notificationAccountKey) {
      return;
    }

    setStore((current) => ({
      ...current,
      notificationsByAccount: {
        ...current.notificationsByAccount,
        [notificationAccountKey]: (current.notificationsByAccount[notificationAccountKey] ?? []).map(
          (item) => (item.id === id ? { ...item, read: true } : item),
        ),
      },
    }));
  };

  const markAllNotificationsRead = () => {
    if (!notificationAccountKey) {
      return;
    }

    setStore((current) => ({
      ...current,
      notificationsByAccount: {
        ...current.notificationsByAccount,
        [notificationAccountKey]: (current.notificationsByAccount[notificationAccountKey] ?? []).map(
          (item) => ({
            ...item,
            read: true,
          }),
        ),
      },
    }));
  };

  const dismissNotification = (id: string) => {
    if (!notificationAccountKey) {
      return;
    }

    setStore((current) => ({
      ...current,
      notificationsByAccount: {
        ...current.notificationsByAccount,
        [notificationAccountKey]: (current.notificationsByAccount[notificationAccountKey] ?? []).filter(
          (item) => item.id !== id,
        ),
      },
    }));
  };

  const createAppointmentRequest = (params: {
    date: string;
    doctorId: number;
    doctorEmail?: string;
    doctorName?: string;
    notes?: string;
    type?: string;
  }) => {
    if (!patientEmailKey || !currentPatientId) {
      return null;
    }

    const nextAppointment: Appointment = {
      id: createLocalAppointmentId(),
      patientId: currentPatientId,
      patientName: patientProfile.name,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      date: params.date,
      time: "Pending doctor confirmation",
      type: params.type ?? "Consultation",
      status: "pending",
      notes: params.notes?.trim() || undefined,
    };

    setStore((current) => {
      let nextNotifications = appendNotification(
        current.notificationsByAccount,
        createNotificationAccountKey("patient", patientEmailKey),
        {
          type: "info",
          title: "Appointment request sent",
          message: `Your ${(params.type ?? "appointment").toLowerCase()} request with ${params.doctorName ?? "the doctor"} for ${formatAppointmentDate(params.date)} has been sent. The doctor will review it and assign a time.`,
        },
      );

      if (params.doctorEmail) {
        nextNotifications = appendNotificationForRole(
          nextNotifications,
          "doctor",
          params.doctorEmail,
          {
            type: "info",
            title: "New appointment request",
            message: `${patientProfile.name} requested a ${(params.type ?? "Consultation").toLowerCase()} for ${formatAppointmentDate(params.date)}. Review it and assign a time from your doctor panel.`,
          },
        );
      }

      return {
        ...current,
        localAppointments: [nextAppointment, ...current.localAppointments],
        notificationsByAccount: nextNotifications,
      };
    });

    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    return nextAppointment;
  };

  const getAugmentedAppointments = (appointments: Appointment[]) =>
    [...store.localAppointments, ...appointments].map((appointment) => ({
      ...appointment,
      ...(store.appointmentOverrides[String(appointment.id)] ?? {}),
    }));

  const getPatientAppointments = (appointments: Appointment[]) => {
    const augmented = getAugmentedAppointments(appointments);

    if (currentPatientId) {
      return augmented.filter((appointment) => appointment.patientId === currentPatientId);
    }

    return augmented.filter(
      (appointment) =>
        appointment.patientName === patientProfile.name ||
        normalizeEmail(appointment.patientName ?? "") === normalizeEmail(patientProfile.name),
    );
  };

  const getDoctorAppointments = (appointments: Appointment[]) => {
    const augmented = getAugmentedAppointments(appointments);

    if (session?.role !== "doctor") {
      return augmented;
    }

    const normalizedDoctorName = normalizeName(session.fullName ?? "");

    return augmented.filter(
      (appointment) =>
        normalizedDoctorName &&
        normalizeName(appointment.doctorName ?? "") === normalizedDoctorName,
    );
  };

  const updateAppointmentStatus = (
    appointment: Appointment,
    status: Appointment["status"],
  ) => {
    const nextAppointment = {
      ...appointment,
      ...(store.appointmentOverrides[String(appointment.id)] ?? {}),
      status,
    };

    setStore((current) => {
      const patientKey =
        status === "cancelled" || status === "completed"
          ? resolvePatientEmailKey(current, appointment)
          : null;

      return {
        ...current,
        appointmentOverrides: {
          ...current.appointmentOverrides,
          [String(appointment.id)]: {
            ...(current.appointmentOverrides[String(appointment.id)] ?? {}),
            status,
          },
        },
        notificationsByAccount:
          patientKey && (status === "cancelled" || status === "completed")
            ? appendNotificationForRole(current.notificationsByAccount, "patient", patientKey, {
                type: status === "cancelled" ? "warning" : "success",
                title:
                  status === "cancelled"
                    ? "Appointment cancelled"
                    : "Appointment completed",
                message:
                  status === "cancelled"
                    ? `Your ${appointment.type?.toLowerCase() ?? "appointment"} with ${appointment.doctorName ?? "your doctor"} on ${formatAppointmentDate(nextAppointment.date)} was cancelled.`
                    : `Your ${appointment.type?.toLowerCase() ?? "appointment"} with ${appointment.doctorName ?? "your doctor"} was marked as completed.`,
              })
            : current.notificationsByAccount,
      };
    });

    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    return nextAppointment;
  };

  const approveAppointmentRequest = (
    appointment: Appointment,
    schedule: {
      date: string;
      time: string;
    },
  ) => {
    const nextAppointment = {
      ...appointment,
      ...(store.appointmentOverrides[String(appointment.id)] ?? {}),
      date: schedule.date,
      time: schedule.time,
      status: "scheduled" as const,
    };

    setStore((current) => {
      const patientKey = resolvePatientEmailKey(current, appointment);

      return {
        ...current,
        appointmentOverrides: {
          ...current.appointmentOverrides,
          [String(appointment.id)]: {
            ...(current.appointmentOverrides[String(appointment.id)] ?? {}),
            date: schedule.date,
            time: schedule.time,
            status: "scheduled",
          },
        },
        notificationsByAccount: patientKey
          ? appendNotificationForRole(current.notificationsByAccount, "patient", patientKey, {
              type: "success",
              title: "Appointment approved",
              message: `${appointment.doctorName ?? "Your doctor"} approved your request for ${formatAppointmentDate(schedule.date)} at ${schedule.time}.`,
            })
          : current.notificationsByAccount,
      };
    });

    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    return nextAppointment;
  };

  const rescheduleAppointment = (appointment: Appointment) => {
    const nextDate = shiftDate(
      store.appointmentOverrides[String(appointment.id)]?.date ?? appointment.date,
      7,
    );
    const nextAppointment = {
      ...appointment,
      ...(store.appointmentOverrides[String(appointment.id)] ?? {}),
      date: nextDate,
      time: "Pending doctor confirmation",
      status: "pending" as const,
    };

    setStore((current) => {
      const patientKey = resolvePatientEmailKey(current, appointment);

      return {
        ...current,
        appointmentOverrides: {
          ...current.appointmentOverrides,
          [String(appointment.id)]: {
            ...(current.appointmentOverrides[String(appointment.id)] ?? {}),
            date: nextDate,
            time: "Pending doctor confirmation",
            status: "pending",
          },
        },
        notificationsByAccount: patientKey
          ? appendNotificationForRole(current.notificationsByAccount, "patient", patientKey, {
              type: "warning",
              title: "Appointment needs a new time",
              message: `${appointment.doctorName ?? "Your doctor"} moved your appointment to ${formatAppointmentDate(nextDate)}. A new time will be assigned after review.`,
            })
          : current.notificationsByAccount,
      };
    });

    queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
    return nextAppointment;
  };

  const value = useMemo<PortalDataContextValue>(
    () => ({
      addAssessment,
      adminDeleteDoctorData,
      adminDeletePatientData,
      adminSyncDoctorData,
      adminUpsertPatientProfile,
      addNotification,
      addPatientDocument,
      approveAppointmentRequest,
      assessmentHistory,
      createAppointmentRequest,
      currentPatientId,
      currentPatientReady: session?.role !== "patient" || currentPatientId !== null,
      dismissNotification,
      findPatientProfile,
      getDocumentsForPatient,
      getAugmentedAppointments,
      getDoctorAppointments,
      getPatientAppointments,
      lastAssessment: assessmentHistory[0] ?? null,
      markAllNotificationsRead,
      markNotificationRead,
      notifications,
      patientProfile,
      rescheduleAppointment,
      updateAppointmentStatus,
      updatePatientProfile,
    }),
    [
      adminDeleteDoctorData,
      adminDeletePatientData,
      adminSyncDoctorData,
      adminUpsertPatientProfile,
      assessmentHistory,
      currentPatientId,
      notificationAccountKey,
      notifications,
      patientEmailKey,
      patientProfile,
      patientsData,
      store.appointmentOverrides,
      store.documents,
      store.localAppointments,
      store.notificationsByAccount,
      store.profilesByEmail,
      session?.email,
      session?.fullName,
      session?.role,
    ],
  );

  return (
    <PortalDataContext.Provider value={value}>
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const context = useContext(PortalDataContext);

  if (!context) {
    throw new Error("usePortalData must be used inside PortalDataProvider");
  }

  return context;
}
