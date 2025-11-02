import type { AppointmentProps } from "@/services/appointment";

export type AppointmentTableProps = AppointmentProps & {
  onPaymentByCash: () => void;
  onPaymentByQR: () => void;
};
