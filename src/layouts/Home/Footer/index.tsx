import styles from "./Footer.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const Footer = () => {
  return (
    <>
      <div className={cx("footer", "container-fluid")}>
        <div className="container">
          <div className="row g-5">
            {/* Newsletter */}
            <div className="col-md-6 col-lg-3">
              <h4>Đăng ký nhận tin</h4>
              <p>
                Nhận tin mới nhất và ưu đãi đặc biệt từ GenSpa. Hãy để lại email
                của bạn:
              </p>
              <div className={cx("newsletter-input", "position-relative")}>
                <input
                  className="form-control w-100"
                  type="text"
                  placeholder="Nhập email của bạn"
                />
                <button
                  type="button"
                  className="btn position-absolute top-0 end-0 m-1"
                >
                  Đăng ký
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="col-md-6 col-lg-3">
              <h4>Dịch vụ</h4>
              {[
                "Chăm sóc Da Mặt",
                "Triệt Lông Wax",
                "Massage Trị Liệu",
                "Tắm Khoáng Thiên Nhiên",
                "Giảm Mỡ & Tạo Dáng",
                "Liệu Pháp Tinh Dầu",
                "Massage Đá Nóng",
              ].map((item) => (
                <a key={item} href="#">
                  <i className="fas fa-angle-right me-2"></i>
                  {item}
                </a>
              ))}
            </div>

            {/* Address */}
            <div className="col-md-6 col-lg-3">
              <h4>Địa chỉ</h4>
              <p>
                <i className="fas fa-map-marker-alt me-2"></i>
                Số 56, Đường Phạm Ngọc Thạch,
                <br />
                Phường Kim Liên, Quận Đống Đa,
                <br />
                Thành phố Hà Nội
              </p>
              <p className="mt-3">
                <i className="fas fa-clock me-2"></i>
                <strong>Giờ mở cửa:</strong>
                <br />
                Thứ 2 - Thứ 7: 8:00 - 21:00
                <br />
                Chủ nhật: 9:00 - 20:00
              </p>
            </div>

            {/* Follow & Contact */}
            <div className="col-md-6 col-lg-3">
              <h4>Theo dõi</h4>
              <div>
                <a href="#" className={cx("social-link")}>
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className={cx("social-link")}>
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className={cx("social-link")}>
                  <i className="fab fa-twitter"></i>
                </a>
              </div>

              <h4 className="mt-4">Liên hệ</h4>
              <p>
                <i className="fas fa-envelope me-2"></i> contact@genspa.vn
              </p>
              <p>
                <i className="fas fa-phone-alt me-2"></i> 024 3715 8888
              </p>
              <p>
                <i className="fab fa-whatsapp me-2"></i> (+84) 912 345 678
              </p>
              <p>
                <i className="fas fa-headset me-2"></i> Hotline: 1900 6789
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={cx("copyright", "container-fluid")}>
        <div className="container text-center">
          <span>
            <i className="fas fa-copyright me-1"></i>
            <a href="#">GenSpa</a> – All rights reserved.
          </span>
        </div>
      </div>
    </>
  );
};

export default Footer;
