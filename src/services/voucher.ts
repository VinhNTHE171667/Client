import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";
import dayjs from "dayjs";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export interface VoucherFormValues extends CreateVoucherProps {
  validRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

export type voucherDatas = {
  id: string;
  code: string;
  description: string;
  discountAmount: number;
  discountPercent: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
};

export type CreateVoucherProps = {
  code: string;
  description: string;
  discountAmount: number;
  discountPercent: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  customerIds?: string[];
};

export type voucherData = {
  id: string;
  code: string;
  description: string;
  discountAmount: number;
  discountPercent: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  customerIds?: string[];
};

/* ------------------------- Voucher Category Types ------------------------ */
export type VoucherCategory = {
  id: string;
  name: string;
  prefix: string;  // Updated to match CategoryVoucher entity
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
};

export type CreateVoucherCategoryProps = {
  name: string;
  prefix: string;
  isActive?: boolean;
};

export const voucherApi = createApi({
  reducerPath: "voucherApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  tagTypes: ["VoucherCategory"],  // Optional: Add for invalidation if needed
  endpoints: (build) => ({
    /* ------------------------------ VOUCHER ------------------------------ */
    getVouchers: build.mutation<voucherDatas[], void>({
      query: () => ({
        url: "/voucher",
        method: "Get",
      }),
    }),

    createVoucher: build.mutation<void, CreateVoucherProps>({
      query: (body) => ({
        url: "/voucher",
        method: "Post",
        data: body,
      }),
    }),

    getVoucherById: build.query<voucherData, string>({
      query: (id) => ({
        url: `/voucher/${id}`,
        method: "Get",
      }),
    }),

    updateVoucher: build.mutation<
      void,
      { id: string; body: CreateVoucherProps }
    >({
      query: ({ id, body }) => ({
        url: `/voucher/${id}`,
        method: "Patch",
        data: body,
      }),
    }),

    deleteVoucher: build.mutation<void, string>({
      query: (id) => ({
        url: `/voucher/${id}`,
        method: "Delete",
      }),
    }),

    findVouchersByCustomer: build.mutation<voucherDatas[], string>({
      query: (customerId) => ({
        url: `/voucher/customers/${customerId}`,
        method: "Get",
      }),
    }),

    /* ------------------------ VOUCHER CATEGORY APIs ----------------------- */
    getVoucherCategories: build.query<VoucherCategory[], void>({
      query: () => ({
        url: "/category-voucher",  // <- Fixed: Matches backend @Controller('category-voucher')
        method: "Get",
      }),
      // providesTags: ["VoucherCategory"],  // Optional: For cache invalidation
    }),

    createVoucherCategory: build.mutation<
      void,
      CreateVoucherCategoryProps
    >({
      query: (body) => ({
        url: "/category-voucher",  // <- Fixed
        method: "Post",
        data: body,
      }),
      // invalidatesTags: ["VoucherCategory"],  // Optional: Refetch list after create
    }),

    getVoucherCategoryById: build.query<VoucherCategory, string>({
      query: (id) => ({
        url: `/category-voucher/${id}`,  
        method: "Get",
      }),
    }),

    updateVoucherCategory: build.mutation<
      void,
      { id: string; body: CreateVoucherCategoryProps }
    >({
      query: ({ id, body }) => ({
        url: `/category-voucher/${id}`, 
        method: "Put",
        data: body,
      }),
    }),

    deleteVoucherCategory: build.mutation<void, string>({
      query: (id) => ({
        url: `/category-voucher/${id}`,  // <- Fixed
        method: "Delete",
      }),
    }),
  }),
});

export const {
  useGetVouchersMutation,
  useCreateVoucherMutation,
  useGetVoucherByIdQuery,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useFindVouchersByCustomerMutation,

  useGetVoucherCategoriesQuery,
  useCreateVoucherCategoryMutation,
  useGetVoucherCategoryByIdQuery,
  useUpdateVoucherCategoryMutation,
  useDeleteVoucherCategoryMutation,
} = voucherApi;