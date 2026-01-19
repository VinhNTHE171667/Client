export type DoctorModelTable = {
  id: string;
  full_name: string;
  avatar: string | null;
  gender: "male" | "female" | "other";
  birth_date: string;
  isActive: boolean;
  isVerified: boolean;
  phone: string;
  email: string;
  biography: string;
  specialization: string;
  experience_years: number;
  doctor_type: "regular" | "vip" | "member" | "trial";
  total_spent: string;
  createdAt: string;
  updatedAt: string;
  services: {
    id: string;
    name: string;
  }[];
  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
