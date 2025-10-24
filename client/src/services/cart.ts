import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export type CartData = {
  id: string;
  items: CartItemData[];
};

export type CartItemData = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  images: [
    {
      url: string;
    }
  ];
  categoryId: string;
};

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),

  endpoints: (build) => ({
    getCart: build.mutation<CartData, string>({
      query: (customerId: string) => ({
        url: `/cart/${customerId}`,
        method: "Get",
      }),
    }),

    addToCart: build.mutation<
      void,
      { customerId: string; itemData: { itemId: string; quantity?: number } }
    >({
      query: ({ customerId, itemData }) => ({
        url: `/cart/add/${customerId}`,
        method: "Post",
        data: itemData,
      }),
    }),

    deleteFromCart: build.mutation<
      void,
      { customerId: string; itemId: string }
    >({
      query: ({ customerId, itemId }) => ({
        url: `/cart/${customerId}/items/${itemId}`,
        method: "Delete",
      }),
    }),

    deleteCart: build.mutation<void, string>({
      query: (customerId: string) => ({
        url: `/cart/clear/${customerId}`,
        method: "Post",
      }),
    }),
  }),
});

export const {
  useGetCartMutation,
  useAddToCartMutation,
  useDeleteFromCartMutation,
} = cartApi;
