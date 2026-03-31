import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthSession, DoctorProfile, UserRole } from "./auth";
import {
  ACCOUNTS_UPDATED_EVENT,
  getStoredSession,
  initializeAuthStore,
  signInWithRole,
  signOutStoredSession,
  signUpWithRole,
} from "./auth";

interface AuthContextValue {
  isReady: boolean;
  session: AuthSession | null;
  signIn: (role: UserRole, email: string, password: string) => ReturnType<typeof signInWithRole>;
  signUp: (
    role: UserRole,
    fullName: string,
    email: string,
    password: string,
    doctorProfile?: DoctorProfile,
  ) => ReturnType<typeof signUpWithRole>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    initializeAuthStore();
    setSession(getStoredSession());
    setIsReady(true);

    const syncSession = () => {
      setSession(getStoredSession());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener(ACCOUNTS_UPDATED_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(ACCOUNTS_UPDATED_EVENT, syncSession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      signIn(role, email, password) {
        const result = signInWithRole(role, email, password);
        if (result.ok) {
          setSession(result.session);
        }
        return result;
      },
      signUp(role, fullName, email, password, doctorProfile) {
        const result = signUpWithRole(role, fullName, email, password, doctorProfile);
        if (result.ok && "session" in result && result.session) {
          setSession(result.session);
        }
        return result;
      },
      signOut() {
        signOutStoredSession();
        setSession(null);
      },
    }),
    [isReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
