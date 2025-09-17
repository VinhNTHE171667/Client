import { axiosBaseQuery } from "@/libs/axios/axiosBase";
import { createApi } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_PUBLIC_API || "";



export const serviceApi = createApi({
  reducerPath: "serviceApi",
  baseQuery: axiosBaseQuery({
    baseUrl,
  }),
  endpoints: (build) => ({

  }),
});

export const {

} = serviceApi;
