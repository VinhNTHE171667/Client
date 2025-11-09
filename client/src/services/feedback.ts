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
  }),
});

export const { useCreateFeedbacksMutation } = feedbackApi;
