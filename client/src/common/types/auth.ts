export type Role = "Admin" | "Customer" | "Staff" | "Cashier" | "Doctor";

export const ROLE = [
  "Admin",
  "Customer",
  "Cashier",
  "Staff",
  "Doctor",
] as const;

export type Roles = Role[];

export const RoleEnum = {
  Admin: "Admin",
  Customer: "Customer",
  Staff: "Staff",
  Casher: "Cashier",
  Doctor: "Doctor",
} as const;

export const CustomerTypeEnum = {
  Regular: "regular",
  Member: "member",
  Vip: "vip",
} as const;

export const appointmentStatusEnum = {
  Pending: "pending",
  Confirmed: "confirmed",
  Deposited: "deposited",
  Approved: "approved",
  Rejected: "rejected",
  Paid: "paid",
  Cancelled: "cancelled",
  Completed: "completed",
} as const;

export type RoleEnumType = (typeof RoleEnum)[keyof typeof RoleEnum];
