import { configRoutes } from "@/constants/route";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const FailPaymentPaid: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="error"
      title="Thanh toán không thành công!"
      subTitle="Vui lòng kiểm tra và sửa đổi thông tin sau trước khi gửi lại."
      extra={[
        <Button
          type="primary"
          key="console"
          onClick={() => navigate(configRoutes.casherOrderManagement)}
        >
          Về home
        </Button>,
        <Button key="buy">Đặt lại</Button>,
      ]}
    />
  );
};

export default FailPaymentPaid;
