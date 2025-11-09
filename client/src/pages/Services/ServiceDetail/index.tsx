import { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Button,
  Card,
  Skeleton,
  Modal,
  Empty,
  List,
  Avatar,
  Rate,
} from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import styles from "./ServiceDetail.module.scss";

import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import {
  useGetPublicServiceByIdQuery,
  useGetPublicServicesMutation,
  type PublicService,
} from "@/services/services";
import { useParams, useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { useAuthStore } from "@/hooks/UseAuth";
import { useAddToCartMutation } from "@/services/cart";
import { showError, showSuccess } from "@/libs/toast";

const { Title, Paragraph } = Typography;

// type Service = {
//   id: string;
//   name: string;
//   price: number;
//   images: { url: string }[];
//   description: string;
//   category: { id: string; name: string };
// };

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: serviceData, isLoading } = useGetPublicServiceByIdQuery(
    id || ""
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [servicesData, setServicesData] = useState<PublicService[]>([]);
  const [getServices] = useGetPublicServicesMutation();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(
    null
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleGetServices = async () => {
    try {
      const response = await getServices().unwrap();
      setServicesData(response);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  useEffect(() => {
    handleGetServices();
  }, []);

  const { auth } = useAuthStore();
  const [addToCart] = useAddToCartMutation();

  const handleConfirmDoctor = async () => {
    if (!selectedService || !selectedDoctorId) {
      showError("Vui lòng chọn bác sĩ trước khi thêm vào giỏ hàng!");
      return;
    }

    try {
      setIsAdding(true);
      await addToCart({
        customerId: auth?.accountId || "",
        itemData: { itemId: selectedService.id, quantity: 1 },
        doctorId: selectedDoctorId,
      }).unwrap();

      showSuccess("Thêm vào giỏ hàng thành công!");
      setIsModalVisible(false);
      setSelectedDoctorId(null);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        showError(
          "Thêm vào giỏ hàng thất bại!",
          (error as { message?: string }).message
        );
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading || !serviceData) {
    return (
      <div className={styles.loadingWrapper}>
        <Skeleton active avatar paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const { name, price, images, description, category } = serviceData;

  const relatedServices = servicesData
    ?.filter((s) => s.category?.id === category?.id && s.id !== id)
    ?.slice(0, 4);

  return (
    <section className={styles.serviceDetailSection}>
      <div className="container">
        <div className={styles.backWrapper}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            Quay lại
          </Button>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} md={12}>
            <div className={styles.imageGallery}>
              <div className={styles.mainImageWrapper}>
                <img
                  src={images?.[selectedImage]?.url || NoImage}
                  alt={images?.[selectedImage]?.alt || name}
                  className={styles.mainImage}
                />
              </div>

              <div className={styles.thumbnailList}>
                {images && images.length > 0 ? (
                  images.map((img, index) => (
                    <div
                      key={index}
                      className={`${styles.thumbnailItem} ${
                        selectedImage === index ? styles.active : ""
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img.url} alt={img.alt || name} />
                    </div>
                  ))
                ) : (
                  <div className={styles.thumbnailItem}>
                    <img src={NoImage} alt="No image" />
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className={styles.infoBox}>
              <Title
                level={3}
                className={`${styles.serviceTitle} cus-text-primary`}
              >
                {name}
              </Title>

              <Paragraph className={styles.price}>
                {price.toLocaleString("vi-VN")}₫
              </Paragraph>

              {serviceData.feedbacks && serviceData.feedbacks.length > 0 ? (
                <div className={styles.ratingRow}>
                  <Rate
                    disabled
                    allowHalf
                    value={
                      serviceData.feedbacks.reduce(
                        (sum, r) => sum + r.rating,
                        0
                      ) / serviceData.feedbacks.length
                    }
                  />
                  <span className={styles.ratingValue}>
                    {(
                      serviceData.feedbacks.reduce(
                        (sum, r) => sum + r.rating,
                        0
                      ) / serviceData.feedbacks.length
                    ).toFixed(1)}{" "}
                    / 5
                  </span>
                </div>
              ) : (
                <div className={styles.noRating}>Chưa có đánh giá</div>
              )}

              <Paragraph className={styles.category}>
                Danh mục: <strong>{category?.name}</strong>
              </Paragraph>

              <Paragraph className={styles.shortDesc}>{description}</Paragraph>

              <div className={styles.cusButtonGroup}>
                <FancyButton
                  label="Thêm vào giỏ hàng"
                  size="middle"
                  variant="outline"
                  onClick={() => {
                    setSelectedService(serviceData);
                    setIsModalVisible(true);
                  }}
                />
                <FancyButton
                  label="Đặt lịch ngay"
                  size="middle"
                  onClick={() => navigate("/cart")}
                />
              </div>
            </div>
          </Col>
        </Row>

        <div className={styles.descriptionSection}>
          <Title level={4}>Mô tả chi tiết</Title>
          <Paragraph>{description}</Paragraph>
        </div>

        <div className={styles.feedbackSection}>
          <Title level={4}>Đánh giá từ khách hàng</Title>

          {serviceData.feedbacks && serviceData.feedbacks.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={serviceData.feedbacks}
              pagination={{
                pageSize: 3,
                showSizeChanger: false,
                showQuickJumper: false,
                position: "bottom",
              }}
              renderItem={(item) => (
                <List.Item key={item.customer?.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.customer?.avatar || NoImage} />}
                    title={
                      <span>
                        {item.customer?.full_name || "Khách hàng"}{" "}
                        <Rate disabled allowHalf value={Number(item.rating)} />
                      </span>
                    }
                    description={<p>{item.comment}</p>}
                  />
                  <div className={styles.feedbackDate}>
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className={styles.noRating}>Chưa có đánh giá</div>
          )}
        </div>

        {relatedServices && relatedServices.length > 0 && (
          <div className={styles.relatedWrapper}>
            <Title level={3}>Dịch vụ liên quan</Title>
            <Row gutter={[24, 24]} justify="center">
              {relatedServices.map((srv) => (
                <Col key={srv.id} xs={24} sm={24} md={12} lg={8} xl={6}>
                  <Card
                    cover={
                      <div
                        className={styles.imageWrapper}
                        onClick={() => navigate(`/services/${srv.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <img
                          src={srv.images[0]?.url || NoImage}
                          alt={srv.name}
                          className={styles.image}
                        />
                      </div>
                    }
                    className={styles.card}
                  >
                    <Card.Meta
                      title={
                        <span
                          className={`${styles.cardTitle} cus-text-primary`}
                          onClick={() => navigate(`/services/${srv.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          {srv.name}
                        </span>
                      }
                      description={
                        <div>
                          {srv.feedbacks && srv.feedbacks.length > 0 ? (
                            <div className={styles.ratingRow}>
                              <span className={styles.stars}>
                                {"★".repeat(
                                  Math.round(
                                    srv.feedbacks.reduce(
                                      (sum, r) => sum + r.rating,
                                      0
                                    ) / srv.feedbacks.length
                                  )
                                )}
                                {"☆".repeat(
                                  5 -
                                    Math.round(
                                      srv.feedbacks.reduce(
                                        (sum, r) => sum + r.rating,
                                        0
                                      ) / srv.feedbacks.length
                                    )
                                )}
                              </span>
                              <span className={styles.ratingValue}>
                                {(
                                  srv.feedbacks.reduce(
                                    (sum, r) => sum + r.rating,
                                    0
                                  ) / srv.feedbacks.length
                                ).toFixed(1)}{" "}
                                / 5
                              </span>
                            </div>
                          ) : (
                            <div className={styles.noRating}>
                              Chưa có đánh giá
                            </div>
                          )}

                          {/* <span className={styles.cardDesc}>
                            {srv.description}
                          </span> */}
                        </div>
                      }
                    />
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>
                        {srv.price.toLocaleString("vi-VN")}₫
                      </span>
                      <div className={styles.actions}>
                        <FancyButton
                          size="small"
                          variant="primary"
                          label="Đặt lịch"
                          onClick={() => navigate(`/services/${srv.id}`)}
                        />
                        <ShoppingCartOutlined
                          className={styles.addToCartIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(srv);
                            setIsModalVisible(true);
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      <Modal
        title={`Chọn bác sĩ cho dịch vụ "${selectedService?.name || ""}"`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedDoctorId(null);
        }}
        onOk={handleConfirmDoctor}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={isAdding}
        width={600}
      >
        {!selectedService?.doctors || selectedService.doctors.length === 0 ? (
          <Empty description="Không có bác sĩ nào khả dụng cho dịch vụ này" />
        ) : (
          <List
            dataSource={selectedService.doctors}
            renderItem={(doctor) => (
              <List.Item
                className={`${styles.doctorItem} ${
                  selectedDoctorId === doctor.id ? styles.selectedDoctor : ""
                }`}
                onClick={() => setSelectedDoctorId(doctor.id)}
                style={{ cursor: "pointer" }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={doctor.avatar} />}
                  title={doctor.name}
                  description="Bác sĩ chuyên khoa"
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </section>
  );
};

export default ServiceDetail;
