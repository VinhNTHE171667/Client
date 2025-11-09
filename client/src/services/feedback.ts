import type { feedbackStatus } from "@/common/types/auth";
import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface SingleFeedback {
  appointmentId: string;
  customerId: string;
  serviceId: string;
  rating: number;
  comment?: string;
}

export interface MultipleFeedbacks {
  feedbacks: SingleFeedback[];
}

export interface FeedbackResponse {
  id: string;
  rating: string;
  comment: string;
  status: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    price: number;
    images: {
      url: string;
    }[];
    description: string;
    categoryId: string;
  };
}

export interface FeedbackManagementResponse {
  id: string;
  appointmentId: string;
  customerId: string;
  serviceId: string;
  rating: number;
  comment: string;
  status: keyof typeof feedbackStatus;
  customer: {
    id: string;
    avatar: string | null;
    full_name: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    images: {
      url: string;
    }[];
  };
}

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";

export const feedbackApi = createApi({
  reducerPath: "feedbackApi",
  baseQuery: axiosBaseQuery({ baseUrl }),
  endpoints: (build) => ({
    createFeedbacks: build.mutation<void, MultipleFeedbacks>({
      query: (data) => ({
        url: "/feedback/bulk",
        method: "POST",
        data,
      }),
    }),

    findByAppointment: build.mutation<FeedbackResponse[], string>({
      query: (appointmentId) => ({
        url: `/feedback/appointment/${appointmentId}`,
        method: "GET",
      }),
    }),

    getAllFeedbacks: build.mutation<FeedbackManagementResponse[], void>({
      query: () => ({
        url: `/feedback/`,
        method: "GET",
      }),
    }),

    approveFeedback: build.mutation<void, string>({
      query: (id) => ({
        url: `/feedback/${id}/approve`,
        method: "PATCH",
      }),
    }),

    rejectFeedback: build.mutation<void, string>({
      query: (id) => ({
        url: `/feedback/${id}/reject`,
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useCreateFeedbacksMutation,
  useFindByAppointmentMutation,
  useGetAllFeedbacksMutation,

  useApproveFeedbackMutation,
  useRejectFeedbackMutation,
} = feedbackApi;
