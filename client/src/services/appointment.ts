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
  rejectionReason: string | null;
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
    };
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
  appointmentType: "online" | "offline";
  totalAmount: number | 0;
  depositAmount: number | 0;
  orderCode: string | null;
  isFeedbackGiven: boolean;
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
  totalAmount: number | 0;
  membershipDiscount?: number;
};

export type InvoiceProps = {
  id: string;
  customerId: string;
  appointmentId: string;
  total_amount: number;
  status: "confirmed" | "pending" | "cancelled";
  payment_status: "paid";
  invoice_type: "final" | "deposit";
  payment_method: "qr";
  createdAt: string;
  updatedAt: string;
  voucherId: string;
  total: number;
  discount: number;
  finalAmount: number;
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
    address: string;
    customer_type: string;
    total_spent: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    membershipId: string | null;
    isActive: boolean;
    isVerified: boolean;
    resetToken: string | null;
    resetTokenExpire: string | null;
    emailVerificationToken: string | null;
    emailVerificationTokenExpire: string | null;
    isEmailVerified: boolean;
  };
  appointment: {
    id: string;
    customerId: string;
    doctorId: string;
    staffId: string;
    appointment_date: string;
    status: "paid";
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    voucherId: string;
    cancelledAt: string | null;
    cancelReason: string | null;
    rejectionReason: string | null;
    startTime: string;
    endTime: string;
    note: string;
    orderCode: number;
    appointmentType: "online" | "offline";
    paymentMethod: "qr" | "cash";
    totalAmount: number;
    depositAmount: number;
    isFeedbackGiven: boolean;
    staff: {
      id: string;
      avatar: string;
      full_name: string;
      gender: "male" | "female" | "other";
      email: string;
      phone: string;
      password: string;
      refreshToken: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      isActive: boolean;
      isVerified: boolean;
    };
  };
  details: {
    id: string;
    invoiceId: string;
    serviceId: string;
    quantity: number;
    price: number;
    service: {
      id: string;
      name: string;
      price: number;
      images: { url: string }[];
      description: string;
      categoryId: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      isActive: boolean;
    };
  }[];
};

export type DoctorRequestCancelProps = {
  id: string;
  doctorId: string;
  appointmentId: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  appointment: {
    id: string;
    customerId: string;
    doctorId: string;
    staffId: string | null;
    appointment_date: string;
    status: keyof AppointmentProps["status"];
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    voucherId: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    rejectionReason: string | null;
    startTime: string;
    endTime: string;
    note: string;
    orderCode: number;
    appointmentType: "online" | "offline";
    paymentMethod: "qr" | "cash";
    totalAmount: string;
    depositAmount: string;
    isFeedbackGiven: false;
    staff: {
      id: string;
      avatar: string | null;
      full_name: string;
      gender: string;
      email: string;
      phone: string | null;
      password: string;
      refreshToken: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      isActive: boolean;
      isVerified: boolean;
    };
  };
  doctor: {
    id: string;
    avatar: string | null;
    full_name: string;
    gender: string;
    email: string;
    phone: string | null;
    password: string;
    refreshToken: string;
    biography: string | null;
    specialization: string;
    experience_years: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    isActive: boolean;
    isVerified: boolean;
  };
};

export type PaymentStatsDto = {
  fromDate?: string; 
  toDate?: string;
};

export type CashierStats = {
  cashierId: string | null;
  name: string;
  total: number;
};

