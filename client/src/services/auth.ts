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
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
