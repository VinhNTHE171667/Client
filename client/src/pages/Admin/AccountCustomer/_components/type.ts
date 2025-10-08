export type CustomerModelTable = {
  id: string;
  full_name: string;
  avatar: string | null;
  gender: "male" | "female" | "other";
  birth_date: string;
  isActive: boolean;
  isVerified: boolean;
  phone: string;
  email: string;
  customer_type: "regular" | "vip" | "member" | "trial";
  total_spent: string;
  createdAt: string;
  updatedAt: string;
  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
