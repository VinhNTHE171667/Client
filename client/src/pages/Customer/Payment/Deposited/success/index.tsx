import { configRoutes } from "@/constants/route";
import { useUpdatePaymentStatusDepositedMutation } from "@/services/appointment";
import { Button, Result } from "antd";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const SuccessPaymentDeposited: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [updatePaymentStatusDeposited] =
    useUpdatePaymentStatusDepositedMutation();
  useEffect(() => {
    handleUpdatePaymentStatus();
  }, []);

  const handleUpdatePaymentStatus = async () => {
    await updatePaymentStatusDeposited({
      orderCode: searchParams.get("orderCode") || "",
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
        <Button
          type="primary"
          key="console"
          onClick={() => window.location.replace(configRoutes.customerOrders)}
        >
          Về home
        </Button>,
        <Button key="buy">Mua lại</Button>,
      ]}
    />
  );
};
export default SuccessPaymentDeposited;
