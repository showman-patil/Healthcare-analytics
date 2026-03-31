import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  type LucideIcon,
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  HeartPulse,
  Bell,
  Menu,
  LogOut,
  BarChart2,
  ClipboardList,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getInitials, getRoleAuthPath, getStoredAccounts } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime, usePortalData } from "@/lib/portal-data-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PortalSearchBar } from "@/components/layout/PortalSearchBar";

interface DashboardLayoutProps {
  role: "admin" | "doctor" | "patient";
  children: React.ReactNode;
}

type NavLink = {
  path: string;
  label: string;
  icon: LucideIcon;
};

type NavigationConfig = {
  primary: NavLink[];
  utility?: NavLink[];
};

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const { session, signOut } = useAuth();
  const {
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    patientProfile,
  } = usePortalData();

  useGSAP(() => {
    gsap.from(sidebarRef.current, {
      x: -50,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out"
    });
    gsap.from(mainRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: 0.2,
      ease: "power3.out"
    });
  }, []);

  const navigationByRole: Record<DashboardLayoutProps["role"], NavigationConfig> = {
    admin: {
      primary: [
        { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/users", label: "User Management", icon: Users },
        { path: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      ],
    },
    doctor: {
      primary: [
        { path: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/doctor/patients", label: "My Patients", icon: Users },
        { path: "/doctor/appointments", label: "Appointments", icon: Calendar },
      ],
      utility: [
        { path: "/doctor/notifications", label: "Notifications", icon: Bell },
      ],
    },
    patient: {
      primary: [
        { path: "/patient/dashboard", label: "Overview", icon: LayoutDashboard },
        { path: "/patient/records", label: "Health Records", icon: ClipboardList },
        { path: "/patient/prediction", label: "Symptom Checker", icon: Stethoscope },
        { path: "/patient/booking", label: "Book Appointment", icon: Calendar },
      ],
      utility: [
        { path: "/patient/notifications", label: "Notifications", icon: Bell },
        { path: "/patient/profile", label: "Profile", icon: UserCheck },
      ],
    },
  };

  const links = navigationByRole[role].primary;
  const utilityLinks = navigationByRole[role].utility ?? [];
  const allLinks = [...links, ...utilityLinks];
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const recentNotifications = notifications.slice(0, 4);
  const notificationsPath =
    role === "doctor" ? "/doctor/notifications" : "/patient/notifications";
  const displayName =
    role === "patient"
      ? patientProfile.name || session?.fullName || "Patient User"
      : session?.fullName ?? `${role} User`;
  const displayEmail =
    role === "patient"
      ? patientProfile.email || session?.email || "patient@medixai.com"
      : session?.email ?? `${role}@medixai.com`;
  const doctorAccount =
    role === "doctor" && session?.email
      ? getStoredAccounts().find(
          (account) => account.role === "doctor" && account.email === session.email,
        ) ?? null
      : null;
  const profileImage =
    role === "patient"
      ? patientProfile.profileImage ?? ""
      : role === "doctor"
        ? doctorAccount?.doctorProfile?.profileImage ?? ""
        : "";
  const activeLink = allLinks.find((link) => link.path === location);

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false);
    setLocation(path);
  };

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
    setLocation(getRoleAuthPath(role));
  };

  return (
    <div className="min-h-screen bg-background lg:flex lg:overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 glass-panel flex flex-col transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <HeartPulse size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground leading-tight">MedixAI</h1>
            <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
          </div>
        </div>

          <div className="px-4 py-2">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-4 px-2">Menu</div>
          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = location === link.path;
              return (
                <Link 
                  key={link.path} 
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <link.icon size={20} className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
        {/* Header */}
        <header className="glass-panel z-30 flex min-h-20 items-center justify-between border-x-0 border-t-0 px-3 py-3 sm:px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-base font-semibold text-foreground">
                {activeLink?.label ?? `${role} portal`}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{role} workspace</p>
            </div>
            <PortalSearchBar links={allLinks} role={role} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {role === "doctor" || role === "patient" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={
                      unreadNotifications.length > 0
                        ? `${unreadNotifications.length} unread notifications`
                        : "Open notifications"
                    }
                  >
                    <Bell size={20} />
                    {unreadNotifications.length > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                      </span>
                    ) : null}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-2xl p-0">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadNotifications.length} unread updates
                      </p>
                    </div>
                    {unreadNotifications.length > 0 ? (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {recentNotifications.length === 0 ? (
                      <div className="rounded-xl px-3 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            if (!notification.read) {
                              markNotificationRead(notification.id);
                            }
                            navigateTo(notificationsPath);
                          }}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/70"
                        >
                          <div className="relative mt-0.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Bell size={16} />
                            </div>
                            {!notification.read ? (
                              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                {notification.title}
                              </p>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t p-2">
                    <button
                      type="button"
                      onClick={() => navigateTo(notificationsPath)}
                      className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      View all notifications
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <div className="mx-1 hidden h-8 w-px bg-border sm:block"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 rounded-full p-1.5 text-left transition-colors hover:bg-muted/50 sm:gap-3 sm:pr-3"
                  aria-label="Open account menu"
                >
                  <Avatar className="h-9 w-9 border border-white/70 shadow-sm">
                    {profileImage ? (
                      <AvatarImage
                        src={profileImage}
                        alt={`${displayName} avatar`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-indigo-500 text-sm font-bold text-white">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 text-sm sm:block">
                    <p className="truncate font-semibold text-foreground leading-tight">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                  </div>
                  <ChevronDown size={16} className="ml-1 hidden text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                <DropdownMenuLabel className="px-3 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="truncate pt-0.5 text-xs font-normal text-muted-foreground">
                    {displayEmail}
                  </p>
                </DropdownMenuLabel>
                {role === "patient" || role === "doctor" ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        navigateTo(
                          role === "doctor" ? "/doctor/profile" : "/patient/profile",
                        )
                      }
                    >
                      <UserCheck size={16} />
                      Profile Settings
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut size={16} />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-background/50 p-3 sm:p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
