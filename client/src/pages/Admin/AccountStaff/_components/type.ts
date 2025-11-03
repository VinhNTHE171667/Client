export type StaffData = {
  id: string;
  full_name: string;
  gender: string;
  avatar?: string;
  phone?: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: "staff" | "cashier" | "admin";
    description: string;
  };

  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
