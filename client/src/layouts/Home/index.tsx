// import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import "@/assets/scss/page.scss";

// type HomePageLayoutProps = {
//   children: ReactNode;
// };

const HomeLayouts = () => {
  return (
    <>
      <div>
        <Header />
        <Outlet />
        <Footer />
      </div>
    </>
  );
};

export default HomeLayouts;
