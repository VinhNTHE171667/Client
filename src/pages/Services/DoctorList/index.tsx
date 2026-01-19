"use client"

import { useEffect, useState } from "react"
import { Avatar, Button, Spin, Empty } from "antd"
import { UserOutlined, PhoneOutlined } from "@ant-design/icons"
import styles from "./DoctorList.module.scss"
import { useGetPublicDoctorListMutation, type DoctorListProps } from "@/services/services"
import { useNavigate } from "react-router-dom"
import { IoMapOutline } from "react-icons/io5"

export default function DoctorList() {
  const [doctors, setDoctors] = useState<DoctorListProps[]>([])
  const [loading, setLoading] = useState(true)

  const [getDoctorList] = useGetPublicDoctorListMutation()
  const navigate = useNavigate()

  const fetchDoctors = async () => {
    try {
      const res = await getDoctorList().unwrap()
      setDoctors(res)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  if (loading)
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    )

  if (!doctors || doctors.length === 0)
    return (
      <div className={styles.empty}>
        <Empty description="Không có bác sĩ nào" />
      </div>
    )

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Đội Ngũ Bác Sĩ</h1>
        <p className={styles.subtitle}>Các bác sĩ chuyên nghiệp, giàu kinh nghiệm sẵn sàng phục vụ</p>
      </div>

      <div className={styles.doctorsGrid}>
        {doctors.map((doctor) => (
          <div key={doctor.id} className={styles.doctorCard}>
            <div className={styles.cardHeader}>
              <Avatar size={120} src={doctor.avatar} icon={<UserOutlined />} className={styles.avatar} />
              <div className={styles.cardOverlay}>
                <Button
                  type="primary"
                  className={styles.quickViewBtn}
                  onClick={() => navigate(`/services/doctor/${doctor.id}`)}
                >
                  Xem Dịch Vụ
                </Button>
              </div>
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.name} onClick={() => navigate(`/services/doctor/${doctor.id}`)}>
                {doctor.full_name}
              </h3>

              <div className={styles.specialtyBadge}>{doctor.specialization || "Chuyên gia tổng quát"}</div>

              <p className={styles.description}>
                Được đào tạo và chứng chỉ quốc tế, với nhiều năm kinh nghiệm trong lĩnh vực.
              </p>

              <div className={styles.infoItems}>
                <div className={styles.infoItem}>
                  <PhoneOutlined className={styles.icon} />
                  <span>Liên hệ để đặt lịch</span>
                </div>
                <div className={styles.infoItem}>
                  <IoMapOutline className={styles.icon} />
                  <span>Phòng khám chuyên môn</span>
                </div>
              </div>

              <Button
                type="primary"
                block
                className={styles.actionBtn}
                onClick={() => navigate(`/services/doctor/${doctor.id}`)}
              >
                Đặt Lịch Hẹn
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
