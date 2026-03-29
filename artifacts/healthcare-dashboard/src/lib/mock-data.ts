import { 
  Patient, Doctor, Appointment, AnalyticsOverview, DiseaseTrendPoint 
} from "@workspace/api-client-react";

export const MOCK_ANALYTICS: AnalyticsOverview = {
  totalPatients: 12458,
  totalDoctors: 342,
  totalAppointments: 1893,
  criticalCases: 42,
  bedOccupancy: 84.5,
  avgWaitTime: 18.2,
  patientGrowth: 12.5,
  appointmentGrowth: 8.4
};

export const MOCK_TRENDS: DiseaseTrendPoint[] = [
  { month: "Jan", diabetes: 120, hypertension: 200, heartDisease: 80, respiratory: 150, cancer: 30 },
  { month: "Feb", diabetes: 132, hypertension: 190, heartDisease: 85, respiratory: 180, cancer: 32 },
  { month: "Mar", diabetes: 145, hypertension: 210, heartDisease: 78, respiratory: 160, cancer: 35 },
  { month: "Apr", diabetes: 155, hypertension: 225, heartDisease: 90, respiratory: 140, cancer: 33 },
  { month: "May", diabetes: 140, hypertension: 215, heartDisease: 95, respiratory: 130, cancer: 38 },
  { month: "Jun", diabetes: 160, hypertension: 230, heartDisease: 88, respiratory: 120, cancer: 36 },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 1, name: "Eleanor Shellstrop", age: 34, gender: "Female", bloodType: "O+", phone: "555-0192", email: "eleanor@example.com", condition: "Asthma", riskLevel: "low", lastVisit: "2025-05-10", status: "active", doctorId: 1 },
  { id: 2, name: "Chidi Anagonye", age: 41, gender: "Male", bloodType: "A-", phone: "555-0193", email: "chidi@example.com", condition: "Hypertension", riskLevel: "medium", lastVisit: "2025-05-12", status: "active", doctorId: 2 },
  { id: 3, name: "Tahani Al-Jamil", age: 29, gender: "Female", bloodType: "AB+", phone: "555-0194", email: "tahani@example.com", condition: "None", riskLevel: "low", lastVisit: "2025-04-20", status: "inactive", doctorId: 1 },
  { id: 4, name: "Jason Mendoza", age: 38, gender: "Male", bloodType: "B+", phone: "555-0195", email: "jason@example.com", condition: "Coronary Artery Disease", riskLevel: "high", lastVisit: "2025-05-14", status: "critical", doctorId: 3 },
  { id: 5, name: "Michael Realman", age: 60, gender: "Male", bloodType: "O-", phone: "555-0196", email: "michael@example.com", condition: "Type 2 Diabetes", riskLevel: "medium", lastVisit: "2025-05-01", status: "active", doctorId: 2 },
];

export const MOCK_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Sarah Chen", specialty: "Cardiology", email: "schen@hospital.org", phone: "555-1101", patients: 342, rating: 4.9, status: "active" },
  { id: 2, name: "Dr. Marcus Thorne", specialty: "Neurology", email: "mthorne@hospital.org", phone: "555-1102", patients: 184, rating: 4.7, status: "active" },
  { id: 3, name: "Dr. Aisha Patel", specialty: "Pediatrics", email: "apatel@hospital.org", phone: "555-1103", patients: 512, rating: 4.8, status: "on-leave" },
  { id: 4, name: "Dr. James Wilson", specialty: "General Practice", email: "jwilson@hospital.org", phone: "555-1104", patients: 890, rating: 4.6, status: "active" },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 1, patientId: 1, patientName: "Eleanor Shellstrop", doctorId: 1, doctorName: "Dr. Sarah Chen", date: "2025-05-20", time: "09:00 AM", type: "Follow-up", status: "scheduled" },
  { id: 2, patientId: 2, patientName: "Chidi Anagonye", doctorId: 2, doctorName: "Dr. Marcus Thorne", date: "2025-05-20", time: "10:30 AM", type: "Consultation", status: "pending" },
  { id: 3, patientId: 4, patientName: "Jason Mendoza", doctorId: 3, doctorName: "Dr. Aisha Patel", date: "2025-05-21", time: "02:00 PM", type: "Emergency", status: "completed" },
];
