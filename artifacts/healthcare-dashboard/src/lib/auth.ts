export type UserRole = "admin" | "doctor" | "patient";
export type DoctorApprovalStatus = "pending" | "approved";

export interface DoctorProfile {
  specialty: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  hospitalAffiliation: string;
  phoneNumber: string;
  highestQualification: string;
  profileImage?: string;
}

export interface AuthSession {
  role: UserRole;
  fullName: string;
  email: string;
}

export interface StoredAccount extends AuthSession {
  password: string;
  createdAt: string;
  doctorApprovalStatus?: DoctorApprovalStatus;
  doctorProfile?: DoctorProfile;
  approvedAt?: string;
}

type ManagedAccountRole = Exclude<UserRole, "admin">;

const ACCOUNTS_STORAGE_KEY = "medixai.accounts.v1";
const SESSION_STORAGE_KEY = "medixai.session.v1";
export const ACCOUNTS_UPDATED_EVENT = "medixai:accounts-updated";
const SUPERUSER_ACCOUNT: StoredAccount = {
  role: "admin",
  fullName: "Rahul",
  email: "rahul",
  password: "rahul10",
  createdAt: new Date("2026-01-10").toISOString(),
};

const seededAccounts: StoredAccount[] = [
  SUPERUSER_ACCOUNT,
  {
    role: "doctor",
    fullName: "Dr. Marcus Reed",
    email: "doctor@medixai.com",
    password: "Doctor@123",
    createdAt: new Date("2026-01-11").toISOString(),
    doctorApprovalStatus: "approved",
    approvedAt: new Date("2026-01-11").toISOString(),
    doctorProfile: {
      specialty: "Cardiology",
      medicalLicenseNumber: "MED-2048-7781",
      yearsOfExperience: 9,
      hospitalAffiliation: "MedixAI Central Hospital",
      phoneNumber: "+1 202 555 0147",
      highestQualification: "MD, Cardiology",
    },
  },
  {
    role: "patient",
    fullName: "Noah Bennett",
    email: "patient@medixai.com",
    password: "Patient@123",
    createdAt: new Date("2026-01-12").toISOString(),
  },
];

