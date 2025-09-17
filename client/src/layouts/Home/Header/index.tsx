import "@/assets/css/style.css";
import { Avatar, Dropdown } from "antd";
import { configRoutes } from "@/constants/route";
import { useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {

  return (
    <div className="container-fluid px-0">
      <div className="container-fluid bg-light">
        <div className="container px-0">
          <nav className="navbar navbar-light navbar-expand-xl">
            <Link to={configRoutes.home} className="navbar-brand">
              <h2 className="text-primary">GenSpa</h2>
            </Link>
            <button
              className="navbar-toggler py-2 px-3"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarCollapse"
            >
              <GiHamburgerMenu />
            </button>

            <div
              className="collapse navbar-collapse bg-light py-3"
              id="navbarCollapse"
            >
              <div className="navbar-nav mx-auto border-top">
                <Link to={configRoutes.home} className="nav-item nav-link">
                  Trang chủ
                </Link>
                <Link to={configRoutes.about} className="nav-item nav-link">
                  Giới thiệu
                </Link>
                {/* <Link to={configRoutes.gallery} className="nav-item nav-link">
                  Thư viện ảnh
                </Link> */}
              </div>

              <div className="d-flex align-items-center flex-nowrap pt-xl-0">
                { (
                  <>
                    <button
                      className="btn btn-secondary btn-secondary-outline-0 rounded-pill py-2 px-3 ms-4"
                      
                    >
                      Đăng nhập
                    </button>
                    <button
                   
                      className="btn btn-primary btn-primary-outline-0 rounded-pill py-2 px-3 ms-4"
                    >
                      Đăng ký ngay
                    </button>
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
