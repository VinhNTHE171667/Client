export const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString("vi-VN");
