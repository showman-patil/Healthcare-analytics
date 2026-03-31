
export type PredictionResultRiskLevel =
  (typeof PredictionResultRiskLevel)[keyof typeof PredictionResultRiskLevel];

export const PredictionResultRiskLevel = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;
