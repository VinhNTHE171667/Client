"use client";

import classNames from "classnames/bind";
import styles from "./FeaturedServices.module.scss";
import {
  useGetPublicServicesMutation,
  type PublicService,
} from "@/services/services";
import { useEffect, useState } from "react";
import { Card, Rate, Skeleton } from "antd";
import NoImage from "@/assets/img/NoImage/NoImage.jpg";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

const FeaturedServices = () => {
  const [getServices] = useGetPublicServicesMutation();
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const response = await getServices().unwrap();
        console.log(response)
        const latestServices = response
          .slice(0, 4);

        setServices(latestServices);
      } catch (error) {
        console.error("Lỗi tải dịch vụ nổi bật:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [getServices]);

  const calculateRating = (feedbacks: unknown[] = []) => {
    if (!feedbacks.length) return 0;
    return feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  };

  if (loading) {
    return (
      <section className={cx("featured")}>
        <div className="container text-center">
          <p className={cx("subTitle")}>Dịch Vụ Nổi Bật</p>
          <div className="row g-4 mt-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cx("featured")}>
      <div className="container text-center">
        <p className={cx("subTitle")}>Dịch Vụ Nổi Bật</p>
        <h2 className={cx("heading")}>Trải Nghiệm Chăm Sóc Từ Đầu Đến Chân</h2>

        <div className="row g-4 mt-5">
          {services.length === 0 ? (
            <div className="col-12 py-5">
              <p>Chưa có dịch vụ nào để hiển thị</p>
            </div>
          ) : (
            services.map((service) => {
              const rating = calculateRating(service.feedbacks);
              const imageUrl = service.images?.[0]?.url || NoImage;

              return (
                <div key={service.id} className="col-md-6 col-lg-3">
                  <Card
                    className={cx("box")}
                    cover={
                      <div className={cx("imageWrapper")}>
                        <img
                          src={imageUrl}
                          alt={service.name}
                          className={cx("serviceImg")}
                        />
                        <div className={cx("overlay")}>
                          <button
                            className={cx("viewBtn")}
                            onClick={() => navigate(`/services/${service.id}`)}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    }
                    onClick={() => navigate(`/services/${service.id}`)}
                    hoverable
                  >
                    <div className={cx("content")}>
                      <h5 className={cx("title")}>{service.name}</h5>

                      {service.feedbacks && service.feedbacks.length > 0 ? (
                        <div className={cx("rating")}>
                          <Rate
                            disabled
                            allowHalf
                            value={rating}
                            className={cx("stars")}
                          />
                          <span className={cx("ratingText")}>
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className={cx("noRating")}>Chưa có đánh giá</span>
                      )}

                      <p className={cx("desc")}>{service.description}</p>

                      <div className={cx("price")}>
                        {service.price.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
