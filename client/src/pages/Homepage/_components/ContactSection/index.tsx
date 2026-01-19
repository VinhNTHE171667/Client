import styles from "./ContactSection.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const ContactSection = () => {
  return (
    <section className={cx("contactSection")}>
      <div className="container">
        <div className={cx("headingWrapper")}>
          <h2 className={cx("heading")}>Liên Hệ Với Chúng Tôi</h2>
          <p className={cx("subHeading")}>
            Hãy để lại thông tin, chúng tôi sẽ phản hồi sớm nhất có thể.
          </p>
        </div>

        <div className={cx("content")}>
          <div className={cx("info")}>
            <div className={cx("infoItem")}>
              <i className="fas fa-map-marker-alt"></i>
              <span>123 Đường ABC, Quận 1, TP. Hồ Chí Minh</span>
            </div>
            <div className={cx("infoItem")}>
              <i className="fas fa-phone-alt"></i>
              <span>+84 123 456 789</span>
            </div>
            <div className={cx("infoItem")}>
              <i className="fas fa-envelope"></i>
              <span>contact@spaxinh.vn</span>
            </div>

            <iframe
              className={cx("map")}
              title="Google Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.502123!2d106.700423!3d10.776889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3c!2sHo%20Chi%20Minh!5e0!3m2!1sen!2s!4v1695988888888"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>

          <form className={cx("form")}>
            <input type="text" placeholder="Họ và tên" required />
            <input type="email" placeholder="Email" required />
            <input type="text" placeholder="Số điện thoại" required />
            <textarea placeholder="Nội dung" rows={4} required></textarea>
            <button type="submit" className={cx("btnSubmit")}>
              Gửi Ngay
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
