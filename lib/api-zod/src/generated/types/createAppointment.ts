
export interface CreateAppointment {
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  type?: string;
  notes?: string;
}
