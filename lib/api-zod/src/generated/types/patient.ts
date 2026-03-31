import type { PatientRiskLevel } from "./patientRiskLevel";
import type { PatientStatus } from "./patientStatus";

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
