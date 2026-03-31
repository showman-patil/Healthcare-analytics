import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  HeartPulse,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  UserRoundPlus,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getRoleDashboardPath, type DoctorProfile, type UserRole } from "@/lib/auth";

interface RoleAuthPageProps {
  role: UserRole;
}

const roleContent: Record<
  UserRole,
  {
    label: string;
    accent: string;
    title: string;
    description: string;
    credentials: { email: string; password: string; name: string };
  }
> = {
  admin: {
    label: "Administrator Access",
    accent: "from-indigo-600 via-primary to-sky-500",
    title: "Secure access to the MedixAI admin workspace",
    description: "Manage users, operations, and analytics from a clean, protected control panel.",
    credentials: {
      email: "rahul",
      password: "rahul10",
      name: "Rahul",
    },
  },
  doctor: {
    label: "Doctor Workspace",
    accent: "from-emerald-500 via-teal-500 to-sky-500",
    title: "Secure access to the MedixAI clinical workspace",
    description: "Review patients, records, and diagnostic tools inside a focused professional portal.",
    credentials: {
      email: "doctor@medixai.com",
      password: "Doctor@123",
      name: "Dr. Marcus Reed",
    },
  },
  patient: {
    label: "Patient Portal",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    title: "Secure access to your MedixAI health portal",
    description: "Sign in to view records, manage appointments, and continue your care journey.",
    credentials: {
      email: "patient@medixai.com",
      password: "Patient@123",
      name: "Noah Bennett",
    },
  },
};

