
export type PatientRiskLevel =
  (typeof PatientRiskLevel)[keyof typeof PatientRiskLevel];

export const PatientRiskLevel = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;
