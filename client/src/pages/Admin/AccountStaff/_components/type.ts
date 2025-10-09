export type StaffData = {
  id: string;
  full_name: string;
  avatar?: string;
  phone?: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
