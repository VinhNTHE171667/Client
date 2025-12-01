"use client"

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
  Rate,
  Input,
} from "antd"
import styles from "./Services.module.scss"
import { useGetCategoriesMutation, useGetPublicServicesMutation, type PublicService } from "@/services/services"
import { useEffect, useMemo, useState } from "react"
import NoImage from "@/assets/img/NoImage/NoImage.jpg"
import FancyButton from "@/components/FancyButton"
import { useAuthStore } from "@/hooks/UseAuth"
import { useAddToCartMutation } from "@/services/cart"
import { showError, showSuccess } from "@/libs/toast"
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import HeroSection from "@/components/HeroSection"

const { Title, Paragraph } = Typography

type Category = {
  id: string
  name: string
}

const ServicesComp = () => {
  const [getCategories] = useGetCategoriesMutation()
  const [getServices] = useGetPublicServicesMutation()
  const [addToCart] = useAddToCartMutation()

  const [categoriesData, setCategoriesData] = useState<Category[]>([])
  const [servicesData, setServicesData] = useState<PublicService[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedService, setSelectedService] = useState<PublicService | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [searchText, setSearchText] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000])

  const { auth } = useAuthStore()
  const navigate = useNavigate()

  const handleGetCategories = async () => {
    try {
      const response = await getCategories().unwrap()
      setCategoriesData([{ id: "all", name: "Tất cả" }, ...(Array.isArray(response) ? response : [])])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleGetServices = async () => {
    try {
      const response = await getServices().unwrap()
      setServicesData(response)
    } catch (error) {
      console.error("Failed to fetch services:", error)
    }
  }

  useEffect(() => {
    handleGetCategories()
    handleGetServices()
  }, [])

  const filteredServices = useMemo(() => {
    return servicesData.filter((s) => {
      if (selectedCategory !== "all" && s.category.id !== selectedCategory) return false

      if (searchText && !s.name.toLowerCase().includes(searchText.toLowerCase())) return false

      if (s.price < priceRange[0] || s.price > priceRange[1]) return false

      return true
    })
  }, [servicesData, selectedCategory, searchText, priceRange])

  const startIndex = (currentPage - 1) * pageSize
  const currentServices = filteredServices.slice(startIndex, startIndex + pageSize)

  const handleResetFilters = () => {
    setSearchText("")
    setPriceRange([0, 5000000])
    setSelectedCategory("all")
    setCurrentPage(1)
  }

  const handleConfirmDoctor = async () => {
    if (!selectedService) {
      showError("Vui lòng chọn dịch vụ!")
      return
    }

    try {
      setIsAdding(true)
      await addToCart({
        customerId: auth?.accountId || "",
        itemData: { itemId: selectedService.id, quantity: 1 },
        doctorId: selectedDoctorId || null,
      }).unwrap()

      showSuccess("Thêm vào giỏ hàng thành công!")
      setIsModalVisible(false)
      setSelectedDoctorId(null)
      setSelectedService(null)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        showError("Thêm vào giỏ hàng thất bại!", (error as { message?: string }).message || "Lỗi không xác định")
      } else {
        showError("Thêm vào giỏ hàng thất bại!", "Lỗi không xác định")
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleSkipDoctor = async () => {
    if (!selectedService) {
      showError("Vui lòng chọn dịch vụ!")
      return
    }

    try {
      setIsAdding(true)
      await addToCart({
        customerId: auth?.accountId || "",
        itemData: { itemId: selectedService.id, quantity: 1 },
        doctorId: null,
      }).unwrap()

      showSuccess("Thêm vào giỏ hàng thành công!")
      setIsModalVisible(false)
      setSelectedDoctorId(null)
      setSelectedService(null)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        showError("Thêm vào giỏ hàng thất bại!", (error as { message?: string }).message || "Lỗi không xác định")
      } else {
        showError("Thêm vào giỏ hàng thất bại!", "Lỗi không xác định")
      }
    } finally {
      setIsAdding(false)
    }
  }

  const calculateRating = (feedbacks: any[]) => {
    if (!feedbacks || feedbacks.length === 0) return 0
    return feedbacks.reduce((sum, r) => sum + r.rating, 0) / feedbacks.length
  }

  return (
    <>
      <HeroSection title="Dịch vụ" />
      <section className={styles.serviceSection}>
        <div className="container">
          <div className={styles.header}>
            <Title level={2} className={styles.mainTitle}>
              Dịch vụ của chúng tôi
            </Title>
            <Paragraph className={styles.subtitle}>
              Chọn liệu trình phù hợp để tận hưởng cảm giác thư giãn tuyệt đối
            </Paragraph>
          </div>

          <div className={styles.filtersSection}>
            {/* Category Filter */}
            <div className={styles.categorySection}>
              <Segmented
                className={styles.categoryFilter}
                options={categoriesData.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                size="large"
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val as string)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* Advanced Filters */}
            <div className={styles.advancedFiltersContainer}>
              <div className={styles.filterRow}>
                {/* Search Input */}
                <div className={styles.filterItem}>
                  <label>Tìm kiếm</label>
                  <Input
                    placeholder="Nhập tên dịch vụ..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* Price Filter */}
                <div className={styles.filterItem}>
                  <label>Khoảng giá</label>
                  <div className={styles.priceDisplay}>
                    <span>{priceRange[0].toLocaleString("vi-VN")}₫</span>
                    <span>-</span>
                    <span>{priceRange[1].toLocaleString("vi-VN")}₫</span>
                  </div>
                  <Slider
                    range
                    min={0}
                    max={5000000}
                    step={50000}
                    value={priceRange}
                    onChange={(val) => setPriceRange(val as [number, number])}
                    className={styles.priceSlider}
                  />
                </div>

                {/* Reset Button */}
                <div className={styles.filterItem}>
                  <Button icon={<ReloadOutlined />} onClick={handleResetFilters} className={styles.resetBtn}>
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {currentServices.length === 0 ? (
            <Empty description="Không có dịch vụ nào phù hợp" />
          ) : (
            <>
              <Row gutter={[20, 20]} className={styles.servicesGrid}>
                {currentServices.map((service) => {
                  const rating = calculateRating(service.feedbacks)
                  return (
                    <Col key={service.id} xs={24} sm={24} md={12} lg={8} xl={8}>
                      <Card
                        className={styles.serviceCard}
                        cover={
                          <div className={styles.imageContainer} onClick={() => navigate(`/services/${service.id}`)}>
                            <img
                              src={service.images[0]?.url || NoImage}
                              alt={service.name}
                              className={styles.serviceImage}
                            />
                            <div className={styles.imageOverlay}>
                              <button className={styles.viewBtn}>Xem chi tiết</button>
                            </div>
                          </div>
                        }
                      >
                        {/* Service Title */}
                        <div className={styles.cardHeader}>
                          <h3 className={styles.serviceTitle} onClick={() => navigate(`/services/${service.id}`)}>
                            {service.name}
                          </h3>
                        </div>

                        {/* Rating */}
                        <div className={styles.ratingSection}>
                          {service.feedbacks && service.feedbacks.length > 0 ? (
                            <>
                              <Rate disabled allowHalf value={rating} className={styles.rateStars} />
                              <span className={styles.ratingText}>{rating.toFixed(1)} / 5</span>
                            </>
                          ) : (
                            <span className={styles.noRating}>Chưa có đánh giá</span>
                          )}
                        </div>

                        {/* Description */}
                        <p className={styles.serviceDescription}>{service.description}</p>

                        {/* Footer with Price and Action */}
                        <div className={styles.cardFooter}>
                          <div className={styles.priceSection}>
                            <span className={styles.priceLabel}>Giá:</span>
                            <span className={styles.priceValue}>{service.price.toLocaleString("vi-VN")}₫</span>
                          </div>
                          <FancyButton
                            icon={<></>}
                            size="small"
                            variant="primary"
                            label="Đặt lịch"
                            onClick={() => {
                              setSelectedService(service)
                              setIsModalVisible(true)
                            }}
                          />
                        </div>
                      </Card>
                    </Col>
                  )
                })}
              </Row>

              {/* Pagination */}
              {filteredServices.length > pageSize && (
                <div className={styles.paginationWrapper}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredServices.length}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Doctor Selection Modal */}
      <Modal
        title={`Chọn bác sĩ cho dịch vụ "${selectedService?.name || ""}"`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          setSelectedDoctorId(null)
        }}
        footer={[
          <Button key="skip" onClick={handleSkipDoctor} loading={isAdding}>
            Tiếp tục (Không chọn bác sĩ)
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmDoctor}
            disabled={selectedService?.doctors && selectedService.doctors.length > 0 && !selectedDoctorId}
            loading={isAdding}
          >
            Xác nhận với bác sĩ đã chọn
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        <p className={styles.modalNote}>Lưu ý: Bạn có thể chọn bác sĩ hoặc bỏ qua để thêm vào giỏ hàng.</p>
        {selectedService?.doctors && selectedService.doctors.length > 0 ? (
          <List
            dataSource={selectedService.doctors}
            renderItem={(doctor) => (
              <List.Item
                className={`${styles.doctorItem} ${selectedDoctorId === doctor.id ? styles.selectedDoctor : ""}`}
                onClick={() => setSelectedDoctorId(doctor.id)}
              >
                <List.Item.Meta
                  avatar={<Avatar src={doctor.avatar || NoImage} size="large" />}
                  title={<strong>{doctor.name}</strong>}
                  description={
                    <div>
                      <p>{doctor.specialization || "Chuyên khoa tổng quát"}</p>
                      <span className={styles.experienceText}>{doctor.experience_years || 0} năm kinh nghiệm</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Không có bác sĩ nào khả dụng" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </>
  )
}

export default ServicesComp
