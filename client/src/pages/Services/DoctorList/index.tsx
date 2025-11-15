import React, { useEffect, useState } from "react";
import { Card, Row, Col, Avatar, Button, Spin, Empty } from "antd";
import { UserOutlined } from "@ant-design/icons";
import styles from "./DoctorList.module.scss";
import {
  useGetPublicDoctorListMutation,
  type DoctorListProps,
} from "@/services/services";
import { useNavigate } from "react-router-dom";

export default function DoctorList() {
  const [doctors, setDoctors] = useState<DoctorListProps[]>([]);
  const [loading, setLoading] = useState(true);

  const [getDoctorList] = useGetPublicDoctorListMutation();
  const navigate = useNavigate();

  const fetchDoctors = async () => {
    try {
      const res = await getDoctorList().unwrap();
      setDoctors(res);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  if (loading)
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );

  if (!doctors || doctors.length === 0)
    return (
      <div className={styles.empty}>
        <Empty description="Không có bác sĩ nào" />
      </div>
    );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Danh sách bác sĩ</h2>

      <Row gutter={[20, 20]}>
        {doctors.map((doctor) => (
          <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
            <Card className={styles.card} hoverable>
              <div className={styles.cardInner}>
                <Avatar
                  size={90}
                  src={doctor.avatar}
                  icon={<UserOutlined />}
                  className={styles.avatar}
                />

                <h3
                  className={styles.name}
                  onClick={() => {
                    navigate(`/services/doctor/${doctor.id}`);
                  }}
                >
                  {doctor.full_name}
                </h3>
                <p className={styles.specialty}>
                  {doctor.specialization || "Không có chuyên môn"}
                </p>

                <Button
                  type="primary"
                  shape="round"
                  className={styles.button}
                  onClick={() =>
                    (window.location.href = `/doctor/${doctor.id}`)
                  }
                >
                  Xem dịch vụ
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
