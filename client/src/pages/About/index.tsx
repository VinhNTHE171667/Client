import about_1 from "@/assets/img/about-1.jpg";
import about_2 from "@/assets/img/about-2.jpg";
import classNames from "classnames/bind";
import styles from "./about.module.scss";

const cx = classNames.bind(styles);

const AboutSection = () => {
  return (
    <section className={cx("about")}>
      <div className="container">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5">
            <div className={cx("video")}>
              <img src={about_1} alt="Ảnh spa chính" />
              <div className={cx("subImg")}>
                <img src={about_2} alt="Ảnh spa phụ" />
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <p className={cx("title")}>Về Chúng Tôi</p>
            <h1 className={cx("heading")}>
              Trung Tâm Chăm Sóc Sắc Đẹp & Thư Giãn Hàng Đầu
            </h1>
            <p className="mb-4">
              Tại đây, chúng tôi kết hợp tinh hoa của thiên nhiên với công nghệ
              hiện đại để mang đến những liệu trình chăm sóc toàn diện nhất cho
              làn da và sức khỏe tinh thần của bạn.
            </p>

            <div className="row g-4">
              <div className="col-md-6">
                <div className={cx("iconBox")}>
                  <i className="fab fa-web-awesome"></i>
                  <div className={cx("text")}>
                    <h5>Ưu Đãi Đặc Biệt</h5>
                    <p>
                      Nhiều chương trình khuyến mãi hấp dẫn được cập nhật liên
                      tục dành riêng cho khách hàng thân thiết.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className={cx("iconBox")}>
                  <i className="fas fa-gift"></i>
                  <div className={cx("text")}>
                    <h5>Quà Tặng Trị Liệu</h5>
                    <p>
                      Nhận ngay gói liệu trình thử miễn phí hoặc quà tặng chăm
                      sóc da khi đăng ký lần đầu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="my-4">
              Với đội ngũ chuyên viên tận tâm và giàu kinh nghiệm, mỗi liệu
              trình được cá nhân hóa để phù hợp với nhu cầu riêng biệt của từng
              khách hàng.
            </p>
            <p className="mb-4">
              Hãy để chúng tôi đồng hành cùng bạn trên hành trình làm đẹp – từ
              làn da đến tinh thần, giúp bạn tìm lại sự cân bằng và vẻ đẹp tự
              nhiên vốn có.
            </p>

            <button className="cus-btn-primary">Khám Phá Thêm</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
