/* eslint-disable @typescript-eslint/no-explicit-any */
import { appointmentStatusEnum } from "@/common/types/auth";
import { showError } from "@/libs/toast";
import { AxiosError } from "axios";

export const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString("vi-VN");

export const translateStatus = (status?: string) => {
  switch (status) {
    case appointmentStatusEnum.Pending:
      return "Chờ xác nhận";
    case appointmentStatusEnum.Confirmed:
      return "Đã xác nhận";
    case appointmentStatusEnum.Deposited:
      return "Đã đặt cọc";
    case appointmentStatusEnum.Approved:
      return "Đã duyệt";
    case appointmentStatusEnum.Rejected:
      return "Bị từ chối";
    case appointmentStatusEnum.Paid:
      return "Đã thanh toán";
    case appointmentStatusEnum.Completed:
      return "Đã hoàn thành";
    case appointmentStatusEnum.Cancelled:
      return "Đã huỷ";
    default:
      return status ?? "Không xác định";
  }
};

export const statusTagColor = (status?: string) => {
  switch (status) {
    case appointmentStatusEnum.Pending:
      return "gold";
    case appointmentStatusEnum.Confirmed:
      return "blue";
    case appointmentStatusEnum.Deposited:
      return "cyan";
    case appointmentStatusEnum.Approved:
      return "geekblue";
    case appointmentStatusEnum.Rejected:
      return "volcano";
    case appointmentStatusEnum.Paid:
      return "green";
    case appointmentStatusEnum.Cancelled:
      return "red";
    case appointmentStatusEnum.Completed:
      return "purple";
    default:
      return "default";
  }
};

export function handleError(err: unknown, title = "Đã xảy ra lỗi") {
  console.error("Error:", err);

  let message = "Vui lòng thử lại sau!";

  if (err instanceof AxiosError) {
    const dataMessage = err.response?.data?.message;
    if (Array.isArray(dataMessage)) {
      message = dataMessage.join(", ");
    } else if (typeof dataMessage === "string") {
      message = dataMessage;
    }
  } else if (
    err &&
    typeof err === "object" &&
    "data" in err &&
    err.data &&
    typeof (err as any).data === "object" &&
    "message" in (err as any).data
  ) {
    const dataMessage = (err as any).data.message;
    if (Array.isArray(dataMessage)) {
      message = dataMessage.join(", ");
    } else if (typeof dataMessage === "string") {
      message = dataMessage;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  showError(title, message);
}
