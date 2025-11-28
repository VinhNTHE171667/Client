import classNames from "classnames/bind";
import styles from "./ServiceSection.module.scss";

const cx = classNames.bind(styles);

const services = [
  {
    icon: "fas fa-spa",
    title: "Massage Thư Giãn",
    desc: "Liệu trình massage giúp giải tỏa căng thẳng, giảm mệt mỏi và phục hồi năng lượng.",
  },
  {
    icon: "fas fa-leaf",
    title: "Chăm Sóc Da Mặt",
    desc: "Sử dụng sản phẩm thiên nhiên, tái tạo làn da sáng khỏe và mịn màng.",
  },
  {
    icon: "fas fa-hot-tub",
    title: "Xông Hơi Detox",
    desc: "Thải độc, kích thích tuần hoàn máu và tăng cường miễn dịch tự nhiên.",
  },
  {
    icon: "fas fa-gift",
    title: "Gói Quà Tặng",
    desc: "Tặng người thân những gói chăm sóc cao cấp – món quà của sự thư giãn.",
  },
];

const ServiceSection = () => {
  return (
    <section className={cx("service")}>
      <div className="container text-center">
        <p className={cx("subTitle")}>Dịch Vụ Nổi Bật</p>
        <h2 className={cx("heading")}>Trải Nghiệm Chăm Sóc Từ Đầu Đến Chân</h2>

        <div className="row g-4 mt-4">
          {services.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className={cx("box")}>
                <i className={item.icon}></i>
                <h5>{item.title}</h5>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;
