import { configRoutes } from "@/constants/route";
import { useUpdatePaymentStatusMutation } from "@/services/appointment";
import { Button, Result } from "antd";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const FailPayment: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();
  useEffect(() => {
    handleUpdatePaymentStatus();
  }, []);

  const handleUpdatePaymentStatus = async () => {
    const statusParam = searchParams.get("status");
    const status: "PAID" | "CANCELLED" =
      statusParam === "PAID" ? "PAID" : "CANCELLED";
    await updatePaymentStatus({
      orderCode: searchParams.get("orderCode") || "",
      status,
    })
      .unwrap()
      .then(() => {
        console.log("Payment status updated successfully");
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((error: any) => {
        console.error("Failed to update payment status:", error);
      });
  };

  return (
    <Result
      status="error"
      title="Thanh toán không thành công!"
      subTitle="Vui lòng kiểm tra và sửa đổi thông tin sau trước khi gửi lại."
      extra={[
        <Button
          type="primary"
          key="console"
          onClick={() => window.location.replace(configRoutes.cart)}
        >
          Về home
        </Button>,
        <Button key="buy">Đặt lại</Button>,
      ]}
    />
  );
};

export default FailPayment;
