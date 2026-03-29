import React, { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Users, Activity, FileText, Settings, 
  Stethoscope, Calendar, MessageSquare, HeartPulse, 
  Bell, Search, Menu, X, LogOut, Brain, BookOpen,
  BarChart2, ClipboardList, BedDouble, UserCheck, ChevronDown
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface DashboardLayoutProps {
  role: "admin" | "doctor" | "patient";
  children: React.ReactNode;
}

export function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

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

  const navLinks = {
    admin: [
      { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/users", label: "User Management", icon: Users },
      { path: "/admin/resources", label: "Hospital Resources", icon: BedDouble },
      { path: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      { path: "/admin/reports", label: "Reports & Logs", icon: FileText },
      { path: "/admin/settings", label: "Settings", icon: Settings },
    ],
    doctor: [
      { path: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/doctor/patients", label: "My Patients", icon: Users },
      { path: "/doctor/prediction", label: "AI Diagnosis", icon: Brain },
      { path: "/doctor/records", label: "Medical Records", icon: BookOpen },
      { path: "/doctor/appointments", label: "Appointments", icon: Calendar },
      { path: "/doctor/messages", label: "Messages", icon: MessageSquare },
    ],
    patient: [
      { path: "/patient/dashboard", label: "My Health", icon: HeartPulse },
      { path: "/patient/records", label: "Health Records", icon: ClipboardList },
      { path: "/patient/prediction", label: "Symptom Checker", icon: Stethoscope },
      { path: "/patient/booking", label: "Book Appointment", icon: Calendar },
      { path: "/patient/notifications", label: "Notifications", icon: Bell },
      { path: "/patient/profile", label: "Profile", icon: UserCheck },
    ]
  };

  const links = navLinks[role];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
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

        <div className="mt-auto p-4">
          <Link 
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-panel border-x-0 border-t-0 flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search patients, doctors, records..." 
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1.5 pr-3 rounded-full transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {role === "admin" ? "AD" : role === "doctor" ? "DR" : "PT"}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-foreground leading-tight capitalize">{role} User</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
              <ChevronDown size={16} className="text-muted-foreground ml-1" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background/50">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
