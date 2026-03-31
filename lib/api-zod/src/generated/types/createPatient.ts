
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
