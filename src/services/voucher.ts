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

export const voucherApi = createApi({
  reducerPath: "voucherApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
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
  }),
});

export const {
  useGetVouchersMutation,
  useCreateVoucherMutation,
  useGetVoucherByIdQuery,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,

  useFindVouchersByCustomerMutation,
} = voucherApi;
