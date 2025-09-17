import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/assets/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import ReduxProvider from "./components/ReduxProvider/index.tsx";
import { ToastContainer } from "react-toastify";
import AntdThemeProvider from "./components/AntdThemeProvider/index.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider>
      <AntdThemeProvider>
        <ToastContainer />
        <App />
      </AntdThemeProvider>
    </ReduxProvider>
  </StrictMode>
);
