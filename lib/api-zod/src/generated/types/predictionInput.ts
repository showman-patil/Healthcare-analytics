
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
