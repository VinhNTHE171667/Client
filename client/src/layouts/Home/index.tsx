// import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";

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
