import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export type SignInProps = {
  email: string;
  password: string;
};

export type RegisterCustomerProps = {
  full_name: string;
  gender: "male" | "female";
  phone: string;
  email: string;
  password: string;
};

export type StatictisAdminProps = {
  year: number;
  data: {
    month: number;
    totalInvoices: number;
    totalAmount: number;
    finalAmount: number;
    totalCustomers: number;
  }[];
  categories: {
    id: string;
    name: string;
    serviceCount: number;
  }[];
  memberShipData: {
    month: number;
    totalInvoices: number;
    finalAmount: number;
  }[];
};

export type CustomerProfileProps = {
  full_name: string;
  avatar: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  gender: string;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
    login: build.mutation({
      query: (userData: SignInProps) => ({
        url: "/auth/login",
        method: "Post",
        // authRequired: true,
        keepUnusedDataFor: 0,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 5000,
        data: userData,
      }),
    }),
    register: build.mutation({
      query: (userData: RegisterCustomerProps) => ({
        url: "/auth/register-customer",
        method: "Post",
        data: userData,
      }),
    }),

    getAdminStatistics: build.mutation<
      StatictisAdminProps,
      {
        year: number;
        spaId?: string;
      }
    >({
      query: ({ year, spaId }) => ({
        url: `/services/admin/statistics`,
        method: "Get",
        params: {
          year: year,
          spaId: spaId,
        },
      }),
    }),

    getCustomerProfile: build.mutation<CustomerProfileProps, string>({
      query: (id) => ({
        url: `/auth/profile/${id}`,
        method: "Get",
      }),
    }),

    updateAvatar: build.mutation<
      { avatar: string },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/auth/avatar/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
    }),

    updateCustomerProfile: build.mutation<
      void,
      { id: string; data: Omit<CustomerProfileProps, "avatar"> }
    >({
      query: ({ id, data }) => ({
        url: `/auth/profile/${id}`,
        method: "PATCH",
        data: data,
      }),
    }),

    changePassword: build.mutation<
      { message: string },
      { id: string; oldPassword: string; newPassword: string }
    >({
      query: ({ id, oldPassword, newPassword }) => ({
        url: `/auth/change-password/${id}`,
        method: "PATCH",
        data: { oldPassword, newPassword },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetAdminStatisticsMutation,
  useGetCustomerProfileMutation,
  useUpdateAvatarMutation,
  useUpdateCustomerProfileMutation,
  useChangePasswordMutation,
} = authApi;
