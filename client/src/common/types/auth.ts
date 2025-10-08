export type Role = "Admin" | "Customer" | "Staff" | "Casher" | "Doctor";

export const ROLE = ["Admin", "Customer", "Casher", "Staff", "Doctor"] as const;

export type Roles = Role[];

export const RoleEnum = {
  Admin: "Admin",
  Customer: "Customer",
  Staff: "Staff",
  Casher: "Casher",
  Doctor: "Doctor",
} as const;

export type RoleEnumType = (typeof RoleEnum)[keyof typeof RoleEnum];
