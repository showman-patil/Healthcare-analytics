import type { DoctorStatus } from "./doctorStatus";

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
