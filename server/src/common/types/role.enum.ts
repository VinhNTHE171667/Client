export enum RoleEnum {
  Admin = 'Admin',
  Customer = 'Customer',
}

export type RoleType = keyof typeof RoleEnum;
