/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from "classnames/bind";
import { GiHamburgerMenu } from "react-icons/gi";
import {
  Tag,
  Button,
  Divider,
  Space,
  Avatar,
  Dropdown,
  Badge,
  Tooltip,
} from "antd";
import { RiMenuFoldFill } from "react-icons/ri";
import { IoSettingsSharp } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.scss";
import { useAuthStore } from "@/hooks/UseAuth";
import dayjs from "dayjs";
import {
  useGetUnreadNotificationsByUserQuery,
  type NotificationProps,
} from "@/services/auth";
import { showError } from "@/libs/toast";
import { ArrowBigDown, Bell, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

type HeaderSystemProps = {
  isToggleNavbar: boolean;
  setToogleNavbar?: any;
  // drawerRightState?: boolean;
  setDrawerRightState?: any;
};

const HeaderSystem = ({
  isToggleNavbar,
  setToogleNavbar,
  setDrawerRightState,
}: HeaderSystemProps) => {
  // useState -------------------------------------------------------------------------------------------------
  // Route

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ❌❌ Responsive Only ❌❌//
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { auth } = useAuthStore();
  const navigate = useNavigate();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const userType =
    auth.roles?.toLowerCase() == "doctor" ? "doctor" : "internal";

  const {
    data: unreadData,
    error: notificationsError,
    refetch: refetchUnread,
  } = useGetUnreadNotificationsByUserQuery(
    { userId: auth.accountId || "", userType },
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
        notificationsError instanceof Error
          ? notificationsError.message
          : "Unknown error"
      );
    }
  }, [notificationsError]);

  const recentNotifications = (unreadData || []).slice(0, 5);
  const unreadCount = unreadData?.length || 0;
  const userInitial = auth?.fullName?.[0]?.toUpperCase() || "U";

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
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          fontWeight: 600,
        }}
      >
        Thông báo mới ({unreadCount})
      </div>
      <Space direction="vertical" style={{ width: "100%" }}>
        {recentNotifications.length > 0 ? (
          recentNotifications.map((notif: NotificationProps) => (
            <div
              key={notif.id}
              style={{
                display: "block",
                padding: "12px 16px",
                textDecoration: "none",
                color: "#000",
                borderBottom: "1px solid #f5f5f5",
                cursor: "pointer",
              }}
              onClick={() => {
                if (auth.roles?.toLowerCase() == "doctor") {
                  navigate("/doctor/notifications");
                } else {
                  navigate("/system/notifications");
                }
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                {notif.title}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {notif.content.length > 50
                  ? notif.content.substring(0, 50) + "..."
                  : notif.content}
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
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
            <BellOff style={{ fontSize: 48, opacity: 0.5 }} />
            <div>Không có thông báo mới</div>
          </div>
        )}

        {unreadCount > 5 && (
          <div style={{ textAlign: "center", padding: 12 }}>
            <Button
              type="link"
              size="small"
              onClick={() => navigate("/system/notifications")}
            >
              Xem tất cả ({unreadCount})
            </Button>
          </div>
        )}

        <Divider style={{ margin: "8px 0" }} />

        <div style={{ textAlign: "center", padding: 12 }}>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate("/system/notifications")}
            block
          >
            Xem chi tiết
          </Button>
        </div>
      </Space>
    </div>
  );

  const userDropdownItems = [];

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className={cx("header-wrapper")}>
      <div className={cx("header-content")}>
        {isMobile && (
          <div
            className={cx("icon-menu-wrapper")}
            onClick={() => setToogleNavbar(true)}
            style={{
              transition: "transform 0.1s ease-in-out",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.9)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isToggleNavbar ? (
              <RiMenuFoldFill size={26} className={cx("icon-menu")} />
            ) : (
              <GiHamburgerMenu size={26} className={cx("icon-menu")} />
            )}
          </div>
        )}

        <h2
          className={cx(
            "school-name",
            "title",
            "font-Nunito",
            `${isToggleNavbar ? "isToggleSidebar" : ""}`
          )}
        >
          <Space>
            {auth.roles != "Admin" && auth.roles != "Customer"}

            {!isMobile && (
              <></>
              // <Space size='large'>
              //   <div>
              //     <BiSolidSchool className={cx('school-icon')} />{' '}
              //     {/* <Select
              //       value={{
              //         value: selectedSchool,
              //         label:
              //           schoolList?.find(s => s.id === selectedSchool)?.schoolName ||
              //           'Chọn trường'
              //       }}
              //       options={schoolList?.map((school: any) => {
              //         return {
              //           value: school.id,
              //           label: school.schoolName
              //         };
              //       })}
              //       placeholder='Chọn trường'
              //       onChange={handleSetSchool}
              //       style={{ width: 250 }}
              //       labelInValue
              //       disabled={!isSuperAdmin}
              //     /> */}
              //   </div>

              //   {!isStudent && (
              //     <div>
              //       <BiCalendar className={cx('school-icon')} />
              //       <Select
              //         value={{
              //           value: selectedAcademic,
              //           label:
              //             academics?.find(a => a.academicYearID === selectedAcademic)
              //               ?.academicYearName || 'Chọn năm học'
              //         }}
              //         options={academics?.map((academic: AcademicYears) => {
              //           return {
              //             value: academic.academicYearID,
              //             label: academic.academicYearName
              //           };
              //         })}
              //         placeholder='Chọn năm học'
              //         onChange={value => {
              //           console.log(value);
              //           handleSetAcademic(value);
              //         }}
              //         style={{ width: 150 }}
              //         labelInValue
              //       />
              //     </div>
              //   )}
              // </Space>
            )}

            {isMobile && (
              <Tooltip title="Cài đặt">
                <Button
                  shape="circle"
                  icon={
                    <h2 className={cx("title", "font-Nunito")}>
                      <IoSettingsSharp />
                    </h2>
                  }
                  onClick={() => setDrawerRightState(true)}
                  className={cx(
                    "school-name",
                    "title",
                    "font-Nunito",
                    `${isToggleNavbar ? "isToggleSidebar" : ""}`
                  )}
                  type="text"
                />
              </Tooltip>
            )}
          </Space>
        </h2>

        {/* Notification and User Dropdown */}
        <div className="d-flex align-items-center" style={{ gap: "1rem" }}>
          <Dropdown
            overlay={notificationOverlay}
            trigger={["click"]}
            placement="bottomRight"
            getPopupContainer={(trigger) => trigger.parentElement!}
          >
            <Badge count={unreadCount} offset={[-10, 10]} size="small">
              <Button
                type="text"
                icon={<Bell style={{ fontSize: 20 }} />}
                shape="circle"
                size="large"
              />
            </Badge>
          </Dropdown>

          <Dropdown menu={{ items: userDropdownItems }} trigger={["click"]}>
            <div
              className="d-flex align-items-center"
              style={{ cursor: "pointer", gap: "0.5rem" }}
            >
              {auth.avatar ? (
                <Avatar size="large" src={auth.avatar} />
              ) : (
                <Avatar size="large">{userInitial}</Avatar>
              )}
              {!isMobile && (
                <span className="d-none d-xl-block fw-bold text-dark">
                  {auth.fullName || "Tài khoản"}
                </span>
              )}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* {!isMobile && (
        <div className={cx('link-wrapper')}>
           <nav aria-label='breadcrumb'>
            <ol
              className={cx('breadcrumb justify-content-center align-items-center mb-0')}
            >
              <li className={cx('breadcrumb-item', 'bg-hero-breadcrumb-item')}>
                <Link
                  style={{
                    color: 'var(--text-nav-link) !important',
                    position: 'relative',
                    zIndex: 10
                  }}
                  to={'/dashboard'}
                >
                  <p className={cx('dashboard-link-wrapper')}>
                    <MdSpaceDashboard className={cx('dashboard-link-icon')} />
                    Bảng điều khiển
                  </p>
                </Link>
              </li>
              {routeActive?.link !== 'dashboard' && (
                <li
                  className={cx('breadcrumb-item', 'bg-hero-breadcrumb-item')}
                  aria-current='page'
                >
                  {routeActive?.name}
                </li>
              )}
            </ol>
          </nav> 
        </div>
      )} */}
    </div>
  );
};

export default HeaderSystem;
