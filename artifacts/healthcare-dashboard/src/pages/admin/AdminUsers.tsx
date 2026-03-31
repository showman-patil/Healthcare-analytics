import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  type Doctor,
  type Patient,
  useListDoctors,
  useListPatients,
} from "@workspace/api-client-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  createManagedUserKey,
  hideManagedUser,
  isManagedUserHidden,
  restoreManagedUser,
  USER_DIRECTORY_UPDATED_EVENT,
} from "@/lib/admin-user-overrides";
import {
  ACCOUNTS_UPDATED_EVENT,
  approveDoctorAccount,
  createManagedAccount,
  deleteManagedAccount,
  getInitials,
  getStoredAccounts,
  type DoctorApprovalStatus,
  type DoctorProfile,
  type StoredAccount,
  updateManagedAccount,
} from "@/lib/auth";
import { useDynamicDoctors } from "@/lib/doctor-directory";
import { MOCK_DOCTORS, MOCK_PATIENTS } from "@/lib/mock-data";
import { usePortalData } from "@/lib/portal-data-context";

type UserTab = "patients" | "doctors";
type ManagedUserType = "patient" | "doctor";

type ManagedPatientRow = {
  account: StoredAccount | null;
  age: number;
  avatar?: string;
  bloodType: string;
  condition: string;
  email: string;
  gender: string;
  hasAccount: boolean;
  id: string;
  kind: "patient";
  name: string;
  phone: string;
  riskLevel: string;
  status: string;
};

type ManagedDoctorRow = {
  account: StoredAccount | null;
  approvalStatus: DoctorApprovalStatus;
  email: string;
  hasAccount: boolean;
  id: string;
  kind: "doctor";
  name: string;
  patients: number;
  phone: string;
  specialty: string;
  status: string;
};

type ManagedUserRow = ManagedPatientRow | ManagedDoctorRow;

type UserEditorState = {
  mode: "add" | "edit";
  open: boolean;
  userType: ManagedUserType;
  user: ManagedUserRow | null;
};

type UserFormState = {
  age: string;
  bloodType: string;
  condition: string;
  doctorApprovalStatus: DoctorApprovalStatus;
  email: string;
  fullName: string;
  gender: string;
  highestQualification: string;
  hospitalAffiliation: string;
  medicalLicenseNumber: string;
  password: string;
  phone: string;
  specialty: string;
  userType: ManagedUserType;
  yearsOfExperience: string;
};

const TEMP_PASSWORD = "Welcome@123";
const genderOptions = ["Male", "Female", "Other"];
const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function createLookupKey(email?: string | null, name?: string | null) {
  return createManagedUserKey({ email, name });
}

