// import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import "@/assets/scss/page.scss";
import { ChatWidget } from "@/features/chatbot";
// type HomePageLayoutProps = {
//   children: ReactNode;
// };

const HomeLayouts = () => {
  return (
    <>
      {/* <Header />

      <main style={{ paddingTop: "100px" }}>
        <Outlet />
      </main>
      <ChatWidget /> */}
      {/* <Footer /> */}
      <div>
        <Header />
        {/* Ensure the page content sits below the fixed header. Header height ~5rem; add a bit more spacing. */}
        <main style={{ paddingTop: "6rem" }}>
          <Outlet />
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </>
  );
};

export default HomeLayouts;
