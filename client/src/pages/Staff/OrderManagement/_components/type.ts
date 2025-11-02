import type { AppointmentProps } from "@/services/appointment";

export type AppointmentTableProps = AppointmentProps & {
  onConfirm: () => void;
  onReject: () => void;
  onImport: () => void;
  onUpdate: () => void;
  onRemove: () => void;
};