function inferRiskLevel(condition: string) {
  const normalizedCondition = condition.trim().toLowerCase();

  if (!normalizedCondition || normalizedCondition === "none" || normalizedCondition === "none listed") {
    return "low";
  }

  if (normalizedCondition.includes("emergency") || normalizedCondition.includes("cardiac")) {
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

function defaultUserForm(userType: ManagedUserType): UserFormState {
  return {
    age: "45",
    bloodType: "A+",
    condition: "General care",
    doctorApprovalStatus: "approved",
    email: "",
    fullName: "",
    gender: "Male",
    highestQualification: "",
    hospitalAffiliation: "",
    medicalLicenseNumber: "",
    password: "",
    phone: "",
    specialty: "",
    userType,
    yearsOfExperience: "0",
  };
}

function buildFormFromUser(user: ManagedUserRow): UserFormState {
  if (user.kind === "patient") {
    return {
      ...defaultUserForm("patient"),
      age: String(user.age || 45),
      bloodType: user.bloodType || "A+",
      condition: user.condition || "General care",
      email: user.email,
      fullName: user.name,
      gender: user.gender || "Male",
      phone: user.phone || "",
    };
  }

  return {
    ...defaultUserForm("doctor"),
    doctorApprovalStatus: user.approvalStatus,
    email: user.email,
    fullName: user.name,
    highestQualification: user.account?.doctorProfile?.highestQualification ?? "",
    hospitalAffiliation: user.account?.doctorProfile?.hospitalAffiliation ?? "",
    medicalLicenseNumber: user.account?.doctorProfile?.medicalLicenseNumber ?? "",
    phone: user.phone || (user.account?.doctorProfile?.phoneNumber ?? ""),
    specialty: user.specialty || (user.account?.doctorProfile?.specialty ?? ""),
    yearsOfExperience: String(user.account?.doctorProfile?.yearsOfExperience ?? 0),
  };
}

function matchesPatientSearch(patient: ManagedPatientRow, searchQuery: string) {
  const normalizedQuery = normalizeName(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return [
    patient.name,
    patient.email,
    patient.phone,
    patient.condition,
    patient.gender,
    patient.bloodType,
  ].some((value) => normalizeName(value ?? "").includes(normalizedQuery));
}

function matchesDoctorSearch(doctor: ManagedDoctorRow, searchQuery: string) {
  const normalizedQuery = normalizeName(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return [doctor.name, doctor.email, doctor.phone, doctor.specialty].some((value) =>
    normalizeName(value ?? "").includes(normalizedQuery),
  );
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState<UserTab>("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [dataVersion, setDataVersion] = useState(0);
  const [expandedDoctorEmail, setExpandedDoctorEmail] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<UserEditorState>({
    mode: "add",
    open: false,
    userType: "patient",
    user: null,
  });
  const [formState, setFormState] = useState<UserFormState>(defaultUserForm("patient"));
  const [deleteTarget, setDeleteTarget] = useState<ManagedUserRow | null>(null);
  const container = useRef<HTMLDivElement>(null);

  const { data: apiPatients } = useListPatients();
  const { data: apiDoctors } = useListDoctors();
  const {
    adminDeleteDoctorData,
    adminDeletePatientData,
    adminSyncDoctorData,
    adminUpsertPatientProfile,
    findPatientProfile,
  } = usePortalData();

  const storedAccounts = useMemo(() => getStoredAccounts(), [dataVersion]);
  const patientAccounts = useMemo(
    () => storedAccounts.filter((account) => account.role === "patient"),
    [storedAccounts],
  );
  const doctorAccounts = useMemo(
    () => storedAccounts.filter((account) => account.role === "doctor"),
    [storedAccounts],
  );
  const doctorsDirectory = useDynamicDoctors(
    apiDoctors?.length ? [...apiDoctors, ...MOCK_DOCTORS] : MOCK_DOCTORS,
  );

  useEffect(() => {
    const refresh = () => {
      setDataVersion((current) => current + 1);
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

  useGSAP(() => {
    gsap.from(".list-item-anim", {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [activeTab, searchQuery, dataVersion]);

  const pendingDoctorAccounts = useMemo(
    () =>
      doctorAccounts.filter(
        (account) => account.doctorApprovalStatus === "pending",
      ),
    [doctorAccounts],
  );

  const patients = useMemo<ManagedPatientRow[]>(() => {
    const basePatients = apiPatients?.length ? apiPatients : MOCK_PATIENTS;
    const rows = new Map<string, ManagedPatientRow>();

    const upsertRow = (patient: ManagedPatientRow) => {
      if (isManagedUserHidden("patient", { email: patient.email, name: patient.name })) {
        return;
      }

      const key = createLookupKey(patient.email, patient.name);

      if (!key) {
        return;
      }

      const existing = rows.get(key);

      if (!existing) {
        rows.set(key, patient);
        return;
      }

      rows.set(key, {
        ...existing,
        ...patient,
        account: patient.account ?? existing.account,
        avatar: patient.avatar ?? existing.avatar,
        bloodType: patient.bloodType || existing.bloodType,
        condition: patient.condition || existing.condition,
        hasAccount: patient.hasAccount || existing.hasAccount,
        phone: patient.phone || existing.phone,
      });
    };

    basePatients.forEach((patient) => {
      const sharedProfile = findPatientProfile({
        email: patient.email,
        name: patient.name,
      });
      const linkedAccount =
        patientAccounts.find(
          (account) =>
            normalizeEmail(account.email) === normalizeEmail(patient.email ?? "") ||
            normalizeName(account.fullName) === normalizeName(patient.name),
        ) ?? null;

      upsertRow({
        account: linkedAccount,
        age: Number.parseInt(sharedProfile?.age ?? String(patient.age), 10) || patient.age,
        avatar: sharedProfile?.profileImage || undefined,
        bloodType: sharedProfile?.bloodType || patient.bloodType || "",
        condition: sharedProfile?.chronicConditions || patient.condition || "",
        email: sharedProfile?.email || linkedAccount?.email || patient.email || "",
        gender: sharedProfile?.gender || patient.gender || "Male",
        hasAccount: Boolean(linkedAccount),
        id: `patient-${patient.id}`,
        kind: "patient",
        name: sharedProfile?.name || linkedAccount?.fullName || patient.name,
        phone: sharedProfile?.phone || patient.phone || "",
        riskLevel: sharedProfile?.chronicConditions
          ? inferRiskLevel(sharedProfile.chronicConditions)
          : patient.riskLevel || "low",
        status: patient.status || "active",
      });
    });

    patientAccounts.forEach((account) => {
      const sharedProfile = findPatientProfile({
        email: account.email,
        name: account.fullName,
      });

      upsertRow({
        account,
        age: Number.parseInt(sharedProfile?.age ?? "45", 10) || 45,
        avatar: sharedProfile?.profileImage || undefined,
        bloodType: sharedProfile?.bloodType || "A+",
        condition: sharedProfile?.chronicConditions || "General care",
        email: sharedProfile?.email || account.email,
        gender: sharedProfile?.gender || "Male",
        hasAccount: true,
        id: `patient-account-${account.email}`,
        kind: "patient",
        name: sharedProfile?.name || account.fullName,
        phone: sharedProfile?.phone || "",
        riskLevel: inferRiskLevel(sharedProfile?.chronicConditions || ""),
        status: "active",
      });
    });

    return [...rows.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [apiPatients, findPatientProfile, patientAccounts, dataVersion]);

  const doctors = useMemo<ManagedDoctorRow[]>(() => {
    const rows = new Map<string, ManagedDoctorRow>();

    const upsertRow = (doctor: ManagedDoctorRow) => {
      if (isManagedUserHidden("doctor", { email: doctor.email, name: doctor.name })) {
        return;
      }

      const key = createLookupKey(doctor.email, doctor.name);

      if (!key) {
        return;
      }

      const existing = rows.get(key);

      if (!existing) {
        rows.set(key, doctor);
        return;
      }

      rows.set(key, {
        ...existing,
        ...doctor,
        account: doctor.account ?? existing.account,
        approvalStatus: doctor.approvalStatus ?? existing.approvalStatus,
        hasAccount: doctor.hasAccount || existing.hasAccount,
        patients: doctor.patients || existing.patients,
        phone: doctor.phone || existing.phone,
        specialty: doctor.specialty || existing.specialty,
        status: doctor.status || existing.status,
      });
    };

    doctorsDirectory.forEach((doctor) => {
      const linkedAccount =
        doctorAccounts.find(
          (account) =>
            normalizeEmail(account.email) === normalizeEmail(doctor.email ?? "") ||
            normalizeName(account.fullName) === normalizeName(doctor.name),
        ) ?? null;

      upsertRow({
        account: linkedAccount,
        approvalStatus: linkedAccount?.doctorApprovalStatus ?? "approved",
        email: linkedAccount?.email || doctor.email || "",
        hasAccount: Boolean(linkedAccount),
        id: `doctor-${doctor.id}`,
        kind: "doctor",
        name: linkedAccount?.fullName || doctor.name,
        patients: doctor.patients ?? 0,
        phone: linkedAccount?.doctorProfile?.phoneNumber || doctor.phone || "",
        specialty: linkedAccount?.doctorProfile?.specialty || doctor.specialty || "",
        status:
          linkedAccount?.doctorApprovalStatus === "pending"
            ? "pending-verification"
            : doctor.status || "active",
      });
    });

    doctorAccounts.forEach((account) => {
      upsertRow({
        account,
        approvalStatus: account.doctorApprovalStatus ?? "approved",
        email: account.email,
        hasAccount: true,
        id: `doctor-account-${account.email}`,
        kind: "doctor",
        name: account.fullName,
        patients: 0,
        phone: account.doctorProfile?.phoneNumber ?? "",
        specialty: account.doctorProfile?.specialty ?? "General Practice",
        status:
          account.doctorApprovalStatus === "pending"
            ? "pending-verification"
            : "active",
      });
    });

    return [...rows.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [doctorAccounts, doctorsDirectory, dataVersion]);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => matchesPatientSearch(patient, searchQuery)),
    [patients, searchQuery],
  );
  const filteredDoctors = useMemo(
    () => doctors.filter((doctor) => matchesDoctorSearch(doctor, searchQuery)),
    [doctors, searchQuery],
  );

  const handleApproveDoctor = (email: string) => {
    const result = approveDoctorAccount(email);

    if (!result.ok) {
      toast({
        title: "Approval failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    restoreManagedUser("doctor", { email });
    toast({
      title: "Doctor approved",
      description:
        "Doctor verification is complete. Portal access has now been activated.",
    });
  };

  const openAddDialog = () => {
    const nextUserType: ManagedUserType =
      activeTab === "doctors" ? "doctor" : "patient";

    setFormState(defaultUserForm(nextUserType));
    setEditorState({
      mode: "add",
      open: true,
      user: null,
      userType: nextUserType,
    });
  };

  const openEditDialog = (user: ManagedUserRow) => {
    setFormState(buildFormFromUser(user));
    setEditorState({
      mode: "edit",
      open: true,
      user,
      userType: user.kind,
    });
  };

  const handleCopyEmail = async (email: string) => {
    if (!email) {
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: "Email copied",
        description: `${email} is ready to paste.`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "We could not copy the email address right now.",
        variant: "destructive",
      });
    }
  };

  const closeEditor = (open: boolean) => {
    setEditorState((current) => ({ ...current, open }));

    if (!open) {
      setTimeout(() => {
        setEditorState((current) => ({ ...current, user: null }));
      }, 0);
    }
  };

  const handleSaveUser = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formState.fullName.trim();
    const normalizedEmail = normalizeEmail(formState.email);
    const nextPassword = formState.password.trim();
    const isEdit = editorState.mode === "edit" && editorState.user;
    const targetUser = editorState.user;
    const generatedPassword = !nextPassword && (!isEdit || !targetUser?.account) ? TEMP_PASSWORD : "";

    if (!trimmedName || !normalizedEmail) {
      toast({
        title: "Missing details",
        description: "Please provide both a name and an email address.",
        variant: "destructive",
      });
      return;
    }

    if (formState.userType === "patient") {
      const accountResult =
        isEdit && targetUser?.account
          ? updateManagedAccount({
              email: normalizedEmail,
              fullName: trimmedName,
              password: nextPassword || undefined,
              previousEmail: targetUser.account.email,
              role: "patient",
            })
          : createManagedAccount({
              email: normalizedEmail,
              fullName: trimmedName,
              password: nextPassword || generatedPassword,
              role: "patient",
            });

      if (!accountResult.ok) {
        toast({
          title: "Save failed",
          description: accountResult.error,
          variant: "destructive",
        });
        return;
      }

      adminUpsertPatientProfile({
        nextEmail: normalizedEmail,
        nextName: trimmedName,
        previousEmail: isEdit ? targetUser?.email : undefined,
        previousName: isEdit ? targetUser?.name : undefined,
        updates: {
          age: formState.age || "45",
          bloodType: formState.bloodType || "A+",
          chronicConditions: formState.condition || "General care",
          email: normalizedEmail,
          gender: formState.gender || "Male",
          name: trimmedName,
          phone: formState.phone,
        },
      });

      if (isEdit) {
        restoreManagedUser("patient", {
          email: targetUser?.email,
          name: targetUser?.name,
        });
      }

      restoreManagedUser("patient", {
        email: normalizedEmail,
        name: trimmedName,
      });

      toast({
        title: isEdit ? "Patient updated" : "Patient added",
        description:
          generatedPassword
            ? `Account connected with temporary password ${generatedPassword}.`
            : "Patient data is now connected in the admin portal.",
      });
    } else {
      const doctorProfile: DoctorProfile = {
        specialty: formState.specialty || "General Practice",
        medicalLicenseNumber: formState.medicalLicenseNumber,
        yearsOfExperience: Number.parseInt(formState.yearsOfExperience, 10) || 0,
        hospitalAffiliation: formState.hospitalAffiliation,
        phoneNumber: formState.phone,
        highestQualification: formState.highestQualification,
        profileImage: targetUser?.account?.doctorProfile?.profileImage ?? "",
      };

      const accountResult =
        isEdit && targetUser?.account
          ? updateManagedAccount({
              doctorApprovalStatus: formState.doctorApprovalStatus,
              doctorProfile,
              email: normalizedEmail,
              fullName: trimmedName,
              password: nextPassword || undefined,
              previousEmail: targetUser.account.email,
              role: "doctor",
            })
          : createManagedAccount({
              doctorApprovalStatus: formState.doctorApprovalStatus,
              doctorProfile,
              email: normalizedEmail,
              fullName: trimmedName,
              password: nextPassword || generatedPassword,
              role: "doctor",
            });

      if (!accountResult.ok) {
        toast({
          title: "Save failed",
          description: accountResult.error,
          variant: "destructive",
        });
        return;
      }

      adminSyncDoctorData({
        nextEmail: normalizedEmail,
        nextName: trimmedName,
        previousEmail: isEdit ? targetUser?.email : undefined,
        previousName: isEdit ? targetUser?.name : undefined,
      });

      if (isEdit) {
        restoreManagedUser("doctor", {
          email: targetUser?.email,
          name: targetUser?.name,
        });
      }

      restoreManagedUser("doctor", {
        email: normalizedEmail,
        name: trimmedName,
      });

      toast({
        title: isEdit ? "Doctor updated" : "Doctor added",
        description:
          generatedPassword
            ? `Account connected with temporary password ${generatedPassword}.`
            : "Doctor access is now connected in the admin portal.",
      });
    }

    closeEditor(false);
  };

  const handleDeleteUser = () => {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.kind === "patient") {
      if (deleteTarget.account) {
        const result = deleteManagedAccount("patient", deleteTarget.account.email);

        if (!result.ok) {
          toast({
            title: "Delete failed",
            description: result.error,
            variant: "destructive",
          });
          return;
        }
      }

      adminDeletePatientData({
        email: deleteTarget.email,
        name: deleteTarget.name,
      });
      hideManagedUser("patient", {
        email: deleteTarget.email,
        name: deleteTarget.name,
      });
    } else {
      if (deleteTarget.account) {
        const result = deleteManagedAccount("doctor", deleteTarget.account.email);

        if (!result.ok) {
          toast({
            title: "Delete failed",
            description: result.error,
            variant: "destructive",
          });
          return;
        }
      }

      adminDeleteDoctorData({
        email: deleteTarget.email,
        name: deleteTarget.name,
      });
      hideManagedUser("doctor", {
        email: deleteTarget.email,
        name: deleteTarget.name,
      });
    }

    toast({
      title: "User removed",
      description: `${deleteTarget.name} was removed from the admin user directory.`,
    });
    setDeleteTarget(null);
  };

  const visibleRows = activeTab === "patients" ? filteredPatients : filteredDoctors;
  const totalRows = activeTab === "patients" ? patients.length : doctors.length;

  return (
    <div ref={container} className="space-y-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            User Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage system access, registered doctors, and patient records from one connected admin view.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className="premium-button flex items-center gap-2"
        >
          <Plus size={18} />
          Add New User
        </button>
      </div>

      {activeTab === "doctors" && pendingDoctorAccounts.length > 0 ? (
        <div className="premium-card border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Doctor Verification Queue
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These doctor accounts are awaiting administrative approval before portal access can be activated.
              </p>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              {pendingDoctorAccounts.length} Pending
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {pendingDoctorAccounts.map((doctor) => (
              <div
                key={doctor.email}
                className="rounded-2xl border border-amber-200 bg-white p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{doctor.fullName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doctor.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {doctor.doctorProfile?.specialty ?? "Specialty pending"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        License: {doctor.doctorProfile?.medicalLicenseNumber ?? "N/A"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {doctor.doctorProfile?.yearsOfExperience ?? 0} yrs exp
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDoctorEmail((current) =>
                          current === doctor.email ? null : doctor.email,
                        )
                      }
                      className="premium-button-outline flex items-center justify-center gap-2"
                    >
                      {expandedDoctorEmail === doctor.email ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                      {expandedDoctorEmail === doctor.email
                        ? "Hide Details"
                        : "Review Details"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoctor(doctor.email)}
                      className="premium-button flex items-center gap-2"
                    >
                      <ShieldCheck size={16} />
                      Approve Doctor
                    </button>
                  </div>
                </div>

                {expandedDoctorEmail === doctor.email ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
                        Doctor Verification Details
                      </h3>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Pending Review
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <DetailItem label="Full Name" value={doctor.fullName} />
                      <DetailItem label="Email" value={doctor.email} />
                      <DetailItem
                        label="Phone Number"
                        value={doctor.doctorProfile?.phoneNumber ?? "Not provided"}
                      />
                      <DetailItem
                        label="Specialty"
                        value={doctor.doctorProfile?.specialty ?? "Not provided"}
                      />
                      <DetailItem
                        label="Medical License"
                        value={doctor.doctorProfile?.medicalLicenseNumber ?? "Not provided"}
                      />
                      <DetailItem
                        label="Experience"
                        value={`${doctor.doctorProfile?.yearsOfExperience ?? 0} years`}
                      />
                      <DetailItem
                        label="Hospital / Clinic"
                        value={doctor.doctorProfile?.hospitalAffiliation ?? "Not provided"}
                      />
                      <DetailItem
                        label="Highest Qualification"
                        value={doctor.doctorProfile?.highestQualification ?? "Not provided"}
                      />
                      <DetailItem
                        label="Requested On"
                        value={new Date(doctor.createdAt).toLocaleString()}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="premium-card overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-gray-50/50 p-4 sm:flex-row">
          <div className="flex w-full rounded-lg bg-muted p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className={`flex-1 rounded-md px-6 py-2 text-sm font-medium transition-all sm:flex-none ${
                activeTab === "patients"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Patients
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("doctors")}
              className={`flex-1 rounded-md px-6 py-2 text-sm font-medium transition-all sm:flex-none ${
                activeTab === "doctors"
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Doctors
            </button>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="rounded-lg border border-border bg-white p-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!searchQuery}
              title="Clear search"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:hidden">
          {activeTab === "patients"
            ? filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="list-item-anim rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <PatientAvatar name={patient.name} avatar={patient.avatar} />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground">{patient.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Age: {patient.age} | {patient.gender}
                        </p>
                      </div>
                    </div>
                    <RiskBadge level={patient.riskLevel} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-foreground">{patient.email}</p>
                    <p className="text-muted-foreground">{patient.phone || "No phone added"}</p>
                    <p className="text-muted-foreground">
                      Condition: {patient.condition || "None"}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <StatusPill status={patient.status} />
                    <UserActionMenu
                      inline
                      user={patient}
                      onApproveDoctor={undefined}
                      onCopyEmail={() => handleCopyEmail(patient.email)}
                      onDelete={() => setDeleteTarget(patient)}
                      onEdit={() => openEditDialog(patient)}
                    />
                  </div>
                </div>
              ))
            : filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="list-item-anim rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{doctor.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {doctor.specialty}
                      </p>
                    </div>
                    <StatusPill status={doctor.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-foreground">{doctor.email}</p>
                    <p className="text-muted-foreground">{doctor.phone || "No phone added"}</p>
                    <p className="text-muted-foreground">
                      {doctor.patients} assigned patients
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-end">
                    <UserActionMenu
                      inline
                      user={doctor}
                      onApproveDoctor={
                        doctor.approvalStatus === "pending"
                          ? () => handleApproveDoctor(doctor.email)
                          : undefined
                      }
                      onCopyEmail={() => handleCopyEmail(doctor.email)}
                      onDelete={() => setDeleteTarget(doctor)}
                      onEdit={() => openEditDialog(doctor)}
                    />
                  </div>
                </div>
              ))}
          {visibleRows.length === 0 ? (
            <EmptyState label={`No ${activeTab} match the current search.`} />
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-gray-50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                {activeTab === "patients" ? (
                  <>
                    <th className="px-6 py-4 font-semibold">Condition</th>
                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-semibold">Specialty</th>
                    <th className="px-6 py-4 font-semibold">Patients</th>
                  </>
                )}
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === "patients"
                ? filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="group list-item-anim transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <PatientAvatar name={patient.name} avatar={patient.avatar} />
                          <div>
                            <div className="font-bold text-foreground">
                              {patient.name}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              Age: {patient.age} | {patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{patient.email}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {patient.phone || "No phone added"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {patient.condition || "None"}
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={patient.riskLevel} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={patient.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <UserActionMenu
                          user={patient}
                          onApproveDoctor={undefined}
                          onCopyEmail={() => handleCopyEmail(patient.email)}
                          onDelete={() => setDeleteTarget(patient)}
                          onEdit={() => openEditDialog(patient)}
                        />
                      </td>
                    </tr>
                  ))
                : filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="group list-item-anim transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{doctor.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{doctor.email}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {doctor.phone || "No phone added"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {doctor.specialty || "General Practice"}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {doctor.patients} Assigned
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={doctor.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <UserActionMenu
                          user={doctor}
                          onApproveDoctor={
                            doctor.approvalStatus === "pending"
                              ? () => handleApproveDoctor(doctor.email)
                              : undefined
                          }
                          onCopyEmail={() => handleCopyEmail(doctor.email)}
                          onDelete={() => setDeleteTarget(doctor)}
                          onEdit={() => openEditDialog(doctor)}
                        />
                      </td>
                    </tr>
                  ))}
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No {activeTab} match the current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {visibleRows.length} of {totalRows} {activeTab}
          </span>
          <span className="text-sm text-muted-foreground">
            Connected admin actions now support add, edit, approval, and removal.
          </span>
        </div>
      </div>

      <Dialog open={editorState.open} onOpenChange={closeEditor}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editorState.mode === "add" ? "Add User" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {editorState.mode === "add"
                ? "Create a connected patient or doctor account from the admin panel."
                : "Update user details and keep the connected account data in sync."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSaveUser}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User Type</label>
                <select
                  value={formState.userType}
                  onChange={(event) => {
                    const nextUserType = event.target.value as ManagedUserType;
                    setFormState((current) => ({
                      ...defaultUserForm(nextUserType),
                      email: current.email,
                      fullName: current.fullName,
                      password: current.password,
                      phone: current.phone,
                    }));
                    setEditorState((current) => ({
                      ...current,
                      userType: nextUserType,
                    }));
                  }}
                  disabled={editorState.mode === "edit"}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  placeholder="Enter full name"
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="user@medixai.com"
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder={
                    editorState.mode === "edit"
                      ? "Leave blank to keep current"
                      : "Leave blank to use temporary password"
                  }
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="Phone number"
                  className="h-11 rounded-xl"
                />
              </div>

              {formState.userType === "patient" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Age</label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.age}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          age: event.target.value,
                        }))
                      }
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <select
                      value={formState.gender}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          gender: event.target.value,
                        }))
                      }
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Blood Type</label>
                    <select
                      value={formState.bloodType}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          bloodType: event.target.value,
                        }))
                      }
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {bloodTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Condition / Notes</label>
                    <Textarea
                      value={formState.condition}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          condition: event.target.value,
                        }))
                      }
                      placeholder="Condition summary or care note"
                      className="min-h-[96px] rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Specialty</label>
                    <Input
                      value={formState.specialty}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          specialty: event.target.value,
                        }))
                      }
                      placeholder="Cardiology"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Experience</label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.yearsOfExperience}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          yearsOfExperience: event.target.value,
                        }))
                      }
                      placeholder="Years"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Medical License</label>
                    <Input
                      value={formState.medicalLicenseNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          medicalLicenseNumber: event.target.value,
                        }))
                      }
                      placeholder="License number"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Approval Status</label>
                    <select
                      value={formState.doctorApprovalStatus}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          doctorApprovalStatus: event.target.value as DoctorApprovalStatus,
                        }))
                      }
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Hospital / Clinic</label>
                    <Input
                      value={formState.hospitalAffiliation}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          hospitalAffiliation: event.target.value,
                        }))
                      }
                      placeholder="Hospital affiliation"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">Highest Qualification</label>
                    <Input
                      value={formState.highestQualification}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          highestQualification: event.target.value,
                        }))
                      }
                      placeholder="MD, Cardiology"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => closeEditor(false)}
                className="premium-button-outline"
              >
                Cancel
              </button>
              <button type="submit" className="premium-button">
                {editorState.mode === "add" ? "Create User" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove ${deleteTarget.name} from the admin user directory and clear connected local profile data.`
                : "This will remove the selected user."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function PatientAvatar({ avatar, name }: { avatar?: string; name: string }) {
  return (
    <Avatar className="h-11 w-11 border border-border/60">
      {avatar ? (
        <AvatarImage src={avatar} alt={`${name} profile`} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalizedStatus = status.replace("-", " ");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
        status === "active"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "critical"
            ? "border-red-200 bg-red-50 text-red-700"
            : status === "pending-verification"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-gray-200 bg-gray-100 text-gray-700"
      }`}
    >
      {normalizedStatus}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "border-emerald-200 bg-emerald-100 text-emerald-800",
    medium: "border-yellow-200 bg-yellow-100 text-yellow-800",
    high: "border-orange-200 bg-orange-100 text-orange-800",
    critical: "border-red-200 bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
        colors[level] || colors.low
      }`}
    >
      {level}
    </span>
  );
}

function UserActionMenu({
  inline = false,
  onApproveDoctor,
  onCopyEmail,
  onDelete,
  onEdit,
  user,
}: {
  inline?: boolean;
  onApproveDoctor?: (() => void) | undefined;
  onCopyEmail: () => void;
  onDelete: () => void;
  onEdit: () => void;
  user: ManagedUserRow;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-2 transition-opacity ${
        inline ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        title="Edit"
      >
        <Edit2 size={16} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            title="More actions"
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem onSelect={onEdit}>
            <Edit2 size={14} />
            Edit user
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCopyEmail}>
            <Copy size={14} />
            Copy email
          </DropdownMenuItem>
          {user.kind === "doctor" && onApproveDoctor ? (
            <DropdownMenuItem onSelect={onApproveDoctor}>
              <ShieldCheck size={14} />
              Approve doctor
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
