import React, { useEffect, useState } from "react";
import {
  Card,
  Avatar,
  Row,
  Col,
  Tag,
  Button,
  Divider,
  message,
  Empty,
} from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetPublicDoctorProfileMutation,
  type DoctorData,
} from "@/services/account";
import styles from "./DoctorProfile.module.scss";
import FancyButton from "@/components/FancyButton";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";

const DoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorData>();
  const [getPublicDoctor] = useGetPublicDoctorProfileMutation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDoctor = async () => {
      try {
        const res = await getPublicDoctor(id).unwrap();
        setDoctor(res);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải thông tin bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <p className="text-center mt-5">Đang tải...</p>;

  if (!doctor)
    return (
      <Empty description="Không tìm thấy thông tin bác sĩ" className="mt-10" />
    );

  return (
    <div className={styles.profilePage}>
      <div className={styles.heroSection}>
        <div className={styles.overlay} />
        <div className={styles.heroContent}>
          <Button
            icon={<ArrowLeftOutlined />}
            className={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          <Avatar
            src={doctor.avatar || "/NoImage.jpg"}
            size={150}
            className={styles.avatar}
          />
          <h1>{doctor.full_name}</h1>
          <p className={styles.specialization}>{doctor.specialization}</p>
        </div>
      </div>

      <div className="container">
        <Card className={styles.infoCard}>
          <Row gutter={[40, 40]}>
            <Col xs={24} md={8}>
              <h3>Thông tin liên hệ</h3>
              <p>
                <MailOutlined /> {doctor.email}
              </p>
              <p>
                <PhoneOutlined /> {doctor.phone}
              </p>
              <p>
                <CalendarOutlined /> Kinh nghiệm: {doctor.experience_years} năm
              </p>

              <Divider />
              <h3>Giới tính</h3>
              <p>{doctor.gender === "male" ? "Nam" : "Nữ"}</p>
            </Col>

            <Col xs={24} md={16}>
              <h3>Giới thiệu</h3>
              <p className={styles.biography}>
                {doctor.biography || "Chưa có thông tin giới thiệu."}
              </p>

              <Divider />
              <h3>Kỹ năng & Dịch vụ</h3>
              <div className={styles.tags}>
                {doctor.services && doctor.services.length > 0 ? (
                  doctor.services.map((s) => (
                    <Tag key={s.id} color="green">
                      {s.name}
                    </Tag>
                  ))
                ) : (
                  <p>Chưa có dịch vụ nào</p>
                )}
              </div>

              <FancyButton
                variant="primary"
                size="middle"
                className={styles.bookBtn}
                icon={null}
                onClick={() =>
                  message.info("Chức năng đặt lịch đang được phát triển!")
                }
                label="Đặt lịch hẹn"
              />
            </Col>
          </Row>
        </Card>

        <section className={styles.serviceSection}>
          <div className="container">
            <div className={styles.header}>
              <h2 className="cus-text-primary">
                Dịch vụ do {doctor.full_name} thực hiện
              </h2>
              <p>Chọn liệu trình phù hợp và đặt lịch ngay hôm nay</p>
            </div>

            <Row gutter={[24, 24]} justify="center">
              {doctor.services &&
                doctor.services.length > 0 &&
                doctor.services.map((service) => (
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
                      className={styles.card}
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
                            {service.description ||
                              "Dịch vụ làm đẹp & chăm sóc sức khỏe."}
                          </span>
                        }
                      />
                      <div className={styles.cardFooter}>
                        <span className={styles.price}>
                          {service.price?.toLocaleString("vi-VN")}₫
                        </span>
                        <div className={styles.actions}>
                          <div className={styles.cusButtonGroup}>
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
                                  // setSelectedService(service);
                                  // setIsModalVisible(true);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorProfile;
