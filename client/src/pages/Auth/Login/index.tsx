import { Link } from "react-router-dom";
import styles from "../Auth.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const LoginPage = () => {
  return (
    <div className={cx("auth-wrapper")}>
      <div className={cx("auth-card-login")}>
        <h2 className="text-center mb-4">Đăng nhập</h2>

        <form>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control rounded-pill py-2"
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-control rounded-pill py-2"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            className="btn cus-btn-primary w-100 rounded-pill py-2 mt-3"
          >
            Đăng nhập
          </button>
        </form>

        <div className="text-center mt-4">
          <span>Bạn chưa có tài khoản? </span>
          <Link to="/register" className="fw-bold text-primary">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
