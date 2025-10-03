export type SpaModelTable = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  logo: string | null;
  description: string | null;
  isActive: boolean;
  membership: {
    id: string;
    level: string;
    price: number;
    levelNumber: number;
  };
  createdAt: string;
  updatedAt: string;
  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
