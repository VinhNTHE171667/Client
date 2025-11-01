import type { AppointmentProps } from "@/services/appointment";

export type AppointmentTableProps = AppointmentProps & {
  onConfirm: () => void;
  onImport: () => void;
  onUpdate: () => void;
  onRemove: () => void;
};
