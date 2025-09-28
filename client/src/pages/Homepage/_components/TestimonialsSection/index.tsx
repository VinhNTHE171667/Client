import React from "react";
import Slider from "react-slick";
import styles from "./TestimonialsSection.module.scss";
import avatar from "@/assets/img/Utils/noAvatars.png";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

interface Testimonial {
  name: string;
  avatar: string;
  position: string;
  message: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Nguyễn Thị Lan",
    avatar: avatar,
    position: "Khách Hàng Thân Thiết",
    message:
      "Dịch vụ ở đây thật tuyệt vời, nhân viên thân thiện và chuyên nghiệp. Mình cảm thấy thư giãn hoàn toàn mỗi lần đến.",
  },
  {
    name: "Trần Minh Quân",
    avatar: avatar,
    position: "Doanh Nhân",
    message:
      "Không gian sạch sẽ, sang trọng. Liệu trình massage rất bài bản và mang lại hiệu quả rõ rệt.",
  },
  {
    name: "Lê Thu Hà",
    avatar: avatar,
    position: "Khách Hàng",
    message:
      "Mình cực thích facial treatment ở đây, da cải thiện rõ rệt sau vài buổi. Rất hài lòng!",
  },
];

const TestimonialsSection = () => {
  const settings = {
    dots: true,
    infinite: true,
    arrows: false,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 992,
        settings: { slidesToShow: 1 },
      },
    ],
  };

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
          {testimonials.map((t, i) => (
            <div key={i} className={cx("testimonialCard")}>
              <div className={cx("message")}>"{t.message}"</div>
              <div className={cx("profile")}>
                <img src={t.avatar} alt={t.name} />
                <div>
                  <h5>{t.name}</h5>
                  <span>{t.position}</span>
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
