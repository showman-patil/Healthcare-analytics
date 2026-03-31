
export type DoctorStatus = (typeof DoctorStatus)[keyof typeof DoctorStatus];

export const DoctorStatus = {
  active: "active",
  "on-leave": "on-leave",
  inactive: "inactive",
} as const;
