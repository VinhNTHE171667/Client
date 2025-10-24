import { useEffect, useState } from "react";
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
import { configRoutes } from "@/constants/route";
import {
  useDeleteFromCartMutation,
  useGetCartMutation,
  type CartItemData,
} from "@/services/cart";
import { showError } from "@/libs/toast";
import { useAuthStore } from "@/hooks/UseAuth";

const { Title } = Typography;

const CartPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { auth } = useAuthStore();

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRemove = (id: string) => {
    // setCartItems((prev) => prev.filter((item) => item.id !== id));
    handleDeleteFromCart(id);

    // message.success("Đã xóa dịch vụ khỏi giỏ hàng");
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      message.warning("Hãy chọn ít nhất một dịch vụ để đặt lịch nhé!");
      return;
    }
    message.success("Đi đến trang đặt lịch (mock)");
  };

  const handleBack = () => {
    navigate(configRoutes.services);
  };

  const [getCart] = useGetCartMutation();

  const handleGetCart = async () => {
    try {
      const cart = await getCart(auth?.accountId || "").unwrap();

      if (!cart) {
        setCartItems([]);
        return;
      }

      setCartItems(cart.items);

      // showSuccess("Lấy giỏ hàng thành công!");
    } catch (error) {
      showError("Lấy giỏ hàng thất bại!");
      console.error(error);
    }
  };

  const [deleteFromCart] = useDeleteFromCartMutation();

  const handleDeleteFromCart = async (itemId: string) => {
    try {
      await deleteFromCart({
        customerId: auth?.accountId || "",
        itemId,
      }).unwrap();

      message.success("Xóa dịch vụ khỏi giỏ hàng thành công!");
      handleEvent();
    } catch (error) {
      showError("Xóa dịch vụ khỏi giỏ hàng thất bại!");
      console.error(error);
    }
  };

  const handleEvent = () => {
    handleGetCart();
  };

  useEffect(() => {
    handleEvent();
  }, []);

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
          <Title level={2} className="cus-text-primary">
            Giỏ dịch vụ của bạn
          </Title>
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
                          src={item.images?.[0]?.url || NoImage}
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
                      <Title level={4} className="cus-text-primary">
                        {item.name}
                      </Title>
                      {/* <Text type="secondary">{item.duration}</Text> */}
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
