import Slider from "react-slick";
import img1 from "@/assets/img/carousel-1.jpg";
import img2 from "@/assets/img/carousel-2.jpg";
import img3 from "@/assets/img/carousel-3.jpg";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import styles from "./Homepage.module.scss";
import classNames from "classnames/bind";
import ServiceSection from "./_components/ServiceSection";
import QualitySection from "./_components/QualitySection";
import TestimonialsSection from "./_components/TestimonialsSection";
import GallerySection from "./_components/GallerySection";
import { configRoutes } from "@/constants/route";
import FeaturedServices from "./_components/FeaturedServices/FeaturedServices";
import FeaturedDoctors from "./_components/FeaturedDoctors/FeaturedDoctors";
import MultiVideoBackground from "./_components/MultiVideoBackground/MultiVideoBackground";

const cx = classNames.bind(styles);

const Homepage = () => {
  const settings = {
    dots: false,
    arrows: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 6000,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <div className="slick-next">›</div>,
    prevArrow: <div className="slick-prev">‹</div>,
  };

  const slides = [
    {
      img: img1,
      title: "Liệu pháp Massage Thư Giãn",
      desc: "Trải nghiệm massage toàn thân giúp giảm căng thẳng, xua tan mệt mỏi và mang lại cảm giác thư thái tuyệt đối.",
    },
    {
      img: img2,
      title: "Chăm sóc Da Mặt Chuyên Sâu",
      desc: "Liệu trình làm sạch, dưỡng ẩm và tái tạo da, giúp da sáng khỏe và mềm mịn hơn mỗi ngày.",
    },
    {
      img: img3,
      title: "Trị Liệu Giảm Mỡ & Săn Chắc Da",
      desc: "Phương pháp hiện đại hỗ trợ giảm mỡ thừa, cải thiện độ đàn hồi và mang lại vóc dáng thon gọn.",
    },
  ];

  return (
    <>
      <section className={cx("heroSlider")}>
        <Slider {...settings}>
          {slides.map((s, idx) => (
            <div key={idx} className={cx("slideItem")}>
              <img src={s.img} alt={s.title} className={cx("slideImg")} />
              <div className={cx("overlay")} />
              <div className={cx("caption")}>
                <h4 className="text-uppercase mb-3">GenSpa Center</h4>
                <h1 className="display-1 text-capitalize mb-3">{s.title}</h1>
                <p className="mx-md-5 fs-4 px-4 mb-5">{s.desc}</p>
                <div className="d-flex align-items-center justify-content-center gap-4">
                  <a
                    className="cus-btn-secondary py-3 px-4"
                    href={configRoutes.login}
                  >
                    Đăng ký
                  </a>
                  <a
                    className="cus-btn-primary py-3 px-4"
                    href={configRoutes.services}
                  >
                    Đặt ngay
                  </a>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      <FeaturedServices />
      <MultiVideoBackground />
      <FeaturedDoctors />

      <ServiceSection />

      <QualitySection />

      <TestimonialsSection />

      <GallerySection />
    </>
  );
};

export default Homepage;
