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
              <h4>Newsletter</h4>
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
                "Facials",
                "Waxing",
                "Massage",
                "Mineral Baths",
                "Body Treatments",
                "Aroma Therapy",
                "Stone Spa",
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
                123 GenSpa Street, Quận 1, TP.HCM
                <br />
                Mở cửa: 9:00 – 21:00
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
                <i className="fas fa-envelope me-2"></i> info@genspa.com
              </p>
              <p>
                <i className="fas fa-phone me-2"></i> (+84) 123 456 789
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
