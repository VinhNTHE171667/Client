import { configRoutes } from "@/constants/route";
import { showError, showSuccess } from "@/libs/toast";
import { useUpdatePaymentStatusDepositedMutation } from "@/services/appointment";
import { Button, Result } from "antd";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const SuccessPaymentDeposited: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [updatePaymentStatusDeposited] =
    useUpdatePaymentStatusDepositedMutation();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const handleUpdatePaymentStatus = async () => {
      try {
        await updatePaymentStatusDeposited({
          orderCode: searchParams.get("orderCode") || "",
        }).unwrap();
        showSuccess("Cập nhật trạng thái thanh toán thành công!");
      } catch {
        showError("Cập nhật trạng thái thanh toán thất bại!");
      }
    };

    handleUpdatePaymentStatus();
  }, [updatePaymentStatusDeposited, searchParams]);

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
