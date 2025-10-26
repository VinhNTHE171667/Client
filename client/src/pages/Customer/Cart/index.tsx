import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Typography,
  message,
  Divider,
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
  const { auth } = useAuthStore();

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  // const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const [getCart] = useGetCartMutation();
  const [deleteFromCart] = useDeleteFromCartMutation();

  const handleGetCart = async () => {
    try {
      const cart = await getCart(auth?.accountId || "").unwrap();
      setCartItems(cart?.items || []);
    } catch {
      showError("Lấy giỏ hàng thất bại!");
    }
  };

  const handleDeleteFromCart = async (itemId: string) => {
    try {
      await deleteFromCart({
        customerId: auth?.accountId || "",
        itemId,
      }).unwrap();
      message.success("Xóa dịch vụ thành công!");
      handleGetCart();
    } catch {
      showError("Xóa dịch vụ thất bại!");
    }
  };

  useEffect(() => {
    handleGetCart();
  }, []);

  const groupedByDoctor = useMemo(() => {
    const groups: Record<string, CartItemData[]> = {};
    cartItems.forEach((item) => {
      const docId = item.doctor?.id || "no-doctor";
      if (!groups[docId]) groups[docId] = [];
      groups[docId].push(item);
    });
    return groups;
  }, [cartItems]);

  const handleSelectDoctor = (doctorId: string) => {
    if (selectedDoctorId === doctorId) {
      setSelectedDoctorId(null);
      // setSelectedIds([]);
    } else {
      setSelectedDoctorId(doctorId);
      // const doctorItems = groupedByDoctor[doctorId] || [];
      // setSelectedIds(doctorItems.map((i) => i.id));
    }
  };

  const total = (groupedByDoctor[selectedDoctorId || ""] || []).reduce(
    (sum, i) => sum + i.price,
    0
  );

  const handleCheckout = () => {
    if (!selectedDoctorId) {
      message.warning("Hãy chọn nhóm bác sĩ trước khi đặt lịch!");
      return;
    }

    const selectedServices = groupedByDoctor[selectedDoctorId];

    navigate(configRoutes.bookings, {
      state: {
        doctorId: selectedDoctorId,
        services: selectedServices,
      },
    });

    // sessionStorage.setItem(
    //   "booking-services",
    //   JSON.stringify(selectedServices)
    // );
    // navigate(configRoutes.bookings);
  };

  const handleBack = () => navigate(configRoutes.services);

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
            {Object.entries(groupedByDoctor).map(([doctorId, items]) => {
              const doctor = items[0]?.doctor;
              const isSelected = selectedDoctorId === doctorId;

              const doctorTotal = items.reduce((sum, i) => sum + i.price, 0);

              return (
                <div
                  key={doctorId}
                  className={`${styles.doctorGroup} ${
                    isSelected ? styles.activeDoctor : ""
                  }`}
                >
                  <div className={styles.doctorHeader}>
                    <div className={styles.doctorInfo}>
                      <Title level={4}>
                        👨‍⚕️ {doctor?.name || "Không rõ bác sĩ"}
                      </Title>
                      <span className={styles.doctorSub}>
                        {items.length} dịch vụ • Tổng:{" "}
                        {doctorTotal.toLocaleString()}đ
                      </span>
                    </div>
                    <Button
                      type={isSelected ? "primary" : "default"}
                      icon={<CheckOutlined />}
                      onClick={() => handleSelectDoctor(doctorId)}
                    >
                      {isSelected ? "Đã chọn" : "Chọn bác sĩ này"}
                    </Button>
                  </div>

                  <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                    {items.map((item) => (
                      <Col xs={24} md={12} lg={8} key={item.id}>
                        <Card
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
                              onClick={() => handleDeleteFromCart(item.id)}
                            />,
                          ]}
                          className={styles.relatedCard}
                        >
                          <Title level={5}>{item.name}</Title>
                          <div className={styles.cartPrice}>
                            {item.price.toLocaleString()}đ
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Divider />
                </div>
              );
            })}

            {selectedDoctorId && (
              <div className={styles.cartSummary}>
                <div className={styles.summaryBox}>
                  <div className={styles.summaryRow}>
                    <span>Tổng cộng:</span>
                    <span>{total.toLocaleString()}đ</span>
                  </div>
                </div>

                <FancyButton
                  icon={<CalendarOutlined />}
                  size="middle"
                  onClick={handleCheckout}
                  variant="primary"
                  label="Đặt lịch ngay"
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CartPage;
