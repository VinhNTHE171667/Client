import { useEffect, useState } from "react";
import { Typography, Row, Col, Button, Card, Skeleton } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import styles from "./ServiceDetail.module.scss";

import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import {
  useGetPublicServiceByIdQuery,
  useGetPublicServicesMutation,
} from "@/services/services";
import { useParams, useNavigate } from "react-router-dom";
import FancyButton from "@/components/FancyButton";
import { useAuthStore } from "@/hooks/UseAuth";
import { useAddToCartMutation } from "@/services/cart";
import { showError, showSuccess } from "@/libs/toast";

const { Title, Paragraph } = Typography;

type Service = {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  description: string;
  category: { id: string; name: string };
};

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: serviceData, isLoading } = useGetPublicServiceByIdQuery(
    id || ""
  );
  const [selectedImage, setSelectedImage] = useState(0);
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [getServices] = useGetPublicServicesMutation();

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

  const handleAddToCart = async () => {
    if (!auth?.accountId) {
      showError("Bạn cần đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      await addToCart({
        customerId: auth.accountId,
        itemData: { itemId: id || "", quantity: 1 },
      }).unwrap();

      showSuccess("Đã thêm dịch vụ vào giỏ hàng!");
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        showError(
          "Thêm vào giỏ hàng thất bại!",
          (error as { message?: string }).message
        );
      } else {
        showError("Thêm vào giỏ hàng thất bại!");
      }
      console.error(error);
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

              <Paragraph className={styles.category}>
                Danh mục: <strong>{category?.name}</strong>
              </Paragraph>

              <Paragraph className={styles.shortDesc}>{description}</Paragraph>

              <div className={styles.cusButtonGroup}>
                <FancyButton
                  label="Thêm vào giỏ hàng"
                  size="middle"
                  variant="outline"
                  onClick={handleAddToCart}
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

        {relatedServices && relatedServices.length > 0 && (
          <div className={styles.relatedWrapper}>
            <Title level={3}>Dịch vụ liên quan</Title>
            <Row gutter={[24, 24]} justify="center">
              {relatedServices.map((srv) => (
                <Col key={srv.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    className={styles.relatedCard}
                    cover={
                      <img
                        src={srv.images?.[0]?.url || NoImage}
                        alt={srv.name}
                        className={styles.relatedImage}
                      />
                    }
                    onClick={() => navigate(`/services/${srv.id}`)}
                  >
                    <Card.Meta
                      title={srv.name}
                      description={srv.description.slice(0, 60) + "..."}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceDetail;
