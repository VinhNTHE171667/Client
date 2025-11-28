import type { StaffData } from "@/services/account";

export type StaffDataTable = StaffData & {
  onUpdate: () => void;
  onRemove: () => Promise<void>;
  // onDisable: () => void;
};