export default function RoleAuthPage({ role }: RoleAuthPageProps) {
  const container = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { isReady, session, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [doctorForm, setDoctorForm] = useState<DoctorProfile>({
    specialty: "",
    medicalLicenseNumber: "",
    yearsOfExperience: 0,
    hospitalAffiliation: "",
    phoneNumber: "",
    highestQualification: "",
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const content = roleContent[role];

  useEffect(() => {
    if (isReady && session?.role === role) {
      setLocation(getRoleDashboardPath(role));
    }
  }, [isReady, role, session, setLocation]);

  useGSAP(() => {
    gsap.from(".auth-fade-up", {
      y: 28,
      opacity: 0,
      stagger: 0.08,
      duration: 0.75,
      ease: "power3.out",
    });

    gsap.to(".auth-float", {
      y: -14,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.35,
    });
  }, { scope: container });

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    const result = signIn(role, loginForm.email, loginForm.password);

    if (!result.ok) {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back",
      description: `${result.session.fullName} successfully entered the ${role} portal.`,
    });
    setLocation(getRoleDashboardPath(role));
  };

  const handleDemoAccess = () => {
    const result = signIn(
      role,
      content.credentials.email,
      content.credentials.password,
    );

    if (!result.ok) {
      toast({
        title: "Demo access unavailable",
        description: "We were unable to open the demo account. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Demo access enabled",
      description: `${content.label} is now open in demo mode.`,
    });
    setLocation(getRoleDashboardPath(role));
  };

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();

    if (signUpForm.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Please use a password with at least 8 characters for a secure account setup.",
        variant: "destructive",
      });
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "The password and confirmation password must match before the account can be created.",
        variant: "destructive",
      });
      return;
    }

    const result = signUp(
      role,
      signUpForm.fullName,
      signUpForm.email,
      signUpForm.password,
      role === "doctor" ? doctorForm : undefined,
    );

    if (!result.ok) {
      toast({
        title: "Signup failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    if ("requiresApproval" in result && result.requiresApproval) {
      toast({
        title: "Verification submitted",
        description: result.message,
      });
      setActiveTab("login");
      setSignUpForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setDoctorForm({
        specialty: "",
        medicalLicenseNumber: "",
        yearsOfExperience: 0,
        hospitalAffiliation: "",
        phoneNumber: "",
        highestQualification: "",
      });
      return;
    }

    toast({
      title: "Account created",
      description: `${result.session.fullName}, your ${role} portal is ready.`,
    });
    setLocation(getRoleDashboardPath(role));
  };

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div ref={container} className="min-h-screen overflow-x-hidden overflow-y-auto bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24%)]" />
      <div className="auth-float absolute left-[-4rem] top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="auth-float absolute right-[-2rem] top-28 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),transparent)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-5 md:px-8 lg:px-12">
        <div className="auth-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to Role Selection
          </Link>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-lg shadow-primary/15">
              <HeartPulse size={24} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">MedixAI</p>
              <p className="text-xs text-muted-foreground">Secure portal access</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-2xl flex-1 items-start md:mt-6 md:items-center">
          <section className="auth-fade-up w-full">
            <div className="rounded-[2rem] border border-border/70 bg-white/[0.92] p-4 shadow-[0_35px_120px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-6 md:p-7">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
                <TabsList className={`grid h-auto w-full rounded-2xl bg-slate-100 p-1.5 ${role === "admin" ? "grid-cols-1" : "grid-cols-2"}`}>
                  <TabsTrigger value="login" className="rounded-xl py-3 text-sm font-semibold">
                    <Lock size={16} />
                    Login
                  </TabsTrigger>
                  {role !== "admin" ? (
                    <TabsTrigger value="signup" className="rounded-xl py-3 text-sm font-semibold">
                      <UserRoundPlus size={16} />
                      Sign Up
                    </TabsTrigger>
                  ) : null}
                </TabsList>

                <TabsContent value="login" className="mt-5">
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        {role === "admin" ? "Superuser ID" : "Email Address"}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type="text"
                          required
                          value={loginForm.email}
                          onChange={(event) =>
                            setLoginForm((current) => ({ ...current, email: event.target.value }))
                          }
                          placeholder={role === "admin" ? "Enter superuser ID" : "you@medixai.com"}
                          className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginForm.password}
                          onChange={(event) =>
                            setLoginForm((current) => ({ ...current, password: event.target.value }))
                          }
                          placeholder="Enter your password"
                          className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-12 shadow-none focus-visible:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                        >
                          {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <span>Role-aware access enabled</span>
                      <span className="font-semibold text-primary capitalize">{role} portal</span>
                    </div>

                    <button
                      type="submit"
                      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${content.accent} text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition-transform hover:-translate-y-0.5`}
                    >
                      Enter {role} portal
                      <ChevronRight size={16} />
                    </button>
                  </form>
                </TabsContent>

                {role !== "admin" ? (
                <TabsContent value="signup" className="mt-5">
                  <form className="space-y-4" onSubmit={handleSignUp}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type="text"
                            required
                            value={signUpForm.fullName}
                            onChange={(event) =>
                              setSignUpForm((current) => ({ ...current, fullName: event.target.value }))
                            }
                            placeholder="Enter your full name"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type="email"
                            required
                            value={signUpForm.email}
                            onChange={(event) =>
                              setSignUpForm((current) => ({ ...current, email: event.target.value }))
                            }
                            placeholder="name@medixai.com"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none focus-visible:ring-2"
                          />
                        </div>
                      </div>
                    </div>

                    {role === "doctor" && (
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Specialty</label>
                          <Input
                            type="text"
                            required
                            value={doctorForm.specialty}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                specialty: event.target.value,
                              }))
                            }
                            placeholder="e.g. Cardiology"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Medical License No.</label>
                          <Input
                            type="text"
                            required
                            value={doctorForm.medicalLicenseNumber}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                medicalLicenseNumber: event.target.value,
                              }))
                            }
                            placeholder="License number"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
                          <Input
                            type="number"
                            min={0}
                            required
                            value={doctorForm.yearsOfExperience || ""}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                yearsOfExperience: Number(event.target.value),
                              }))
                            }
                            placeholder="e.g. 7"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                          <Input
                            type="text"
                            required
                            value={doctorForm.phoneNumber}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                phoneNumber: event.target.value,
                              }))
                            }
                            placeholder="Contact number"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>

                        <div className="space-y-2 xl:col-span-2">
                          <label className="text-sm font-semibold text-slate-700">Hospital / Clinic Affiliation</label>
                          <Input
                            type="text"
                            required
                            value={doctorForm.hospitalAffiliation}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                hospitalAffiliation: event.target.value,
                              }))
                            }
                            placeholder="Current hospital or clinic"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Highest Qualification</label>
                          <Input
                            type="text"
                            required
                            value={doctorForm.highestQualification}
                            onChange={(event) =>
                              setDoctorForm((current) => ({
                                ...current,
                                highestQualification: event.target.value,
                              }))
                            }
                            placeholder="e.g. MBBS, MD, MS"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 shadow-none focus-visible:ring-2"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type={showSignUpPassword ? "text" : "password"}
                            required
                            value={signUpForm.password}
                            onChange={(event) =>
                              setSignUpForm((current) => ({ ...current, password: event.target.value }))
                            }
                            placeholder="Minimum 8 chars"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-12 shadow-none focus-visible:ring-2"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword((current) => !current)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                          >
                            {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={signUpForm.confirmPassword}
                            onChange={(event) =>
                              setSignUpForm((current) => ({
                                ...current,
                                confirmPassword: event.target.value,
                              }))
                            }
                            placeholder="Repeat password"
                            className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-12 shadow-none focus-visible:ring-2"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((current) => !current)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${content.accent} text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition-transform hover:-translate-y-0.5`}
                    >
                      Create {role} account
                      <ChevronRight size={16} />
                    </button>
                  </form>
                </TabsContent>
                ) : null}
              </Tabs>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
