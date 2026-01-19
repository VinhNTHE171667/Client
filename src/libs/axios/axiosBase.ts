import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import { AxiosError, type AxiosRequestConfig } from "axios";
import { axiosPublic } from "@/libs/axios/axiosPublic";
import { axiosAuth } from "@/libs/axios/axiosAuth";

interface AxiosBaseQueryProps {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
  authRequired?: boolean;
}

export const axiosBaseQuery =
  <T extends Record<string, unknown> = Record<string, unknown>>({
    baseUrl,
  }: {
    baseUrl: string;
  }): BaseQueryFn<AxiosBaseQueryProps & T, unknown, unknown> =>
  async ({
    url,
    method,
    data,
    params,
    authRequired = false,
    headers,
    body,
    ...config
  }: AxiosBaseQueryProps & T) => {
    try {
      const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;

      const instance = authRequired ? axiosAuth : axiosPublic;

      const result = await instance({
        url: `${baseUrl}${url}`,
        method,
        data: body ?? data,
        params,
        headers: isFormData
          ? headers
          : {
              "Content-Type": "application/json",
              ...headers,
            },
        ...config,
      });

      return {
        data: result.data,
        status: result.status as number,
      };
    } catch (axiosError) {
      const err = axiosError as AxiosError;

      if (!err.response) {
        return {
          error: {
            status: 500,
            data: null,
            message: "Network error. Please check your connection.",
          },
        };
      }

      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      const data = err.response.data;

      if (typeof data === "object" && data !== null && "message" in data) {
        const msg = (data as { message?: string | string[] }).message;
        if (Array.isArray(msg)) {
          errorMessage = msg.length > 0 ? msg.join(", ") : "Lỗi không xác định";
        } else if (typeof msg === "string") {
          errorMessage = msg;
        }
      }

      return {
        error: {
          status: err.response.status,
          data: err.response.data,
          message: errorMessage,
        },
      };
    }
  };
