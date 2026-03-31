type PatientRiskLevel = "low" | "medium" | "high" | "critical";
type PatientStatus = "active" | "inactive" | "critical";
type DoctorStatus = "active" | "on-leave" | "inactive";
type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  condition?: string;
  riskLevel: PatientRiskLevel;
  lastVisit?: string;
  status: PatientStatus;
  doctorId?: number;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  patients?: number;
  rating?: number;
  status: DoctorStatus;
  avatar?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  notes?: string;
  status: AppointmentStatus;
}

export interface AnalyticsOverview {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  criticalCases: number;
  bedOccupancy: number;
  avgWaitTime: number;
  patientGrowth: number;
  appointmentGrowth: number;
}

export interface DiseaseTrendPoint {
  month: string;
  diabetes: number;
  hypertension: number;
  heartDisease: number;
  respiratory: number;
  cancer: number;
}

export const demoPatients: Patient[] = [
  {
    id: 1,
    name: "Olivia Bennett",
    age: 42,
    gender: "Female",
    bloodType: "A+",
    phone: "555-2101",
    email: "olivia.bennett@example.com",
    condition: "Hypertension",
    riskLevel: "high",
    lastVisit: "2026-03-18",
    status: "active",
    doctorId: 1,
  },
  {
    id: 2,
    name: "Marcus Rivera",
    age: 58,
    gender: "Male",
    bloodType: "B+",
    phone: "555-2102",
    email: "marcus.rivera@example.com",
    condition: "Type 2 Diabetes",
    riskLevel: "critical",
    lastVisit: "2026-03-25",
    status: "critical",
    doctorId: 2,
  },
  {
    id: 3,
    name: "Anaya Sharma",
    age: 31,
    gender: "Female",
    bloodType: "O+",
    phone: "555-2103",
    email: "anaya.sharma@example.com",
    condition: "Routine Care",
    riskLevel: "low",
    lastVisit: "2026-03-20",
    status: "active",
    doctorId: 3,
  },
];

export const demoDoctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    email: "sarah.chen@example.com",
    phone: "555-1101",
    patients: 34,
    rating: 4.9,
    status: "active",
  },
  {
    id: 2,
    name: "Dr. Marcus Thorne",
    specialty: "Endocrinology",
    email: "marcus.thorne@example.com",
    phone: "555-1102",
    patients: 28,
    rating: 4.8,
    status: "active",
  },
  {
    id: 3,
    name: "Dr. Aisha Patel",
    specialty: "General Practice",
    email: "aisha.patel@example.com",
    phone: "555-1103",
    patients: 41,
    rating: 4.7,
    status: "active",
  },
];

export const demoAppointments: Appointment[] = [
  {
    id: 1,
    patientId: 1,
    patientName: "Olivia Bennett",
    doctorId: 1,
    doctorName: "Dr. Sarah Chen",
    date: "2026-03-30",
    time: "10:00 AM",
    type: "Consultation",
    notes: "Blood pressure review",
    status: "scheduled",
  },
  {
    id: 2,
    patientId: 2,
    patientName: "Marcus Rivera",
    doctorId: 2,
    doctorName: "Dr. Marcus Thorne",
    date: "2026-03-30",
    time: "02:30 PM",
    type: "Follow-up",
    notes: "Diabetes monitoring",
    status: "scheduled",
  },
];

export const demoAnalyticsOverview: AnalyticsOverview = {
  totalPatients: demoPatients.length,
  totalDoctors: demoDoctors.length,
  totalAppointments: demoAppointments.length,
  criticalCases: demoPatients.filter(
    (patient) => patient.riskLevel === "high" || patient.riskLevel === "critical",
  ).length,
  bedOccupancy: 72.5,
  avgWaitTime: 18.3,
  patientGrowth: 12.4,
  appointmentGrowth: 8.7,
};

export const demoDiseaseTrends: DiseaseTrendPoint[] = [
  { month: "Jan", diabetes: 45, hypertension: 82, heartDisease: 28, respiratory: 35, cancer: 12 },
  { month: "Feb", diabetes: 52, hypertension: 78, heartDisease: 32, respiratory: 42, cancer: 14 },
  { month: "Mar", diabetes: 48, hypertension: 85, heartDisease: 30, respiratory: 38, cancer: 11 },
  { month: "Apr", diabetes: 61, hypertension: 90, heartDisease: 35, respiratory: 45, cancer: 16 },
  { month: "May", diabetes: 55, hypertension: 88, heartDisease: 28, respiratory: 40, cancer: 13 },
  { month: "Jun", diabetes: 67, hypertension: 92, heartDisease: 38, respiratory: 52, cancer: 18 },
];
