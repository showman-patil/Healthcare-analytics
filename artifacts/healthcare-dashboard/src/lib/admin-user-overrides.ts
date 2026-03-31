type ManagedUserRole = "doctor" | "patient";

type AdminUserOverrideStore = {
  hiddenDoctors: string[];
  hiddenPatients: string[];
};

const STORAGE_KEY = "medixai.admin-user-overrides.v1";
export const USER_DIRECTORY_UPDATED_EVENT = "medixai:user-directory-updated";

const emptyStore: AdminUserOverrideStore = {
  hiddenDoctors: [],
  hiddenPatients: [],
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createManagedUserKey(match: {
  email?: string | null;
  name?: string | null;
}) {
  const normalizedEmail = match.email ? normalizeEmail(match.email) : "";

  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }

  const normalizedName = match.name ? normalizeName(match.name) : "";
  return normalizedName ? `name:${normalizedName}` : "";
}

function readStore() {
  if (!canUseStorage()) {
    return emptyStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ({ ...emptyStore, ...JSON.parse(raw) } as AdminUserOverrideStore) : emptyStore;
  } catch {
    return emptyStore;
  }
}

function writeStore(store: AdminUserOverrideStore) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(USER_DIRECTORY_UPDATED_EVENT));
}

export function getHiddenUserKeys(role: ManagedUserRole) {
  const store = readStore();
  return role === "doctor" ? store.hiddenDoctors : store.hiddenPatients;
}

export function isManagedUserHidden(
  role: ManagedUserRole,
  match: {
    email?: string | null;
    name?: string | null;
  },
) {
  const key = createManagedUserKey(match);

  if (!key) {
    return false;
  }

  return getHiddenUserKeys(role).includes(key);
}

export function hideManagedUser(
  role: ManagedUserRole,
  match: {
    email?: string | null;
    name?: string | null;
  },
) {
  const key = createManagedUserKey(match);

  if (!key) {
    return;
  }

  const store = readStore();
  const field = role === "doctor" ? "hiddenDoctors" : "hiddenPatients";

  if (store[field].includes(key)) {
    return;
  }

  writeStore({
    ...store,
    [field]: [...store[field], key],
  });
}

export function restoreManagedUser(
  role: ManagedUserRole,
  match: {
    email?: string | null;
    name?: string | null;
  },
) {
  const key = createManagedUserKey(match);

  if (!key) {
    return;
  }

  const store = readStore();
  const field = role === "doctor" ? "hiddenDoctors" : "hiddenPatients";
  const nextValues = store[field].filter((value) => value !== key);

  if (nextValues.length === store[field].length) {
    return;
  }

  writeStore({
    ...store,
    [field]: nextValues,
  });
}
