import { configRoutes } from "@/constants/route";
import { Button, Result } from "antd";

const FailPayment: React.FC = () => {
  return (
    <Result
      status="error"
      title="Thanh toán không thành công!"
      subTitle="Vui lòng kiểm tra và sửa đổi thông tin sau trước khi gửi lại."
      extra={[
        <Button
          type="primary"
          key="console"
          onClick={() => window.location.replace(configRoutes.customerOrders)}
        >
          Về home
        </Button>,
        <Button key="buy">Đặt lại</Button>,
      ]}
    />
  );
};

export default FailPayment;
