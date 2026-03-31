import type { ConditionPrediction } from "./conditionPrediction";
import type { PredictionResultRiskLevel } from "./predictionResultRiskLevel";

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
