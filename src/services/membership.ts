import type { CustomerTypeEnum } from "@/common/types/auth";
import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export type membershipDatas = {
  id: string;
  name: keyof typeof CustomerTypeEnum;
  minSpent: string;
  maxSpent: string | null;
  discountPercent: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type UpdateMembershipDto = Partial<{
  name: keyof typeof CustomerTypeEnum;
  minSpent: number;
  maxSpent: number | null;
  discountPercent: number;
}>;

export const membershipApi = createApi({
  reducerPath: "membershipApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
    getMemberships: build.mutation<membershipDatas[], void>({
      query: () => ({
        url: "/membership",
        method: "Get",
      }),
    }),

    getMembershipById: build.mutation<membershipDatas, string>({
      query: (id) => ({
        url: `/membership/${id}`,
        method: "Get",
      }),
    }),

    updateMembership: build.mutation<
      membershipDatas,
      { id: string; data: UpdateMembershipDto }
    >({
      query: ({ id, data }) => ({
        url: `/membership/${id}`,
        method: "PUT",
        data,
      }),
    }),

    getMembershipByCustomer: build.mutation<membershipDatas, string>({
      query: (customerId) => ({
        url: `/membership/customer/${customerId}`,
        method: "Get",
      }),
    }),
  }),
});

export const {
  useGetMembershipsMutation,
  useGetMembershipByIdMutation,
  useUpdateMembershipMutation,

  useGetMembershipByCustomerMutation,
} = membershipApi;
