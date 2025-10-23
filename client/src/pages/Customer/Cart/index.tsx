import { useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import styles from "./Cart.module.scss";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import FancyButton from "@/components/FancyButton";

const { Title, Text } = Typography;

type CartItem = {
  id: string;
  name: string;
  duration: string;
  price: number;
  image: string;
};

const CartPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "Triệt lông nách",
      duration: "30 phút",
      price: 199000,
      image:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=500&q=60",
    },
    {
      id: "2",
      name: "Massage mặt thư giãn",
      duration: "45 phút",
      price: 299000,
      image:
        "https://images.unsplash.com/photo-1594824476967-48c8b9642737?auto=format&fit=crop&w=500&q=60",
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRemove = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    message.success("Đã xóa dịch vụ khỏi giỏ hàng");
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      message.warning("Hãy chọn ít nhất một dịch vụ để đặt lịch nhé!");
      return;
    }
    message.success("Đi đến trang đặt lịch (mock)");
  };

  const handleBack = () => {
    navigate("/services");
  };

  const total = cartItems
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <section className={styles.cartSection}>
      <div className={styles.container}>
        <div className={styles.backWrapper}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className={styles.backButton}
          >
            Quay lại danh sách dịch vụ
          </Button>
        </div>

        <div className={styles.cartHeader}>
          <Title level={2}>Giỏ dịch vụ của bạn</Title>
        </div>

        {cartItems.length === 0 ? (
          <Empty description="Chưa có dịch vụ nào trong giỏ hàng" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {cartItems.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Col xs={24} md={12} lg={8} key={item.id}>
                    <Card
                      //   hoverable
                      className={styles.relatedCard}
                      cover={
                        <img
                          alt={item.name}
                          src={item.image || NoImage}
                          className={styles.cartImage}
                        />
                      }
                      actions={[
                        <DeleteOutlined
                          key="delete"
                          onClick={() => handleRemove(item.id)}
                        />,
                      ]}
                    >
                      <Title level={4}>{item.name}</Title>
                      <Text type="secondary">{item.duration}</Text>
                      <div className={styles.cartPrice}>
                        {item.price.toLocaleString()}đ
                      </div>

                      <Button
                        block
                        className={`${styles.selectButton} ${
                          selected ? styles.selected : ""
                        }`}
                        icon={selected ? <CheckOutlined /> : undefined}
                        onClick={() => handleToggleSelect(item.id)}
                      >
                        {selected ? "Đã chọn" : "Chọn dịch vụ"}
                      </Button>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div className={styles.cartSummary}>
              <div className={styles.summaryBox}>
                <div className={styles.summaryRow}>
                  <span>Tạm tính:</span>
                  <span>{total.toLocaleString()}đ</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Tổng cộng:</span>
                  <span>{total.toLocaleString()}đ</span>
                </div>
              </div>

              <Space size="middle" className={styles.cartActions}>
                <FancyButton
                  variant="outline"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  size="middle"
                  label="Trở về dịch vụ"
                />
                <FancyButton
                  icon={<CalendarOutlined />}
                  size="middle"
                  onClick={handleCheckout}
                  disabled={selectedIds.length === 0}
                  variant="primary"
                  label="Đặt lịch ngay"
                />
              </Space>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CartPage;
