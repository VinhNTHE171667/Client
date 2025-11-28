import type { CategoryData } from "@/services/services";

export type servicesModelTable = {
  id: string;
  name: string;
  price: number;
  images:
    | {
        url: string;
      }[]
    | [];
  description: string;
  categoryId: string;
  categoryName: string;
  spaId: string;
  spaName: string;
  isActive: boolean;
  category: CategoryData;
  onUpdate: () => void;
  onRemove: () => void;
  doctors: {
    id: string;
    name: string;
    avatar: string | null;
  }[];
  // onDisable: () => void;
};
