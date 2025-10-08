export enum RoleEnum {
  Customer = 'Customer',
  Admin = 'Admin',
  Staff = 'Staff',
  Cashier = 'Cashier',
  Doctor = 'Doctor',
}

export type RoleType = keyof typeof RoleEnum;
