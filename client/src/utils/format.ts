import { appointmentStatusEnum } from "@/common/types/auth";

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
