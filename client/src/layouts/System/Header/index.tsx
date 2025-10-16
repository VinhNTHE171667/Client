/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from "classnames/bind";
import { GiHamburgerMenu } from "react-icons/gi";
import { useEffect, useState } from "react";

import styles from "./Header.module.scss";
import { Button, Space, Tooltip } from "antd";
import { RiMenuFoldFill } from "react-icons/ri";
import { useAuthStore } from "@/hooks/UseAuth";
import { IoSettingsSharp } from "react-icons/io5";

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
