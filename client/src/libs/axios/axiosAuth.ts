/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
// Uncomment if you have logout action
// import { logout } from '@/libs/features/auth/authSlice';

let isRefreshing = false;
let failedQueue: any[] = []; // Queue holding requests while refreshing the token=

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const axiosAuth = axios.create({
  // headers: {
  //   "Content-Type": "application/json",
  // },
  timeout: 120000,
});

// Add request interceptor to attach access token to headers
axiosAuth.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 responses and refresh token logic
axiosAuth.interceptors.response.use(
  (response) => response, // Return response directly if no error
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check if the error is 401 and not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, push the request into queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest && originalRequest.headers) {
              originalRequest.headers["Authorization"] = "Bearer " + token;
            }
            return axiosAuth(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get("refreshToken");
        console.log(refreshToken);
        if (!refreshToken) {
          // Uncomment this if you have logout logic

          // store.dispatch(logout());
          // navigave(configError.UnAuthorize);
          handleLogout();
          return Promise.reject(error);
        }

        // Request new access token using the refresh token
        const { data } = await axios.post("/auth/refresh", { refreshToken });
        const { accessToken } = data;

        // Update the new access token and refresh token in store
        Cookies.set("accessToken", accessToken);

        // Process all requests that were waiting
        processQueue(null, accessToken);

        // Retry the original request with new access token
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return axiosAuth(originalRequest);
      } catch (refreshError) {
        // If refresh fails, reject all queued requests
        processQueue(refreshError, null);
        // Uncomment if you want to log out the user on token refresh failure
        // navigave(configError.UnAuthorize);
        handleLogout();
        // useLogout();
        // store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const handleLogout = () => {
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
  // store.dispatch(logout());
  window.location.href = "/login";
};

export { axiosAuth };
