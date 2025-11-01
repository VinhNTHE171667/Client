import { useUpdatePaymentStatusMutation } from "@/services/appointment";
import { Button, Result } from "antd";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const SuccessPayment: React.FC = () => {
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
      status="success"
      title="Thanh toán thành công!"
      subTitle="Mã đơn hàng: 2017182818828182881. Cấu hình máy chủ đám mây mất 1-5 phút, vui lòng chờ."
      extra={[
        <Button type="primary" key="console">
          Về home
        </Button>,
        <Button key="buy">Mua lại</Button>,
      ]}
    />
  );
};
export default SuccessPayment;
