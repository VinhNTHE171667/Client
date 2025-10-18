import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export type CreateCustomerProps = {
  full_name: string;
  gender: "male" | "female";
  birth_date: string;
  password: string;
  phone: string;
  email: string;
  address: string;
  customer_type: "regular" | "member" | "vip";
};

export type customerDatas = {
  id: string;
  full_name: string;
  gender: "male" | "female";
  birth_date: string;
  isActive: boolean;
  isDeleted: boolean;
  phone: string;
  email: string;
  customer_type: "regular" | "member" | "vip";
  total_spent: string;
  createdAt: string;
  updatedAt: string;
};

export type customerData = {
  id: string;
  full_name: string;
  gender: "male" | "female";
  birth_date: string;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  phone: string;
  email: string;
  customer_type: "regular" | "member" | "vip";
  total_spent: string;
  createdAt: string;
  updatedAt: string;
  address: "string";
};

export type UpdateCustomerProps = {
  isVerified: boolean;
  full_name: string;
  gender: "male" | "female";
  birth_date: string;
  phone: string;
  email: string;
  address: string;
  customer_type: "regular" | "member" | "vip";
  total_spent: number;
  isActive: boolean;
};

export type CreateStaffProps = {
  full_name: string;
  phone?: string;
  gender: string;
  password: string;
  email: string;
  isActive: boolean;
  positionID: string;
};

export type StaffDatas = {
  id: string;
  full_name: string;
  email: string;
  gender: string;
  avatar?: string;
  phone?: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StaffData = {
  id: string;
  full_name: string;
  email: string;
  gender: string;
  avatar?: string;
  phone?: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateStaffProps = {
  full_name: string;
  password: string;
  email: string;
  isActive: boolean;
  avatar?: string;
  phone?: string;
};

export type CreateDoctorProps = {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  isActive: boolean;
  biography: string;
  specialization: string;
  experience_years: number;
  serviceIds: string[] | null;
};

export type DoctorDatas = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  biography: string;
  isActive: boolean;
  experience_years: number;
  createdAt: string;
  updatedAt: string;
  services:
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export type DoctorData = {
  id: string;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  biography: string;
  specialization: string;
  refreshToken: string;
  experience_years: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  isActive: true;
  services:
    | {
        id: string;
        name: string;
      }[]
    | null;
};

export type UpdateDoctorProps = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  biography: string;
  isActive: boolean;
  experience_years: number;
};

export const accountApi = createApi({
  reducerPath: "accountApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
    getCustomers: build.mutation<customerDatas[], void>({
      query: () => ({
        url: "/account/customers",
        method: "Get",
      }),
    }),

    createCustomer: build.mutation({
      query: (customerData) => ({
        url: "/account/create-customer",
        method: "Post",
        data: customerData,
      }),
    }),

    getCustomerById: build.query<customerData, string>({
      query: (id) => ({
        url: `/account/customer/${id}`,
        method: "Get",
      }),
    }),

    updateCustomer: build.mutation<
      {
        id: string;
        email: string;
        name: string;
        role: string;
        spaId: string;
        phone: string;
      },
      { id: string; customerData: UpdateCustomerProps }
    >({
      query: ({ id, customerData }) => ({
        url: `/account/customer/${id}`,
        method: "Patch",
        data: customerData,
      }),
    }),

    deleteCustomer: build.mutation<customerData, string>({
      query: (id) => ({
        url: `/account/customer/${id}`,
        method: "Delete",
      }),
    }),

    disableCustomer: build.mutation<customerData, { id: string }>({
      query: ({ id }) => ({
        url: `/account/customer/${id}/active`,
        method: "Patch",
      }),
    }),

    getStaffs: build.mutation<StaffDatas[], void>({
      query: () => ({
        url: `/account/internals`,
        method: "Get",
      }),
    }),

    createStaff: build.mutation<StaffData, CreateStaffProps>({
      query: (staffData) => ({
        url: "/account/create-internal",
        method: "Post",
        data: staffData,
      }),
    }),

    getStaffById: build.query<StaffData, string>({
      query: (id) => ({
        url: `/account/internals/${id}`,
        method: "Get",
      }),
    }),

    updateStaff: build.mutation<
      StaffData,
      { id: string; staffData: UpdateStaffProps }
    >({
      query: ({ id, staffData }) => ({
        url: `/account/internals/${id}`,
        method: "Patch",
        data: staffData,
      }),
    }),

    deleteStaff: build.mutation<StaffData, string>({
      query: (id) => ({
        url: `/account/internals/${id}`,
        method: "Delete",
      }),
    }),

    getAllRoles: build.mutation<
      { id: string; name: string; description: string }[],
      void
    >({
      query: () => ({
        url: "/account/internals/roles/all",
        method: "Get",
      }),
    }),

    getDoctors: build.mutation<DoctorData[], void>({
      query: () => ({
        url: "/account/doctors",
        method: "Get",
      }),
    }),

    createDoctor: build.mutation({
      query: (doctorData: CreateDoctorProps) => ({
        url: "/account/create-doctor",
        method: "Post",
        data: doctorData,
      }),
    }),

    getDoctorById: build.query<DoctorData, string>({
      query: (id) => ({
        url: `/account/doctors/${id}`,
        method: "Get",
      }),
    }),

    updateDoctor: build.mutation<
      DoctorData,
      { id: string; specialData: UpdateDoctorProps }
    >({
      query: ({ id, specialData }) => ({
        url: `/account/doctors/${id}`,
        method: "Patch",
        data: specialData,
      }),
    }),

    deleteDoctor: build.mutation<DoctorData, string>({
      query: (id) => ({
        url: `/account/doctors/${id}`,
        method: "Delete",
      }),
    }),
  }),
});

export const {
  useGetCustomersMutation,
  useCreateCustomerMutation,
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useDisableCustomerMutation,

  useGetStaffsMutation,
  useCreateStaffMutation,
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetAllRolesMutation,
  // useDisableStaffMutation,

  useGetDoctorsMutation,
  useCreateDoctorMutation,
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
} = accountApi;
