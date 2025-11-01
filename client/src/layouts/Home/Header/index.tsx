// import "@/assets/css/style.css";
import { configRoutes } from "@/constants/route";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/Logo/mainLogo.png";
import styles from "./Header.module.scss";
import classNames from "classnames/bind";
import { Avatar, Dropdown } from "antd";
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/UseAuth";

const cx = classNames.bind(styles);

const Header = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const { isCustomer, logout, auth } = useAuthStore();

  // console.log(location);

  useEffect(() => {
    const handleScroll = () => {
      const stickyElements =
        document.querySelectorAll<HTMLElement>(".sticky-top");
      const scrollTop = window.scrollY;

      stickyElements.forEach((el) => {
        if (scrollTop > 300) {
          el.classList.add("shadow-sm");
          el.style.top = "0px";
        } else {
          el.classList.remove("shadow-sm");
          el.style.top = "-200px";
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userInitial = auth?.fullName?.[0]?.toUpperCase() || "U";

  const dropdownItems = [
    {
      key: "1",
      label: "Trang cá nhân",
      onClick: () => navigate(configRoutes.profile),
    },
    {
      key: "2",
      label: "Giỏ hàng",
      onClick: () => navigate(configRoutes.cart),
    },
    {
      key: "3",
      label: "Lịch đặt của tôi",
      onClick: () => navigate(configRoutes.customerOrders),
    },
    {
      key: "5",
      label: "Đăng xuất",
      onClick: logout,
    },
  ];

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
                <Link
                  to={configRoutes.services}
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
                    location.pathname === configRoutes.services && "active"
                  )}
                >
                  Dịch vụ
                </Link>
              </div>

              <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                {isCustomer ? (
                  <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
                    <div
                      className="d-flex align-items-center ms-4"
                      style={{
                        cursor: "pointer",
                        gap: "0.5rem",
                        transition: "0.2s ease-in-out",
                      }}
                    >
                      {auth?.avatar ? (
                        <Avatar
                          size="large"
                          src={auth.avatar}
                          style={{
                            backgroundColor: "#1677ff",
                            fontWeight: "bold",
                            transition: "transform 0.2s",
                          }}
                        />
                      ) : (
                        <Avatar
                          size="large"
                          style={{
                            backgroundColor: "#1677ff",
                            fontWeight: "bold",
                            transition: "transform 0.2s",
                          }}
                        >
                          {userInitial}
                        </Avatar>
                      )}
                      <span className="d-none d-xl-block fw-bold text-dark">
                        {auth?.fullName || "Tài khoản"}
                      </span>
                    </div>
                  </Dropdown>
                ) : (
                  <>
                    <button
                      className="btn cus-btn-primary rounded-pill py-2 px-3 ms-4"
                      onClick={() => navigate(configRoutes.login)}
                    >
                      Đăng nhập
                    </button>
                    {/* <button
                      onClick={() => navigate(configRoutes.register)}
                      className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-3 ms-4"
                    >
                      Đăng ký ngay
                    </button> */}
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;
