import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

// Default to VITE_PUBLIC_API if provided, otherwise use localhost:3001 for local development
const baseUrl = import.meta.env.VITE_PUBLIC_API || "http://localhost:3001";

export type CategoryData = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategory = {
  name: string;
  description?: string;
};

export type ServiceData = {
  id: string;
  name: string;
  price: number;
  images:
    | {
        alt: string;
        url: string;
      }[]
    | [];
  description: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  category: CategoryData;
  doctors: {
    id: string;
    name: string;
    avatar: string | null;
    specialization: string;
    biography: string | null;
    experience_years: number | null;
  }[];
};

export type PublicService = {
  id: string;
  name: string;
  price: number;
  images:
    | {
        alt: string;
        url: string;
      }[]
    | [];
  description: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  doctors: {
    id: string;
    name: string;
    avatar: string | null;
    specialization: string;
    biography: string;
    experience_years: string;
  }[];
  feedbacks: {
    rating: number;
    comment: string;
    customer: {
      id: string;
      full_name: string;
      avatar: string | null;
    };
    createdAt: string;
  }[];
  feedbacksCount: number;
};

export type CreateService = {
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  isActive?: boolean;
};

export type CreateAppointment = {
  customerId: string;
  serviceId: string;
  appointmentTime: string;
  status: string;
  note: string;
};

export type AppointmentData = {
  id: string;
  appointmentTime: string;
  status: string;
  note: string;
  customerId: string;
  staffId: string | null;
  createdAt: string;
  updatedAt: string;
  serviceId: string;
  specialistId: string | null;
  customerName: string | null;
  staffName: string | null;
  spaName: string | null;
  serviceName: string | null;
  specialistName: string | null;
  isDone: boolean;
};

export type UpdateAppointment = {
  customerId: string;
  spaId: string;
  serviceId: string;
  staffId: string | null;
  specialistId: string | null;
  appointmentTime: string;
  status: string;
  note?: string;
};

export type UpdateCompletedAppointment = {
  services: {
    serviceId: string;
    quantity: number;
    note: string | null;
  }[];
};

export type InvoiceData = {
  id: string;
  totalAmount: number;
  note: string | null;
  customerId: string;
  spaId: string;
  createdAt: string;
  updatedAt: string;
  appointmentId: string;
  voucherId: string | null;
  discountAmount: number;
  finalAmount: number;
  status: string;
  deletedAt: string | null;
  details: {
    id: string;
    invoiceId: string;
    serviceId: string;
    serviceName: string;
    quantity: number;
    price: number;
    note: string | null;
  }[];
  customerName: string | null;
  spaName: string | null;
};

export type DoctorListProps = {
  id: string;
  avatar: string | null;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  password: string;
  refreshToken: string;
  biography: string | null;
  specialization: string;
  experience_years: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isActive: boolean;
  isVerified: boolean;
};

export const serviceApi = createApi({
  reducerPath: "serviceApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({
    createCategory: build.mutation<CategoryData, CreateCategory>({
      query: (category: CreateCategory) => ({
        url: "/category",
        method: "Post",
        data: category,
      }),
    }),

    getCategories: build.mutation<CategoryData[], void>({
      query: () => ({
        url: "/category",
        method: "Get",
      }),
    }),

    getCategoryById: build.query<CategoryData, string>({
      query: (id) => ({
        url: `/category/${id}`,
        method: "Get",
      }),
    }),

    updateCategory: build.mutation<
      CategoryData,
      { id: string; data: CreateCategory }
    >({
      query: ({ id, data }) => ({
        url: `/category/${id}`,
        method: "Put",
        data,
      }),
    }),

    deleteCategory: build.mutation<void, string>({
      query: (id) => ({
        url: `/category/${id}`,
        method: "Delete",
      }),
    }),

    createService: build.mutation<ServiceData, FormData>({
      query: (formData) => ({
        url: "/service",
        method: "Post",
        body: formData,
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // },
      }),
    }),

    getServices: build.mutation<ServiceData[], void>({
      query: () => ({
        url: "/service",
        method: "Get",
      }),
    }),

    getServiceById: build.query<ServiceData, string>({
      query: (id) => ({
        url: `/service/${id}`,
        method: "Get",
      }),
    }),

    updateService: build.mutation<CategoryData, { id: string; data: FormData }>(
      {
        query: ({ id, data }) => ({
          url: `/service/${id}`,
          method: "Put",
          body: data,
        }),
      }
    ),

    deleteService: build.mutation<void, string>({
      query: (id) => ({
        url: `/service/${id}`,
        method: "Delete",
      }),
    }),

    getPublicServices: build.mutation<PublicService[], void>({
      query: () => ({
        url: `/service/public`,
        method: "Get",
      }),
    }),

    getPublicServiceById: build.query<PublicService, string>({
      query: (id) => ({
        url: `/service/public/${id}`,
        method: "Get",
      }),
    }),

    getPublicServiceByDoctor: build.mutation<PublicService[], string>({
      query: (doctorId) => ({
        url: `/service/public/doctor/${doctorId}`,
        method: "Get",
      }),
    }),

    getPublicDoctorList: build.mutation<DoctorListProps[], void>({
      query: () => ({
        url: `/service/public/doctors/`,
        method: "Get",
      }),
    }),
  }),
});

export const {
  useCreateCategoryMutation,
  useGetCategoriesMutation,
  useGetCategoryByIdQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,

  useCreateServiceMutation,
  useGetServicesMutation,
  useGetServiceByIdQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,

  useGetPublicServicesMutation,
  useGetPublicServiceByIdQuery,
  useGetPublicServiceByDoctorMutation,

  useGetPublicDoctorListMutation,
} = serviceApi;
