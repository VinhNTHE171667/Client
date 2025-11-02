import { configRoutes } from "@/constants/route";
import { useUpdatePaymentStatusPaidMutation } from "@/services/appointment";
import { Button, Result } from "antd";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SuccessPaymentPaid: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [updatePaymentStatusPaid] = useUpdatePaymentStatusPaidMutation();
  useEffect(() => {
    handleUpdatePaymentStatus();
  }, []);

  const handleUpdatePaymentStatus = async () => {
    await updatePaymentStatusPaid({
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
          onClick={() => navigate(configRoutes.casherOrderManagement)}
        >
          Về home
        </Button>,
        <Button key="buy">Mua lại</Button>,
      ]}
    />
  );
};
export default SuccessPaymentPaid;
