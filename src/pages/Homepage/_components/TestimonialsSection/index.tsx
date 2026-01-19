import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import styles from "./TestimonialsSection.module.scss";
import avatar from "@/assets/img/Utils/noAvatars.png";
import classNames from "classnames/bind";
import { Rate, Spin } from "antd";
import { useGetPublicServicesMutation, type PublicService } from "@/services/services";

const cx = classNames.bind(styles);

interface FeedbackItem {
  rating: number;
  comment: string;
  customer: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
  createdAt: string;
  serviceName?: string; // Tên dịch vụ được đánh giá
}

const TestimonialsSection = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [getServices] = useGetPublicServicesMutation();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const services: PublicService[] = await getServices().unwrap();
        
        // Lấy tất cả feedbacks từ các dịch vụ
        const allFeedbacks: FeedbackItem[] = [];
        services.forEach((service) => {
          if (service.feedbacks && service.feedbacks.length > 0) {
            // Thêm tên dịch vụ vào mỗi feedback
            const feedbacksWithService = service.feedbacks.map(fb => ({
              ...fb,
              serviceName: service.name
            }));
            allFeedbacks.push(...feedbacksWithService);
          }
        });

        // Sắp xếp theo ngày tạo mới nhất và lấy 10 feedback đầu tiên
        const sortedFeedbacks = allFeedbacks
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

        setFeedbacks(sortedFeedbacks);
      } catch (error) {
        console.error("Lỗi khi lấy feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [getServices]);
  const settings = {
    dots: true,
    infinite: feedbacks.length > 1,
    arrows: false,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: feedbacks.length > 1,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 992,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  if (loading) {
    return (
      <section className={cx("testimonialsSection")}>
        <div className="container text-center py-5">
          <Spin size="large" tip="Đang tải đánh giá..." />
        </div>
      </section>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <section className={cx("testimonialsSection")}>
        <div className="container">
          <div className={cx("headingWrapper")}>
            <h2 className={cx("heading")}>Khách Hàng Nói Gì</h2>
            <p className={cx("subHeading")}>
              Trải nghiệm dịch vụ và chia sẻ cảm nhận từ những khách hàng yêu quý
            </p>
          </div>
          <div className="text-center py-5">
            <p>Chưa có đánh giá nào</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("testimonialsSection")}>
      <div className="container">
        <div className={cx("headingWrapper")}>
          <h2 className={cx("heading")}>Khách Hàng Nói Gì</h2>
          <p className={cx("subHeading")}>
            Trải nghiệm dịch vụ và chia sẻ cảm nhận từ những khách hàng yêu quý
          </p>
        </div>

        <Slider {...settings} className={cx("slider")}>
          {feedbacks.map((feedback, index) => (
            <div key={`${feedback.customer.id}-${index}`} className={cx("testimonialCard")}>
              <div className={cx("message")}>
                <Rate 
                  disabled 
                  allowHalf 
                  value={Number(feedback.rating)} 
                  style={{ marginBottom: "1rem", color: "#fadb14" }} 
                />
                <p>{feedback.comment || "Khách hàng hài lòng với dịch vụ"}</p>
                {feedback.serviceName && (
                  <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.5rem", fontStyle: "italic" }}>
                    Dịch vụ: {feedback.serviceName}
                  </p>
                )}
              </div>
              <div className={cx("profile")}>
                <img 
                  src={feedback.customer.avatar || avatar} 
                  alt={feedback.customer.full_name} 
                />
                <div>
                  <h5>{feedback.customer.full_name}</h5>
                  <span>Khách hàng</span>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default TestimonialsSection;
