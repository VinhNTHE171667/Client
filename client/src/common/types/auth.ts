export type Role =
  | "Admin"
  | "Customer"
  | "Spa"
  | "SpaAdmin"
  | "Staff"
  | "SpecialList";

export const ROLE = [
  "Admin",
  "Customer",
  "Spa",
  "Staff",
  "SpecialList",
] as const;

export type Roles = Role[];

export const RoleEnum = {
  Admin: "Admin",
  Customer: "Customer",
  Spa: "Spa",
  Staff: "Staff",
  SpecialList: "SpecialList",
} as const;

export type RoleEnumType = (typeof RoleEnum)[keyof typeof RoleEnum];
