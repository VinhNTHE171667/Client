import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { InvoiceProps } from "./appointment";

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

export type Dashboard = {
  totalCustomers: number;
  totalAmount: number;
  totalInvoices: number;
  totalServices: number;
  topServices: {
    name: string;
    count: number;
  }[];
  topCustomers: {
    name: string;
    total: number;
  }[];
  invoices: InvoiceProps[];
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

    updateAvatarCustomer: build.mutation<
      { avatar: string },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/auth/avatar/Customer/${id}`,
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

    changePasswordCustomer: build.mutation<
      { message: string },
      { id: string; oldPassword: string; newPassword: string }
    >({
      query: ({ id, oldPassword, newPassword }) => ({
        url: `/auth/change-password/Customer/${id}`,
        method: "PATCH",
        data: { oldPassword, newPassword },
      }),
    }),

    forgotPassword: build.mutation<{ message: string }, { email: string }>({
      query: ({ email }) => ({
        url: `/auth/forgot-password`,
        method: "POST",
        data: { email },
      }),
    }),

    resetPassword: build.mutation<
      { message: string },
      { token: string; newPassword: string }
    >({
      query: ({ token, newPassword }) => ({
        url: `/auth/reset-password`,
        method: "POST",
        data: { token, newPassword },
      }),
    }),

    getSpaProfile: build.mutation<
      {
        id: string;
        name: string;
        logo: string;
        address: string;
        phone: string;
        email: string;
      },
      void
    >({
      query: () => ({
        url: `/auth/spa/profile/`,
        method: "GET",
      }),
    }),

    updateSpaProfile: build.mutation<
      void,
      {
        data: {
          name: string;
          address: string;
          phone: string;
          email: string;
        };
      }
    >({
      query: ({ data }) => ({
        url: `/auth/spa/profile/`,
        method: "PATCH",
        data: data,
      }),
    }),

    changePasswordAdmin: build.mutation<
      { message: string },
      { id: string; oldPassword: string; newPassword: string }
    >({
      query: ({ id, oldPassword, newPassword }) => ({
        url: `/auth/change-password/Admin/${id}`,
        method: "PATCH",
        data: { oldPassword, newPassword },
      }),
    }),

    getStaffProfile: build.mutation<
      {
        id: string;
        full_name: string;
        avatar: string;
        email: string;
        phone: string;
        gender: string;
      },
      string
    >({
      query: (id) => ({
        url: `/auth/staff/profile/${id}`,
        method: "GET",
      }),
    }),

    UpdateStaffProfile: build.mutation<
      void,
      {
        id: string;
        data: {
          full_name: string;
          email: string;
          phone: string;
          gender: string;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/auth/staff/profile/${id}`,
        method: "PATCH",
        data: data,
      }),
    }),

    updateAvatarStaff: build.mutation<
      { avatar: string },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/auth/avatar/Staff/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
    }),

    updateAvatarCashier: build.mutation<
      { avatar: string },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/auth/avatar/Cashier/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
    }),

    changePasswordStaff: build.mutation<
      { message: string },
      { id: string; oldPassword: string; newPassword: string }
    >({
      query: ({ id, oldPassword, newPassword }) => ({
        url: `/auth/change-password/Staff/${id}`,
        method: "PATCH",
        data: { oldPassword, newPassword },
      }),
    }),

    getDoctorProfile: build.mutation<
      {
        id: string;
        full_name: string;
        avatar: string;
        email: string;
        phone: string;
        gender: string;
        biography: string;
        specialization: string;
        experience_years: number;
      },
      string
    >({
      query: (id) => ({
        url: `/auth/doctor/profile/${id}`,
        method: "GET",
      }),
    }),

    updateDoctorProfile: build.mutation<
      void,
      {
        id: string;
        data: {
          full_name: string;
          phone: string;
          email: string;
          gender: string;
          biography: string;
          specialization: string;
          experience_years: number;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/auth/doctor/profile/${id}`,
        method: "PATCH",
        data: data,
      }),
    }),

    updateAvatarDoctor: build.mutation<
      { avatar: string },
      { id: string; file: File }
    >({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/auth/avatar/Doctor/${id}`,
          method: "PATCH",
          body: formData,
        };
      },
    }),

    changePasswordDoctor: build.mutation<
      { message: string },
      { id: string; oldPassword: string; newPassword: string }
    >({
      query: ({ id, oldPassword, newPassword }) => ({
        url: `/auth/change-password/Doctor/${id}`,
        method: "PATCH",
        data: { oldPassword, newPassword },
      }),
    }),

    dashboard: build.mutation<
      Dashboard,
      {
        year: number;
        month: number;
      }
    >({
      query: ({ year, month }) => ({
        url: `/appointment/dashboard`,
        method: "GET",
        params: {
          year: year,
          month: month,
        },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetAdminStatisticsMutation,
  useGetCustomerProfileMutation,

  useUpdateAvatarCustomerMutation,
  useUpdateCustomerProfileMutation,
  useChangePasswordCustomerMutation,

  useForgotPasswordMutation,
  useResetPasswordMutation,

  useGetSpaProfileMutation,
  useUpdateSpaProfileMutation,
  useChangePasswordAdminMutation,

  useGetStaffProfileMutation,
  useUpdateStaffProfileMutation,
  useUpdateAvatarStaffMutation,
  useUpdateAvatarCashierMutation,
  useChangePasswordStaffMutation,

  useGetDoctorProfileMutation,
  useUpdateDoctorProfileMutation,
  useUpdateAvatarDoctorMutation,
  useChangePasswordDoctorMutation,

  useDashboardMutation,
} = authApi;
