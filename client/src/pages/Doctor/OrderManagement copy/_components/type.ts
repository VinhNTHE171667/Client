import type { AppointmentProps } from "@/services/appointment";

export type AppointmentTableProps = AppointmentProps & {
  onComplete: () => void;
  onUpdate: () => void;
};
