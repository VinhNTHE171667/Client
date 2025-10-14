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

export type CreateSpaProps = {
  name: string;
  password: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  description: string;
  isActive: true;
};

export type SpaDatas = {
  id: string;
  name: string;
  image: string | null;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  logo: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  membership: {
    id: string;
    level: string;
    price: number;
    levelNumber: number;
  };
};

export type SpaData = {
  id: string;
  name: string;
  image: string | null;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  logo: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpaMembership = {
  id: string;
  level: string;
  price: number;
  levelNumber: number;
};

export type UpdateSpaProps = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  description: string;
  isActive: true;
};

export type CreateSpaAdminProps = {
  spaId: string;
  name: string;
  password: string;
  email: string;
  isActive: boolean;
};

export type SpaAdminDatas = {
  id: string;
  spaId: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SpaAdminData = {
  id: string;
  spaId: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSpaAdminProps = {
  spaId: string;
  name: string;
  email: string;
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

export type CreateSpecialistProps = {
  spaId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  bio: string;
  isActive: boolean;
  yearsOfExperience: number;
};

export type SpecialistDatas = {
  id: string;
  spaId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  bio: string;
  isActive: boolean;
  yearsOfExperience: number;
  createdAt: string;
  updatedAt: string;
};

export type SpecialistData = {
  id: string;
  spaId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  bio: string;
  isActive: boolean;
  yearsOfExperience: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSpecialistProps = {
  spaId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  bio: string;
  isActive: boolean;
  yearsOfExperience: number;
};

export type UpdateMembershipProps = {
  price: number;
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

    getSpas: build.mutation<SpaDatas[], void>({
      query: () => ({
        url: "/account/spas",
        method: "Get",
      }),
    }),

    getSpaById: build.query<SpaData, string>({
      query: (id) => ({
        url: `/account/spa/${id}`,
        method: "Get",
      }),
    }),

    createSpa: build.mutation<SpaData, CreateSpaProps>({
      query: (spaData) => ({
        url: "/account/create-spa",
        method: "Post",
        data: spaData,
      }),
    }),

    updateSpa: build.mutation<SpaData, { id: string; spaData: UpdateSpaProps }>(
      {
        query: ({ id, spaData }) => ({
          url: `/account/spa/${id}`,
          method: "Patch",
          data: spaData,
        }),
      }
    ),

    deleteSpa: build.mutation<SpaData, string>({
      query: (id) => ({
        url: `/account/spa/${id}`,
        method: "Delete",
      }),
    }),

    disableSpa: build.mutation<SpaData, { id: string }>({
      query: ({ id }) => ({
        url: `/account/spa/${id}/active`,
        method: "Patch",
      }),
    }),

    getSpaAdmin: build.mutation<SpaAdminDatas[], string>({
      query: (id) => ({
        url: `/account/spa-admins/`,
        method: "Get",
        params: { spaId: id },
      }),
    }),

    getAllMemberships: build.query<SpaMembership[], void>({
      query: () => ({
        url: "/account/get-all-spa-memberships",
        method: "Get",
      }),
    }),

    updateMembership: build.mutation<
      SpaMembership,
      { id: string; data: UpdateMembershipProps }
    >({
      query: ({ id, data }) => ({
        url: `/account/${id}/upgrade-membership`,
        method: "Patch",
        data,
      }),
    }),

    createLinkMembership: build.mutation<void, unknown>({
      query: (data) => ({
        url: `/payment/create-link`,
        method: "Post",
        data: data,
      }),
    }),

    updatePaymentStatus: build.mutation<
      void,
      { orderCode: string; status: "PAID" | "CANCELLED" }
    >({
      query: (data) => ({
        url: `/payment/update-status`,
        method: "Post",
        data,
      }),
    }),

    createSpaAdmin: build.mutation<SpaAdminData, CreateSpaAdminProps>({
      query: (spaAdminData) => ({
        url: "/account/create-spa-admin",
        method: "Post",
        data: spaAdminData,
      }),
    }),

    getSpaAdminById: build.query<SpaAdminData, string>({
      query: (id) => ({
        url: `/account/spa-admin/${id}`,
        method: "Get",
      }),
    }),

    updateSpaAdmin: build.mutation<
      SpaAdminData,
      { id: string; spaAdminData: UpdateSpaAdminProps }
    >({
      query: ({ id, spaAdminData }) => ({
        url: `/account/spa-admins/${id}`,
        method: "Patch",
        data: spaAdminData,
      }),
    }),

    deleteSpaAdmin: build.mutation<SpaAdminData, string>({
      query: (id) => ({
        url: `/account/spa-admins/${id}`,
        method: "Delete",
      }),
    }),

    disableSpaAdmin: build.mutation<SpaAdminData, { id: string }>({
      query: ({ id }) => ({
        url: `/account/spa-admins/${id}/active`,
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

    getSpecialists: build.mutation<SpecialistData[], string>({
      query: (id) => ({
        url: "/account/specialists",
        method: "Get",
        params: { spaId: id },
      }),
    }),

    createSpecialists: build.mutation<SpecialistData, CreateSpecialistProps>({
      query: (specialData) => ({
        url: "/account/create-specialist",
        method: "Post",
        data: specialData,
      }),
    }),

    getSpecialistById: build.query<SpecialistData, string>({
      query: (id) => ({
        url: `/account/specialists/${id}`,
        method: "Get",
      }),
    }),

    updateSpecialist: build.mutation<
      SpecialistData,
      { id: string; specialData: UpdateSpecialistProps }
    >({
      query: ({ id, specialData }) => ({
        url: `/account/specialists/${id}`,
        method: "Patch",
        data: specialData,
      }),
    }),

    deleteSpecialist: build.mutation<SpecialistData, string>({
      query: (id) => ({
        url: `/account/specialists/${id}`,
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

  useGetSpasMutation,
  useGetSpaByIdQuery,
  useCreateSpaMutation,
  useUpdateSpaMutation,
  useDeleteSpaMutation,
  useDisableSpaMutation,
  useGetAllMembershipsQuery,
  useUpdateMembershipMutation,
  useCreateLinkMembershipMutation,
  useUpdatePaymentStatusMutation,

  useGetSpaAdminMutation,
  useCreateSpaAdminMutation,
  useGetSpaAdminByIdQuery,
  useUpdateSpaAdminMutation,
  useDeleteSpaAdminMutation,
  useDisableSpaAdminMutation,

  useGetStaffsMutation,
  useCreateStaffMutation,
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useGetAllRolesMutation,
  // useDisableStaffMutation,

  useGetSpecialistsMutation,
  useCreateSpecialistsMutation,
  useGetSpecialistByIdQuery,
  useUpdateSpecialistMutation,
  useDeleteSpecialistMutation,
} = accountApi;
