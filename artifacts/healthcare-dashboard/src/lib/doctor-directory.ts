import { useEffect, useMemo, useState } from "react";
import type { Doctor } from "@workspace/api-client-react";

import {
  ACCOUNTS_UPDATED_EVENT,
  getApprovedDoctorAccounts,
} from "@/lib/auth";
import {
  isManagedUserHidden,
  USER_DIRECTORY_UPDATED_EVENT,
} from "@/lib/admin-user-overrides";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function createDoctorId(email: string) {
  let hash = 0;

  for (const character of email) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return Math.abs(hash) + 10000;
}

export function buildDoctorDirectory(baseDoctors: Doctor[]) {
  const approvedAccounts = getApprovedDoctorAccounts();
  const uniqueBaseDoctors = baseDoctors.reduce<Doctor[]>((collection, doctor) => {
    const normalizedDoctorEmail = doctor.email ? normalizeEmail(doctor.email) : "";
    const normalizedDoctorName = normalizeName(doctor.name);
    const existingIndex = collection.findIndex((existingDoctor) => {
      const existingEmail = existingDoctor.email
        ? normalizeEmail(existingDoctor.email)
        : "";

      return (
        (normalizedDoctorEmail && existingEmail === normalizedDoctorEmail) ||
        normalizeName(existingDoctor.name) === normalizedDoctorName
      );
    });

    if (existingIndex === -1) {
      collection.push(doctor);
      return collection;
    }

    const existingDoctor = collection[existingIndex];
    collection[existingIndex] = {
      ...doctor,
      ...existingDoctor,
      avatar: existingDoctor.avatar ?? doctor.avatar,
      email: existingDoctor.email ?? doctor.email,
      name: existingDoctor.name || doctor.name,
      patients: existingDoctor.patients ?? doctor.patients,
      phone: existingDoctor.phone ?? doctor.phone,
      rating: existingDoctor.rating ?? doctor.rating,
      specialty: existingDoctor.specialty || doctor.specialty,
      status: existingDoctor.status || doctor.status,
    };

    return collection;
  }, []);

  const approvedByEmail = new Map(
    approvedAccounts.map((account) => [normalizeEmail(account.email), account]),
  );

  const mergedBaseDoctors = uniqueBaseDoctors.map((doctor) => {
    const approvedAccount = doctor.email
      ? approvedByEmail.get(normalizeEmail(doctor.email))
      : undefined;

    if (!approvedAccount) {
      return doctor;
    }

    return {
      ...doctor,
      email: doctor.email ?? approvedAccount.email,
      name: approvedAccount.fullName || doctor.name,
      phone: doctor.phone ?? approvedAccount.doctorProfile?.phoneNumber,
      specialty: approvedAccount.doctorProfile?.specialty ?? doctor.specialty,
      status: doctor.status === "inactive" ? "active" : doctor.status,
    };
  });

  const extraApprovedDoctors: Doctor[] = approvedAccounts
    .filter(
      (account) =>
        !mergedBaseDoctors.some(
          (doctor) =>
            (doctor.email &&
              normalizeEmail(doctor.email) === normalizeEmail(account.email)) ||
            normalizeName(doctor.name) === normalizeName(account.fullName),
        ),
    )
    .map((account) => ({
      id: createDoctorId(account.email),
      name: account.fullName,
      specialty: account.doctorProfile?.specialty ?? "General Practice",
      email: account.email,
      phone: account.doctorProfile?.phoneNumber,
      patients: 0,
      rating: 4.8,
      status: "active" as const,
    }));

  return [...mergedBaseDoctors, ...extraApprovedDoctors]
    .filter(
      (doctor) => !isManagedUserHidden("doctor", { email: doctor.email, name: doctor.name }),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function useDynamicDoctors(baseDoctors: Doctor[]) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setVersion((current) => current + 1);
    };

    window.addEventListener("storage", refresh);
    window.addEventListener(ACCOUNTS_UPDATED_EVENT, refresh);
    window.addEventListener(USER_DIRECTORY_UPDATED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ACCOUNTS_UPDATED_EVENT, refresh);
      window.removeEventListener(USER_DIRECTORY_UPDATED_EVENT, refresh);
    };
  }, []);

  return useMemo(
    () => buildDoctorDirectory(baseDoctors),
    [baseDoctors, version],
  );
}
