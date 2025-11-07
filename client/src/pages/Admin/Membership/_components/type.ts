import type { membershipDatas } from "@/services/membership";

export type MembershipModelTable = membershipDatas & {
  onUpdate: () => void;
};