export type PaymentStatsResponse = {
  totalCash: number;
  totalTransfer: number;
  totalCollected: number;
  cashiers: CashierStats[];
  fromDate: string | null;
  toDate: string | null;
  countInvoices: number;
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

    updateAppointment: build.mutation<
      { id: string },
      { appointmentId: string; data: Partial<CreateAppointmentProps> }
    >({
      query: ({ appointmentId, data }) => ({
        url: `/appointment/${appointmentId}`,
        method: "PUT",
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

    getAppointmentsBookedByDoctor: build.mutation<
      {
        id: string;
        startTime: string;
        endTime: string;
        status: string;
      }[],
      { doctorId: string }
    >({
      query: ({ doctorId }) => ({
        url: `/appointment/doctor-schedule-booked`,
        method: "GET",
        params: {
          doctorId,
        },
      }),
    }),

    getAppointmentsBookedByCustomer: build.mutation<
      {
        id: string;
        startTime: string;
        endTime: string;
        status: string;
      }[],
      { customerId: string }
    >({
      query: ({ customerId }) => ({
        url: `/appointment/customer-schedule-booked`,
        method: "GET",
        params: {
          customerId,
        },
      }),
    }),

    getAppointmentsManagedByDoctor: build.mutation<
      AppointmentProps[],
      { doctorId: string }
    >({
      query: ({ doctorId }) => ({
        url: `/appointment/doctor-schedule-managed`,
        method: "GET",
        params: {
          doctorId,
        },
      }),
    }),

    getAppointmentsForManagement: build.mutation<AppointmentProps[], void>({
      query: () => ({
        url: `/appointment/management`,
        method: "GET",
      }),
    }),

    getAppointmentById: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}`,
        method: "GET",
      }),
    }),

    updateAppointmentStatusConfirmed: build.mutation<
      AppointmentProps,
      { appointmentId: string; staff: { id: string } }
    >({
      query: ({ appointmentId, staff: { id } }) => ({
        url: `/appointment/${appointmentId}/confirm`,
        method: "PATCH",
        body: { staff: { id } },
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
    requestCompleteAppointment: build.mutation<
      { success: boolean; message: string },
      { appointmentId: string; staffName: string }
    >({
      query: ({ appointmentId, staffName }) => ({
        url: `/appointment/${appointmentId}/request-complete`,
        method: 'PATCH',
        body: { staffName },
      })
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
      { appointmentId: string; reason: string }
    >({
      query: ({ appointmentId, reason }) => ({
        url: `/appointment/${appointmentId}/reject`,
        method: "PATCH",
        body: { reason },
      }),
    }),

    updateAppointmentMutationCancel: build.mutation<
      AppointmentProps,
      { appointmentId: string; reason: string }
    >({
      query: ({ appointmentId, reason }) => ({
        url: `/appointment/${appointmentId}/cancel`,
        method: "PATCH",
        body: { reason },
      }),
    }),

    updateAppointmentMutationComplete: build.mutation<
      AppointmentProps,
      { appointmentId: string }
    >({
      query: ({ appointmentId }) => ({
        url: `/appointment/${appointmentId}/completed`,
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

    updatePaymentStatusDeposited: build.mutation<
      void,
      {
        orderCode: string;
      }
    >({
      query: (data) => ({
        url: `/payment/update-status-deposited`,
        method: "POST",
        body: data,
      }),
    }),

    updatePaymentStatusPaid: build.mutation<
      void,
      {
        orderCode: string;
      }
    >({
      query: (data) => ({
        url: `/payment/update-status-paid`,
        method: "POST",
        body: data,
      }),
    }),

    getInvoice: build.mutation<InvoiceProps[], void>({
      query: () => ({
        url: `/payment/invoice`,
        method: "GET",
      }),
    }),

    doctorRequestCancelBulk: build.mutation<
      void,
      { appointmentIds: string[]; doctorId: string; reason: string }
    >({
      query: ({ appointmentIds, doctorId, reason }) => ({
        url: `/appointment/request-cancel`,
        method: "POST",
        body: { appointmentIds, doctorId, reason },
      }),
    }),

    getDoctorCancelRequests: build.mutation<DoctorRequestCancelProps[], void>({
      query: () => ({
        url: `/appointment/request-cancel/pending`,
        method: "GET",
      }),
    }),

    approveDoctorCancelRequest: build.mutation<void, { requestId: string }>({
      query: ({ requestId }) => ({
        url: `/appointment/request-cancel/approve/${requestId}`,
        method: "POST",
      }),
    }),

    rejectDoctorCancelRequest: build.mutation<void, { requestId: string }>({
      query: ({ requestId }) => ({
        url: `/appointment/request-cancel/reject/${requestId}`,
        method: "POST",
      }),
    }),

    getPaymentStats: build.mutation<PaymentStatsResponse, PaymentStatsDto>({
      query: (dto) => ({
        url: `/payment/stats`,
        method: "GET",
        params: dto, 
      })
   }),
  }),
});

export const {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useGetAppointmentsByCustomerMutation,
  useGetAppointmentByIdMutation,
  useCreateLinkPaymentMutation,

  useUpdatePaymentStatusDepositedMutation,
  useUpdatePaymentStatusPaidMutation,

  useUpdateAppointmentStatusConfirmedMutation,
  useUpdateAppointmentMutationCancelMutation,
  useUpdateAppointmentStatusApprovedMutation,
  useUpdateAppointmentStatusRejectedMutation,
  useUpdateAppointmentMutationCompleteMutation,

  useGetAppointmentsManagedByDoctorMutation,
  useGetAppointmentsBookedByDoctorMutation,
  useGetAppointmentsBookedByCustomerMutation,
  useGetAppointmentsForManagementMutation,

  useGetInvoiceMutation,

  useDoctorRequestCancelBulkMutation,
  useGetDoctorCancelRequestsMutation,
  useApproveDoctorCancelRequestMutation,
  useRejectDoctorCancelRequestMutation,
  useGetPaymentStatsMutation,
  useRequestCompleteAppointmentMutation
} = appointmentApi;
