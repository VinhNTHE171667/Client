import classNames from "classnames/bind";
import { useEffect, useState } from "react";

import styles from "./SystemLayout.module.scss";
import SidebarSystem from "./Sidebar";
import HeaderSystem from "./Header";
// import DrawerRight from "./Drawer";
import { Outlet } from "react-router-dom";
import "@/assets/scss/system.scss";
// import "@/assets/scss/homepage.scss";

const cx = classNames.bind(styles);

const SystemLayoutReposive = () => {
  // Use State -------------------------------------------------------------------------------------------------
  const [isToggleNavbar, setIsToggleNavbar] = useState(false);
  // const [drawerRightState, setDrawerRightState] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={cx("wrapper")}>
      <SidebarSystem
        isToggleNavbar={isToggleNavbar}
        setIsToggleNavbar={setIsToggleNavbar}
      />

      <div
        className={cx(
          "content-wrapper",
          `${isToggleNavbar && !isMobile ? "toggle-nav" : ""}`
        )}
      >
        <HeaderSystem
          isToggleNavbar={isToggleNavbar}
          setToogleNavbar={setIsToggleNavbar}
          // drawerRightState={drawerRightState}
          // setDrawerRightState={setDrawerRightState}
        />
        {/* <DrawerRight
          onClose={() => setDrawerRightState(false)}
          visible={drawerRightState}
        /> */}
        <div className={cx("content")}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SystemLayoutReposive;
