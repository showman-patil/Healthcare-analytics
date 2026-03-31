
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentStatus = {
  scheduled: "scheduled",
  completed: "completed",
  cancelled: "cancelled",
  pending: "pending",
} as const;
