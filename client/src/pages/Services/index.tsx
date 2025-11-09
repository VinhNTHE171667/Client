import {
  Card,
  Row,
  Col,
  Segmented,
  Typography,
  Empty,
  Pagination,
  Modal,
  List,
  Avatar,
  Slider,
  Button,
} from "antd";
import styles from "./Services.module.scss";
import {
  useGetCategoriesMutation,
  useGetPublicServicesMutation,
  type PublicService,
} from "@/services/services";
import { useEffect, useMemo, useState } from "react";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import FancyButton from "@/components/FancyButton";
import { useAuthStore } from "@/hooks/UseAuth";
import { showError, showSuccess } from "@/libs/toast";
import {
  ReloadOutlined,
  // SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useAddToCartMutation } from "@/services/cart";
import HeroSection from "@/components/HeroSection";
import Search from "antd/es/transfer/search";
import { Link } from "react-router-dom";

const { Title, Paragraph } = Typography;

type Category = {
  id: string;
  name: string;
};

const ServicesComp = () => {
  const [getCategories] = useGetCategoriesMutation();
  const [getServices] = useGetPublicServicesMutation();
  const [addToCart] = useAddToCartMutation();

  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [servicesData, setServicesData] = useState<PublicService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(
    null
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);

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

  const filteredServices = useMemo(() => {
    return servicesData.filter((s) => {
      if (selectedCategory !== "all" && s.category.id !== selectedCategory)
        return false;

      if (
        searchText &&
        !s.name.toLowerCase().includes(searchText.toLowerCase())
      )
        return false;

      if (s.price < priceRange[0] || s.price > priceRange[1]) return false;

      return true;
    });
  }, [servicesData, selectedCategory, searchText, priceRange]);

  const startIndex = (currentPage - 1) * pageSize;
  const currentServices = filteredServices.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleResetFilters = () => {
    setSearchText("");
    setPriceRange([0, 5000000]);
    setSelectedCategory("all");
  };

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
              className={styles.categoryFilter}
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

            <div className={styles.advancedFilters}>
              <Search
                placeholder="Tìm kiếm dịch vụ..."
                // className={styles.searchInput}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <div className={styles.priceFilter}>
                <span>Khoảng giá:</span>
                <Slider
                  range
                  min={0}
                  max={5000000}
                  step={10000}
                  value={priceRange}
                  onChange={(val) => setPriceRange(val as [number, number])}
                  tooltip={{ formatter: (v) => `${v?.toLocaleString()}₫` }}
                />
              </div>

              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
                className={styles.resetBtn}
              >
                Xóa bộ lọc
              </Button>
            </div>
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
                          <div>
                            {service.feedbacks &&
                            service.feedbacks.length > 0 ? (
                              <div className={styles.ratingRow}>
                                <span className={styles.stars}>
                                  {"★".repeat(
                                    Math.round(
                                      service.feedbacks.reduce(
                                        (sum, r) => sum + r.rating,
                                        0
                                      ) / service.feedbacks.length
                                    )
                                  )}
                                  {"☆".repeat(
                                    5 -
                                      Math.round(
                                        service.feedbacks.reduce(
                                          (sum, r) => sum + r.rating,
                                          0
                                        ) / service.feedbacks.length
                                      )
                                  )}
                                </span>
                                <span className={styles.ratingValue}>
                                  {(
                                    service.feedbacks.reduce(
                                      (sum, r) => sum + r.rating,
                                      0
                                    ) / service.feedbacks.length
                                  ).toFixed(1)}{" "}
                                  / 5
                                </span>
                              </div>
                            ) : (
                              <div className={styles.noRating}>
                                Chưa có đánh giá
                              </div>
                            )}

                            <span className={styles.cardDesc}>
                              {service.description}
                            </span>
                          </div>
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
                              setSelectedService(service);
                              setIsModalVisible(true);
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
              <div className={styles.doctorWrapper}>
                <List.Item
                  className={`${styles.doctorItem} ${
                    selectedDoctorId === doctor.id ? styles.selectedDoctor : ""
                  }`}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                  style={{ cursor: "pointer" }}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={doctor.avatar} />}
                    title={
                      <Link to={`/services/doctor/${doctor.id}`}>
                        {doctor.name}
                      </Link>
                    }
                    description="Bác sĩ chuyên khoa"
                  />
                </List.Item>

                <div className={styles.doctorHoverCard}>
                  <div className={styles.doctorHoverContent}>
                    <Avatar size={80} src={doctor.avatar} />
                    <div className={styles.doctorHoverInfo}>
                      <h4>{doctor.name}</h4>
                      <p>
                        <b>Chuyên môn:</b> {doctor.specialization}
                      </p>
                      <p>
                        <b>Kinh nghiệm:</b> {doctor.experience_years} năm
                      </p>
                      <p className={styles.bio}>{doctor.biography}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </Modal>
    </>
  );
};

export default ServicesComp;
