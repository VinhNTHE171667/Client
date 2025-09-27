// import "@/assets/css/style.css";
import { configRoutes } from "@/constants/route";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/img/Logo/mainLogo.png";
import styles from "./Header.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const Header = () => {
  const location = useLocation();
  console.log(location);

  return (
    <div className="container-fluid px-0">
      <div className="container-fluid bg-header">
        <div className="container px-0">
          <nav className="navbar navbar-light navbar-expand-lg">
            <div className="navbar-brand">
              <Link to={configRoutes.home} className={cx("link-logo-img")}>
                <img alt="logo" src={logo} />
              </Link>
            </div>

            <button
              className="navbar-toggler py-2 px-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse"
            >
              <GiHamburgerMenu />
            </button>

            <div className="collapse navbar-collapse py-2" id="navbarCollapse">
              <div className="navbar-nav mx-auto">
                <Link
                  to={configRoutes.home}
                  className={cx(
                    "nav-item",
                    "nav-link",
                    "px-lg-3",
                    "my-3",
                    "fw-bolder",
                    "text-uppercase",
                    "text-decoration-none",
                    "link-underline",
                    "link-underline-opacity-0",
                    "link-underline-opacity-75-hover",
                    "d-flex",
                    "align-items-center",
                    location.pathname === configRoutes.home && "active"
                  )}
                >
                  Trang chủ
                </Link>

                <Link
                  to={configRoutes.about}
                  className={cx(
                    "nav-item",
                    "nav-link",
                    "px-lg-3",
                    "my-3",
                    "fw-bolder",
                    "text-uppercase",
                    "text-decoration-none",
                    "link-underline",
                    "link-underline-opacity-0",
                    "link-underline-opacity-75-hover",
                    "d-flex",
                    "align-items-center",
                    location.pathname === configRoutes.about && "active"
                  )}
                >
                  Giới thiệu
                </Link>
                {/* <Link to={configRoutes.gallery} className="nav-item nav-link">
                  Thư viện ảnh
                </Link> */}
              </div>

              <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                {
                  <>
                    <button className="btn btn-primary cus-btn-primary rounded-pill py-2 px-3">
                      Đăng nhập
                    </button>
                    {/* <button className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-3 ms-4">
                      Đăng ký ngay
                    </button> */}
                  </>
                }
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;
