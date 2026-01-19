export const extractErrorMessage = (
  err: { data?: { message?: string | string[] } } | undefined,
  fallback = "Đã xảy ra lỗi"
): string => {
  if (!err || !err.data) return fallback;

  const { message } = err.data;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;

  return fallback;
};
