export interface HealthStatus {
  status: string;
}

export type PatientRiskLevel =
  (typeof PatientRiskLevel)[keyof typeof PatientRiskLevel];

export const PatientRiskLevel = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus];

export const PatientStatus = {
  active: "active",
  inactive: "inactive",
  critical: "critical",
} as const;

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

export interface CreatePatient {
  name: string;
  age: number;
  gender: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  condition?: string;
  doctorId?: number;
}

export type DoctorStatus = (typeof DoctorStatus)[keyof typeof DoctorStatus];

export const DoctorStatus = {
  active: "active",
  "on-leave": "on-leave",
  inactive: "inactive",
} as const;

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

export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentStatus = {
  scheduled: "scheduled",
  completed: "completed",
  cancelled: "cancelled",
  pending: "pending",
} as const;

export interface Appointment {
  id: number;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  date: string;
  time: string;
  type?: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface CreateAppointment {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  type?: string;
  notes?: string;
}

export interface PredictionInput {
  symptoms: string[];
  age: number;
  gender: string;
  bloodPressure?: string;
  bloodSugar?: number;
  cholesterol?: number;
  bmi?: number;
  smokingStatus?: string;
  familyHistory?: string[];
}

export type PredictionResultRiskLevel =
  (typeof PredictionResultRiskLevel)[keyof typeof PredictionResultRiskLevel];

export const PredictionResultRiskLevel = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export interface ConditionPrediction {
  name: string;
  probability: number;
  riskLevel: string;
}

export interface PredictionResult {
  primaryDiagnosis: string;
  probability: number;
  riskLevel: PredictionResultRiskLevel;
  riskScore: number;
  summary: string;
  keyFindings: string[];
  redFlags: string[];
  conditions: ConditionPrediction[];
  recommendations: string[];
  urgency: string;
  analysisVersion: string;
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