const rolePaths: Record<UserRole, { auth: string; dashboard: string }> = {
  admin: { auth: "/admin/auth", dashboard: "/admin/dashboard" },
  doctor: { auth: "/doctor/auth", dashboard: "/doctor/dashboard" },
  patient: { auth: "/patient/auth", dashboard: "/patient/dashboard" },
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));

  if (key === ACCOUNTS_STORAGE_KEY) {
    window.dispatchEvent(new Event(ACCOUNTS_UPDATED_EVENT));
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeAccounts(accounts: StoredAccount[]) {
  const nonAdminAccounts = accounts.filter((account) => account.role !== "admin");
  return [SUPERUSER_ACCOUNT, ...nonAdminAccounts];
}

function writeSession(session: AuthSession | null) {
  if (!canUseStorage()) {
    return;
  }

  if (session) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getRoleAuthPath(role: UserRole) {
  return rolePaths[role].auth;
}

export function getRoleDashboardPath(role: UserRole) {
  return rolePaths[role].dashboard;
}

export function initializeAuthStore() {
  if (!canUseStorage()) {
    return;
  }

  const accounts = readJson<StoredAccount[]>(ACCOUNTS_STORAGE_KEY, []);

  if (accounts.length === 0) {
    writeJson(ACCOUNTS_STORAGE_KEY, seededAccounts);
  } else {
    const normalizedAccounts = normalizeAccounts(accounts);
    const accountsChanged =
      normalizedAccounts.length !== accounts.length ||
      normalizedAccounts.some((account, index) => {
        const currentAccount = accounts[index];
        return (
          !currentAccount ||
          currentAccount.role !== account.role ||
          normalizeEmail(currentAccount.email) !== normalizeEmail(account.email) ||
          currentAccount.password !== account.password ||
          currentAccount.fullName !== account.fullName
        );
      });

    if (accountsChanged) {
      writeJson(ACCOUNTS_STORAGE_KEY, normalizedAccounts);
    }
  }

  const session = readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);

  if (!session) {
    return;
  }

  const allAccounts = readJson<StoredAccount[]>(ACCOUNTS_STORAGE_KEY, seededAccounts);
  const matchingAccount = allAccounts.find(
    (account) =>
      account.role === session.role &&
      normalizeEmail(account.email) === normalizeEmail(session.email),
  );

  if (!matchingAccount) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getStoredAccounts() {
  initializeAuthStore();
  return normalizeAccounts(readJson<StoredAccount[]>(ACCOUNTS_STORAGE_KEY, seededAccounts));
}

export function getStoredSession() {
  initializeAuthStore();
  return readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);
}

export function signInWithRole(role: UserRole, email: string, password: string) {
  const account = getStoredAccounts().find(
    (candidate) =>
      candidate.role === role &&
      normalizeEmail(candidate.email) === normalizeEmail(email),
  );

  if (!account || account.password !== password) {
    return {
      ok: false as const,
      error: "The email address or password is incorrect. You may also continue with the demo access option.",
    };
  }

  if (role === "doctor" && account.doctorApprovalStatus !== "approved") {
    return {
      ok: false as const,
      error: "Your doctor account is currently under administrative review. Portal access will be enabled once approval is complete.",
    };
  }

  const session: AuthSession = {
    role: account.role,
    fullName: account.fullName,
    email: account.email,
  };

  writeJson(SESSION_STORAGE_KEY, session);

  return {
    ok: true as const,
    session,
  };
}

export function signUpWithRole(
  role: UserRole,
  fullName: string,
  email: string,
  password: string,
  doctorProfile?: DoctorProfile,
) {
  if (role === "admin") {
    return {
      ok: false as const,
      error: "Admin signup is disabled. Use the fixed superuser credentials to continue.",
    };
  }

  const normalizedEmail = normalizeEmail(email);
  const accounts = getStoredAccounts();

  const existingAccount = accounts.find(
    (account) =>
      account.role === role && normalizeEmail(account.email) === normalizedEmail,
  );

  if (existingAccount) {
    return {
      ok: false as const,
      error: "An account with this email address is already registered for the selected role. Please sign in to continue.",
    };
  }

  const newAccount: StoredAccount = {
    role,
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
    doctorApprovalStatus: role === "doctor" ? "pending" : undefined,
    approvedAt: role === "doctor" ? undefined : new Date().toISOString(),
    doctorProfile: role === "doctor" ? doctorProfile : undefined,
  };

  writeJson(ACCOUNTS_STORAGE_KEY, [...accounts, newAccount]);

  if (role === "doctor") {
    return {
      ok: true as const,
      requiresApproval: true as const,
      message:
        "Your doctor account request has been submitted successfully. An administrator must approve it before portal access is granted.",
    };
  }

  const session: AuthSession = {
    role,
    fullName: newAccount.fullName,
    email: newAccount.email,
  };

  writeJson(SESSION_STORAGE_KEY, session);

  return {
    ok: true as const,
    requiresApproval: false as const,
    session,
  };
}

export function signOutStoredSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getPendingDoctorAccounts() {
  return getStoredAccounts().filter(
    (account) =>
      account.role === "doctor" && account.doctorApprovalStatus === "pending",
  );
}

export function getApprovedDoctorAccounts() {
  return getStoredAccounts().filter(
    (account) =>
      account.role === "doctor" && account.doctorApprovalStatus === "approved",
  );
}

export function approveDoctorAccount(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const accounts = getStoredAccounts();
  const account = accounts.find(
    (item) => item.role === "doctor" && normalizeEmail(item.email) === normalizedEmail,
  );

  if (!account) {
    return {
      ok: false as const,
      error: "Doctor account not found.",
    };
  }

  account.doctorApprovalStatus = "approved";
  account.approvedAt = new Date().toISOString();

  writeJson(ACCOUNTS_STORAGE_KEY, [...accounts]);

  return {
    ok: true as const,
  };
}

export function createManagedAccount(params: {
  doctorApprovalStatus?: DoctorApprovalStatus;
  doctorProfile?: DoctorProfile;
  email: string;
  fullName: string;
  password: string;
  role: ManagedAccountRole;
}) {
  const normalizedEmail = normalizeEmail(params.email);
  const trimmedName = params.fullName.trim();
  const password = params.password.trim();
  const accounts = getStoredAccounts();

  if (!trimmedName) {
    return {
      ok: false as const,
      error: "Full name is required.",
    };
  }

  if (!normalizedEmail) {
    return {
      ok: false as const,
      error: "Email address is required.",
    };
  }

  if (password.length < 8) {
    return {
      ok: false as const,
      error: "Password must be at least 8 characters long.",
    };
  }

  const existingAccount = accounts.find(
    (account) =>
      account.role === params.role && normalizeEmail(account.email) === normalizedEmail,
  );

  if (existingAccount) {
    return {
      ok: false as const,
      error: "A user with this email already exists for the selected role.",
    };
  }

  const nextApprovalStatus =
    params.role === "doctor" ? params.doctorApprovalStatus ?? "approved" : undefined;
  const timestamp = new Date().toISOString();
  const nextAccount: StoredAccount = {
    role: params.role,
    fullName: trimmedName,
    email: normalizedEmail,
    password,
    createdAt: timestamp,
    doctorApprovalStatus: nextApprovalStatus,
    approvedAt:
      params.role === "doctor" && nextApprovalStatus === "approved" ? timestamp : undefined,
    doctorProfile: params.role === "doctor" ? params.doctorProfile : undefined,
  };

  writeJson(ACCOUNTS_STORAGE_KEY, [...accounts, nextAccount]);

  return {
    ok: true as const,
    account: nextAccount,
  };
}

export function updateManagedAccount(params: {
  doctorApprovalStatus?: DoctorApprovalStatus;
  doctorProfile?: DoctorProfile;
  email: string;
  fullName: string;
  password?: string;
  previousEmail: string;
  role: ManagedAccountRole;
}) {
  const normalizedPreviousEmail = normalizeEmail(params.previousEmail);
  const normalizedNextEmail = normalizeEmail(params.email);
  const trimmedName = params.fullName.trim();
  const nextPassword = params.password?.trim();
  const accounts = getStoredAccounts();
  const account = accounts.find(
    (item) =>
      item.role === params.role &&
      normalizeEmail(item.email) === normalizedPreviousEmail,
  );

  if (!account) {
    return {
      ok: false as const,
      error: "User account not found.",
    };
  }

  if (!trimmedName) {
    return {
      ok: false as const,
      error: "Full name is required.",
    };
  }

  if (!normalizedNextEmail) {
    return {
      ok: false as const,
      error: "Email address is required.",
    };
  }

  if (nextPassword && nextPassword.length < 8) {
    return {
      ok: false as const,
      error: "Password must be at least 8 characters long.",
    };
  }

  const duplicateAccount = accounts.find(
    (item) =>
      item !== account &&
      item.role === params.role &&
      normalizeEmail(item.email) === normalizedNextEmail,
  );

  if (duplicateAccount) {
    return {
      ok: false as const,
      error: "A user with this email already exists for the selected role.",
    };
  }

  const previousAccount: StoredAccount = { ...account };
  account.fullName = trimmedName;
  account.email = normalizedNextEmail;

  if (nextPassword) {
    account.password = nextPassword;
  }

  if (params.role === "doctor") {
    const nextApprovalStatus = params.doctorApprovalStatus ?? account.doctorApprovalStatus ?? "approved";
    account.doctorApprovalStatus = nextApprovalStatus;
    account.doctorProfile = params.doctorProfile ?? account.doctorProfile;
    account.approvedAt =
      nextApprovalStatus === "approved"
        ? account.approvedAt ?? new Date().toISOString()
        : undefined;
  }

  const storedSession = getStoredSession();

  if (
    storedSession &&
    storedSession.role === previousAccount.role &&
    normalizeEmail(storedSession.email) === normalizeEmail(previousAccount.email)
  ) {
    writeSession({
      role: account.role,
      fullName: account.fullName,
      email: account.email,
    });
  }

  writeJson(ACCOUNTS_STORAGE_KEY, [...accounts]);

  return {
    ok: true as const,
    account: { ...account },
    previousAccount,
  };
}

export function deleteManagedAccount(role: ManagedAccountRole, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const accounts = getStoredAccounts();
  const account = accounts.find(
    (item) => item.role === role && normalizeEmail(item.email) === normalizedEmail,
  );

  if (!account) {
    return {
      ok: false as const,
      error: "User account not found.",
    };
  }

  const storedSession = getStoredSession();

  if (
    storedSession &&
    storedSession.role === account.role &&
    normalizeEmail(storedSession.email) === normalizeEmail(account.email)
  ) {
    writeSession(null);
  }

  writeJson(
    ACCOUNTS_STORAGE_KEY,
    accounts.filter((item) => item !== account),
  );

  return {
    ok: true as const,
    account,
  };
}
