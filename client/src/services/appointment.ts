import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export type AppointmentProps = {
  id: string;
  customerId: string;
  doctorId: string | null;
  staffId: string | null;
  appointment_date: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  voucherId: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  startTime: string;
  endTime: string;
  note: string;
  doctor: {
    id: string;
    avatar: string | null;
    full_name: string;
    gender: string;
    email: string;
    phone: string | null;
    biography: null;
    specialization: string;
    experience_years: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: null;
    isActive: true;
    isVerified: false;
  };
  details: {
    id: string;
    appointmentId: string;
    serviceId: string;
    quantity: number;
    price: string;
    service: {
      id: string;
      name: string;
      price: number;
      images: {
        url: string;
      }[];
      description: string;
      categoryId: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      isActive: boolean;
    }[];
  }[];
  customer: {
    id: string;
    avatar: string | null;
    full_name: string;
    gender: "male" | "female" | "other";
    birth_date: string;
    password: string;
    refreshToken: string;
    email: string;
    phone: string;
    address: string | null;
    customer_type: "regular" | "vip" | "premium";
    total_spent: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: null;
    membershipId: null;
    isActive: true;
    isVerified: false;
  };
  staff: null;
};

export type CreateAppointmentProps = {
  customerId: string;
  doctorId: string | null;
  staffId: string | null;
  appointment_date: string;
  startTime: string;
  endTime: string;
  details: {
    serviceId: string;
    price: number;
  }[];
  note: string;
  voucherId: string | null;
};

export const appointmentApi = createApi({
  reducerPath: "appointmentApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
    createAppointment: build.mutation<
      {
        id: string;
      },
      CreateAppointmentProps
    >({
      query: (data) => ({
        url: "/appointment",
        method: "POST",
        body: data,
      }),
    }),

    getAppointmentsByCustomer: build.mutation<
      AppointmentProps[],
      { customerId: string }
    >({
      query: ({ customerId }) => ({
        url: `/appointment/customer`,
        method: "GET",
        params: {
          customerId,
        },
      }),
    }),

    getAppointmentsForManagement: build.mutation<AppointmentProps[], void>({
      query: () => ({
        url: `/appointment/management`,
        method: "GET",
      }),
    }),

    updateAppointmentStatusConfirmed: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}/confirm`,
        method: "PATCH",
      }),
    }),

    updateAppointmentStatusImported: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}/imported`,
        method: "PATCH",
      }),
    }),

    updateAppointmentStatusApproved: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}/approve`,
        method: "PATCH",
      }),
    }),

    updateAppointmentStatusRejected: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}/reject`,
        method: "PATCH",
      }),
    }),

    createLinkPayment: build.mutation<
      { checkoutUrl: string },
      {
        appointmentId: string;
        amount: number;
        description: string;
        returnUrl: string;
        cancelUrl: string;
        customerName: string;
      }
    >({
      query: (data) => ({
        url: `/payment/create-link`,
        method: "POST",
        body: data,
      }),
    }),

    updatePaymentStatus: build.mutation<
      void,
      { orderCode: string; status: "PAID" | "CANCELLED" }
    >({
      query: (data) => ({
        url: `/payment/update-status`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateAppointmentMutation,
  useGetAppointmentsByCustomerMutation,
  useCreateLinkPaymentMutation,
  useUpdatePaymentStatusMutation,

  useUpdateAppointmentStatusConfirmedMutation,
  useUpdateAppointmentStatusImportedMutation,
  useUpdateAppointmentStatusApprovedMutation,
  useUpdateAppointmentStatusRejectedMutation,

  useGetAppointmentsForManagementMutation,
} = appointmentApi;
