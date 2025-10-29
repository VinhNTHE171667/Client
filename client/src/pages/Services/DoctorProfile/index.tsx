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
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetPublicDoctorProfileMutation,
  type DoctorData,
} from "@/services/account";
import styles from "./DoctorProfile.module.scss";
import FancyButton from "@/components/FancyButton";

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

        {doctor.services && doctor.services.length > 0 && (
          <section className={styles.serviceSection}>
            <div className={styles.header}>
              <h2>Dịch vụ do {doctor.full_name} thực hiện</h2>
              <p>Chọn liệu trình phù hợp và đặt lịch ngay hôm nay</p>
            </div>

            <Row gutter={[24, 24]} justify="center">
              {doctor.services.map((service) => (
                <Col key={service.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    className={styles.card}
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <div className={styles.cardContent}>
                      <h3>{service.name}</h3>
                      <p>Dịch vụ được thực hiện bởi {doctor.full_name}</p>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;
