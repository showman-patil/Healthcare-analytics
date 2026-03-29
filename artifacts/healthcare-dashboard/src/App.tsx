import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminResources from "@/pages/admin/AdminResources";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorPrediction from "@/pages/doctor/DoctorPrediction";
import DoctorRecords from "@/pages/doctor/DoctorRecords";
import DoctorAppointments from "@/pages/doctor/DoctorAppointments";
import DoctorMessages from "@/pages/doctor/DoctorMessages";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientRecords from "@/pages/patient/PatientRecords";
import PatientPrediction from "@/pages/patient/PatientPrediction";
import PatientBooking from "@/pages/patient/PatientBooking";
import PatientNotifications from "@/pages/patient/PatientNotifications";
import PatientProfile from "@/pages/patient/PatientProfile";

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

      <Route path="/admin/dashboard">
        <DashboardLayout role="admin"><AdminDashboard /></DashboardLayout>
      </Route>
      <Route path="/admin/users">
        <DashboardLayout role="admin"><AdminUsers /></DashboardLayout>
      </Route>
      <Route path="/admin/resources">
        <DashboardLayout role="admin"><AdminResources /></DashboardLayout>
      </Route>
      <Route path="/admin/analytics">
        <DashboardLayout role="admin"><AdminAnalytics /></DashboardLayout>
      </Route>
      <Route path="/admin/reports">
        <DashboardLayout role="admin"><AdminReports /></DashboardLayout>
      </Route>
      <Route path="/admin/settings">
        <DashboardLayout role="admin"><AdminSettings /></DashboardLayout>
      </Route>

      <Route path="/doctor/dashboard">
        <DashboardLayout role="doctor"><DoctorDashboard /></DashboardLayout>
      </Route>
      <Route path="/doctor/patients">
        <DashboardLayout role="doctor"><DoctorPatients /></DashboardLayout>
      </Route>
      <Route path="/doctor/prediction">
        <DashboardLayout role="doctor"><DoctorPrediction /></DashboardLayout>
      </Route>
      <Route path="/doctor/records">
        <DashboardLayout role="doctor"><DoctorRecords /></DashboardLayout>
      </Route>
      <Route path="/doctor/appointments">
        <DashboardLayout role="doctor"><DoctorAppointments /></DashboardLayout>
      </Route>
      <Route path="/doctor/messages">
        <DashboardLayout role="doctor"><DoctorMessages /></DashboardLayout>
      </Route>

      <Route path="/patient/dashboard">
        <DashboardLayout role="patient"><PatientDashboard /></DashboardLayout>
      </Route>
      <Route path="/patient/records">
        <DashboardLayout role="patient"><PatientRecords /></DashboardLayout>
      </Route>
      <Route path="/patient/prediction">
        <DashboardLayout role="patient"><PatientPrediction /></DashboardLayout>
      </Route>
      <Route path="/patient/booking">
        <DashboardLayout role="patient"><PatientBooking /></DashboardLayout>
      </Route>
      <Route path="/patient/notifications">
        <DashboardLayout role="patient"><PatientNotifications /></DashboardLayout>
      </Route>
      <Route path="/patient/profile">
        <DashboardLayout role="patient"><PatientProfile /></DashboardLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
