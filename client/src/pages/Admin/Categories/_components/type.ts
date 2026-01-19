export type categoriesModelTable = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  onUpdate: () => void;
  onRemove: () => void;
  // onDisable: () => void;
};
