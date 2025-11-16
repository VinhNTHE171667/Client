import type { DoctorRequestCancelProps } from "@/services/appointment";

export type DoctorRequestCancelPropsModel = DoctorRequestCancelProps & {
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
};
