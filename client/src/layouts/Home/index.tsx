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
      <Header />

      <main style={{ paddingTop: "100px" }}>
        <Outlet />
      </main>

      <Footer />
    </>
  );
};

export default HomeLayouts;
