"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import {
  useGetPublicDoctorListMutation,
  type DoctorListProps,
} from "@/services/services";
import { useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./FeaturedDoctors.module.scss";

const cx = classNames.bind(styles);

const FeaturedDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorListProps[]>([]);
  const [loading, setLoading] = useState(true);

  const [getDoctorList] = useGetPublicDoctorListMutation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await getDoctorList().unwrap();

        const sorted = [...res]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 4);

        setDoctors(sorted.length > 0 ? sorted : res.slice(0, 4));
      } catch (err) {
        console.error("Lỗi tải bác sĩ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [getDoctorList]);

  if (loading) {
    return (
      <section className={cx("featuredDoctors")}>
        <div className="container text-center">
          <p className={cx("subTitle")}>Đội Ngũ Bác Sĩ</p>
          <h2 className={cx("heading")}>Chuyên Gia Hàng Đầu Của Chúng Tôi</h2>
          <div className={cx("grid")}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={cx("skeletonCard")}>
                <Spin size="large" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!doctors || doctors.length === 0) return null;

  return (
    <section className={cx("featuredDoctors")}>
      <div className="container text-center">
        <p className={cx("subTitle")}>Đội Ngũ Bác Sĩ Nổi Bật</p>
        <h2 className={cx("heading")}>Chuyên Gia Hàng Đầu Của Chúng Tôi</h2>
        <p className={cx("desc")}>
          Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và luôn đặt sức khỏe khách
          hàng lên hàng đầu
        </p>

        {/* Grid cố định tối đa 4 cột, căn giữa đẹp */}
        <div className={cx("grid")}>
          {doctors.map((doctor) => (
            <div key={doctor.id} className={cx("doctorCard")}>
              <div className={cx("cardHeader")}>
                <Avatar
                  size={110}
                  src={doctor.avatar}
                  icon={<UserOutlined />}
                  className={cx("avatar")}
                />
                <div className={cx("overlay")}>
                  <Button
                    type="primary"
                    size="large"
                    className={cx("viewBtn")}
                    onClick={() => navigate(`/services/doctor/${doctor.id}`)}
                  >
                    Xem Hồ Sơ
                  </Button>
                </div>
              </div>

              <div className={cx("cardBody")}>
                <h3
                  className={cx("name")}
                  onClick={() => navigate(`/services/doctor/${doctor.id}`)}
                >
                  {doctor.full_name}
                </h3>

                <div className={cx("specialty")}>
                  {doctor.specialization || "Chuyên gia thẩm mỹ"}
                </div>

                {doctor.rating ? (
                  <div className={cx("rating")}>
                    {doctor.rating.toFixed(1)} ★
                  </div>
                ) : null}

                <div className={cx("experience")}>
                  {doctor.experience_years
                    ? `${doctor.experience_years} năm kinh nghiệm`
                    : "Nhiều năm kinh nghiệm"}
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  className={cx("bookBtn")}
                  onClick={() => navigate(`/services/doctor/${doctor.id}`)}
                >
                  Đặt Lịch Ngay
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className={cx("viewAll")}>
          <Button
            type="link"
            size="large"
            className={cx("viewAllBtn")}
            onClick={() => navigate("/doctors")}
          >
            Xem toàn bộ bác sĩ →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDoctors;
