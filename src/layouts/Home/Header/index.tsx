import "@/assets/css/style.css";
import { configRoutes } from "@/constants/route";
import { GiHamburgerMenu } from "react-icons/gi";
import { BellOutlined, DownOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/img/Logo/mainLogo.png";
import styles from "./Header.module.scss";
import classNames from "classnames/bind";
import { Avatar, Dropdown, Badge, Space, Tag, Button, Divider } from "antd";
import { useEffect, useRef } from "react";
import { showError } from "@/libs/toast";
import dayjs from "dayjs";
import {
  useGetUnreadNotificationsByUserQuery,
  type NotificationProps
} from "@/services/auth";
import { useAuthStore } from "@/hooks/UseAuth";

const cx = classNames.bind(styles);

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCustomer, logout, auth, isLoggedIn } = useAuthStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: unreadData,
    error: notificationsError,
    refetch: refetchUnread,
  } = useGetUnreadNotificationsByUserQuery(
    { userId: auth.accountId || "", userType: "customer" },
    { skip: !auth.accountId }
  );

  useEffect(() => {
    if (auth.accountId) {
      intervalRef.current = setInterval(() => {
        refetchUnread();
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [auth.accountId, refetchUnread]);

  useEffect(() => {
    if (notificationsError) {
      showError(
        "Lỗi tải thông báo",
        notificationsError instanceof Error ? notificationsError.message : "Unknown error"
      );
    }
  }, [notificationsError]);

  const recentNotifications = (unreadData || []).slice(0, 5);
  const unreadCount = unreadData?.length || 0;
  const userInitial = auth?.fullName?.[0]?.toUpperCase() || "U";

  const dropdownItems = [
    { key: "1", label: "Trang cá nhân", onClick: () => navigate(configRoutes.profile) },
    { key: "2", label: "Giỏ dịch vụ", onClick: () => navigate(configRoutes.cart) },
    { key: "3", label: "Lịch đặt của tôi", onClick: () => navigate(configRoutes.customerOrders) },
    { key: "4", label: "Voucher của tôi", onClick: () => navigate(configRoutes.customerVouchers) },
    { key: "5", label: "Đăng xuất", onClick: logout },
  ];

  const notificationOverlay = (
    <div
      style={{
        width: 320,
        maxHeight: 400,
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid #f0f0f0",
        padding: "8px 0",
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: 600 }}>
        Thông báo mới ({unreadCount})
      </div>
      <Space direction="vertical" style={{ width: "100%" }}>
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notif: NotificationProps) => (
            <Link
              key={notif.id}
              to="/customer/notifications"
              style={{
                display: "block",
                padding: "12px 16px",
                textDecoration: "none",
                color: "#000",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>{notif.title}</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {notif.content.length > 50 ? notif.content.substring(0, 50) + "..." : notif.content}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#999",
                }}
              >
                <span>{dayjs(notif.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                <Tag color="blue">{notif.type}</Tag>
              </div>
            </Link>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
            <BellOutlined style={{ fontSize: 48, opacity: 0.5 }} />
            <div>Không có thông báo mới</div>
          </div>
        )}

        {unreadCount > 5 && (
          <div style={{ textAlign: "center", padding: 12 }}>
            <Button type="link" size="small" onClick={() => navigate("/customer/notifications")}>
              Xem tất cả ({unreadCount})
            </Button>
          </div>
        )}

        <Divider style={{ margin: "8px 0" }} />

        <div style={{ textAlign: "center", padding: 12 }}>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate("/customer/notifications")}
            block
          >
            Xem chi tiết
          </Button>
        </div>
      </Space>
    </div>
  );

  // Ẩn header khi scroll xuống
  useEffect(() => {
    const header = document.getElementById("sticky-header");
    let lastScroll = 0;

    const handleScroll = () => {
      if (!header) return;

      const currentScroll = window.scrollY;

      if (currentScroll <= 0) {
        header.style.top = "0px";
        return;
      }

      if (currentScroll > lastScroll && currentScroll > 200) {
        header.style.top = "-200px";
      } else {
        header.style.top = "0px";
      }

      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container-fluid px-0">
      <div id="sticky-header" className={`container-fluid bg-header ${styles.stickyHeader}`}>
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
                    location.pathname === configRoutes.services && "active"
                  )}
                >
                  Dịch vụ
                </Link>

                <Link
                  to={configRoutes.doctocList}
                  className={cx(
                    "nav-item",
                    "nav-link",
                    "px-lg-3",
                    "my-3",
                    "fw-bolder",
                    "text-uppercase",
                    location.pathname === configRoutes.doctocList && "active"
                  )}
                >
                  Bác sĩ
                </Link>
              </div>

              <div className="d-flex align-items-center flex-nowrap pt-xl-0">

                {isLoggedIn && isCustomer && (
                  <div className="d-flex align-items-center me-3">
                    <Dropdown
                      overlay={notificationOverlay}
                      trigger={["click"]}
                      placement="bottomRight"
                      getPopupContainer={(trigger) => trigger.parentElement!}
                    >
                      <Badge count={unreadCount} offset={[-10, 10]} size="small">
                        <Button
                          type="text"
                          icon={<BellOutlined style={{ fontSize: 20 }} />}
                          shape="circle"
                          size="large"
                        />
                      </Badge>
                    </Dropdown>
                  </div>
                )}

                {isLoggedIn ? (
                  <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
                    <div className="d-flex align-items-center ms-4" style={{ cursor: "pointer", gap: "0.5rem" }}>
                      {auth.avatar ? (
                        <Avatar size="large" src={auth.avatar} />
                      ) : (
                        <Avatar size="large">{userInitial}</Avatar>
                      )}
                      <span className="d-none d-xl-block fw-bold text-dark">
                        {auth.fullName || "Tài khoản"}
                      </span>
                      <DownOutlined style={{ fontSize: 12, color: "#999" }} />
                    </div>
                  </Dropdown>
                ) : (
                  <button
                    className={`fw-bold ms-4 px-3 ${styles.btnCustomLogin}`}
                    onClick={() => navigate(configRoutes.login)}
                  >
                    Đăng nhập
                  </button>
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
