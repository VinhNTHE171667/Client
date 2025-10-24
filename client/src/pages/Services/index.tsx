import { Card, Row, Col, Segmented, Typography, Empty, Pagination } from "antd";
import styles from "./Services.module.scss";
import {
  useGetCategoriesMutation,
  useGetPublicServicesMutation,
} from "@/services/services";
import { useEffect, useState } from "react";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import FancyButton from "@/components/FancyButton";
import { useAuthStore } from "@/hooks/UseAuth";
import { showError, showSuccess } from "@/libs/toast";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useAddToCartMutation } from "@/services/cart";
import HeroSection from "@/components/HeroSection";

const { Title, Paragraph } = Typography;

type Service = {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  description: string;
  category: { id: string; name: string };
};

type Category = {
  id: string;
  name: string;
};

const ServicesComp = () => {
  const [getCategories] = useGetCategoriesMutation();
  const [getServices] = useGetPublicServicesMutation();
  const [addToCart] = useAddToCartMutation();

  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [servicesData, setServicesData] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const { auth } = useAuthStore();

  const handleGetCategories = async () => {
    try {
      const response = await getCategories().unwrap();
      setCategoriesData([
        { id: "all", name: "Tất cả" },
        ...(Array.isArray(response) ? response : []),
      ]);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleAddToCart = async (serviceId: string) => {
    try {
      await addToCart({
        customerId: auth?.accountId || "",
        itemData: { itemId: serviceId, quantity: 1 },
      }).unwrap();

      showSuccess("Thêm vào giỏ hàng thành công!");
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

  const handleGetServices = async () => {
    try {
      const response = await getServices().unwrap();
      setServicesData(response);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  useEffect(() => {
    handleGetCategories();
    handleGetServices();
  }, []);

  const filteredServices =
    selectedCategory === "all"
      ? servicesData
      : servicesData.filter((s) => s.category.id === selectedCategory);

  const startIndex = (currentPage - 1) * pageSize;
  const currentServices = filteredServices.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <>
      <HeroSection title="Dịch vụ" />
      <section className={styles.serviceSection}>
        <div className="container">
          <div className={styles.header}>
            <Title level={2} className="cus-text-primary">
              Dịch vụ của chúng tôi
            </Title>
            <Paragraph>
              Chọn liệu trình phù hợp để tận hưởng cảm giác thư giãn tuyệt đối
            </Paragraph>
          </div>

          <div className={styles.filterWrapper}>
            <Segmented
              options={categoriesData.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
              size="large"
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val as string);
                setCurrentPage(1);
              }}
            />
          </div>

          {currentServices.length === 0 ? (
            <Empty description="Không có dịch vụ nào phù hợp" />
          ) : (
            <>
              <Row gutter={[24, 24]} justify="center">
                {currentServices.map((service) => (
                  <Col
                    key={service.id}
                    xs={24}
                    sm={24}
                    md={12}
                    lg={8}
                    xl={6}
                    xxl={6}
                  >
                    <Card
                      cover={
                        <div
                          className={styles.imageWrapper}
                          onClick={() =>
                            (window.location.href = `/services/${service.id}`)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={service.images[0]?.url || NoImage}
                            alt={service.name}
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
                            onClick={() =>
                              (window.location.href = `/services/${service.id}`)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {service.name}
                          </span>
                        }
                        description={
                          <span className={styles.cardDesc}>
                            {service.description}
                          </span>
                        }
                      />
                      <div className={styles.cardFooter}>
                        <span className={styles.price}>
                          {service.price.toLocaleString("vi-VN")}₫
                        </span>
                        <div className={styles.actions}>
                          <FancyButton
                            icon={<></>}
                            size="small"
                            variant="primary"
                            label="Đặt lịch"
                          />

                          <ShoppingCartOutlined
                            className={styles.addToCartIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(service.id);
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div className={styles.paginationWrapper}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredServices.length}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ServicesComp;
