import type { AppointmentStatus } from "./appointmentStatus";

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
