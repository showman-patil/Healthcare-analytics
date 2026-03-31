
export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus];

export const PatientStatus = {
  active: "active",
  inactive: "inactive",
  critical: "critical",
} as const;
