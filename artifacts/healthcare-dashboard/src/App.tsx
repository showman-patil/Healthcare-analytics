import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorPrediction from "@/pages/doctor/DoctorPrediction";
import DoctorAppointments from "@/pages/doctor/DoctorAppointments";
import DoctorNotifications from "@/pages/doctor/DoctorNotifications";
import DoctorProfile from "@/pages/doctor/DoctorProfile";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientRecords from "@/pages/patient/PatientRecords";
import PatientPrediction from "@/pages/patient/PatientPrediction";
import PatientBooking from "@/pages/patient/PatientBooking";
import PatientNotifications from "@/pages/patient/PatientNotifications";
import PatientProfile from "@/pages/patient/PatientProfile";
import RoleAuthPage from "@/pages/RoleAuthPage";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { getRoleAuthPath, type UserRole } from "@/lib/auth";
import { PortalDataProvider } from "@/lib/portal-data-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/admin/auth">
        <RoleAuthPage role="admin" />
      </Route>
      <Route path="/doctor/auth">
        <RoleAuthPage role="doctor" />
      </Route>
      <Route path="/patient/auth">
        <RoleAuthPage role="patient" />
      </Route>

      <Route path="/admin/dashboard">
        <ProtectedPortal role="admin">
          <DashboardLayout role="admin"><AdminDashboard /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/admin/users">
        <ProtectedPortal role="admin">
          <DashboardLayout role="admin"><AdminUsers /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedPortal role="admin">
          <DashboardLayout role="admin"><AdminAnalytics /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/admin/settings">
        <ProtectedPortal role="admin">
          <DashboardLayout role="admin"><AdminSettings /></DashboardLayout>
        </ProtectedPortal>
      </Route>

      <Route path="/doctor/dashboard">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorDashboard /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/patients">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorPatients /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/prediction">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorPrediction /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/records">
        <RouteRedirect to="/doctor/patients" />
      </Route>
      <Route path="/doctor/appointments">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorAppointments /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/notifications">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorNotifications /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/profile">
        <ProtectedPortal role="doctor">
          <DashboardLayout role="doctor"><DoctorProfile /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/doctor/messages">
        <RouteRedirect to="/doctor/patients" />
      </Route>

      <Route path="/patient/dashboard">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientDashboard /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/patient/records">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientRecords /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/patient/prediction">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientPrediction /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/patient/booking">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientBooking /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/patient/notifications">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientNotifications /></DashboardLayout>
        </ProtectedPortal>
      </Route>
      <Route path="/patient/profile">
        <ProtectedPortal role="patient">
          <DashboardLayout role="patient"><PatientProfile /></DashboardLayout>
        </ProtectedPortal>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedPortal({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { isReady, session } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isReady && session?.role !== role) {
      setLocation(getRoleAuthPath(role));
    }
  }, [isReady, role, session, setLocation]);

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  if (session?.role !== role) {
    return null;
  }

  return <>{children}</>;
}

function RouteRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortalDataProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </PortalDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
