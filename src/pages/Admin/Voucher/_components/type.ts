import type { voucherDatas } from "@/services/voucher";

export type VoucherModelTable = voucherDatas & {
  onUpdate: () => void;
  onRemove: () => void;
};
