import classNames from "classnames/bind";
import styles from "./QualitySection.module.scss";
const cx = classNames.bind(styles);

const features = [
  {
    icon: "fas fa-user-md",
    title: "Chuyên Viên Dày Kinh Nghiệm",
    desc: "Đội ngũ được đào tạo bài bản, tận tâm và luôn lắng nghe khách hàng.",
  },
  {
    icon: "fas fa-leaf",
    title: "Sản Phẩm Thiên Nhiên",
    desc: "Cam kết sử dụng nguyên liệu an toàn, dịu nhẹ cho mọi loại da.",
  },
  {
    icon: "fas fa-star",
    title: "Dịch Vụ 5 Sao",
    desc: "Không gian thư giãn, tiện nghi hiện đại, chăm sóc tận tình.",
  },
  {
    icon: "fas fa-clock",
    title: "Lịch Hẹn Linh Hoạt",
    desc: "Dễ dàng đặt lịch online và chọn thời gian phù hợp.",
  },
];

const QualitySection = () => {
  return (
    <section className={cx("quality")}>
      <div className="container text-center">
        <p className={cx("subTitle")}>Cam Kết Chất Lượng</p>
        <h2 className={cx("heading")}>Tận Tâm – Chuyên Nghiệp – Đẳng Cấp</h2>

        <div className="row g-4 mt-4">
          {features.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-3">
              <div className={cx("card")}>
                <div className={cx("iconCircle")}>
                  <i className={item.icon}></i>
                </div>
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

export default QualitySection;
