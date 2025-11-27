import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import ReduxProvider from "./components/ReduxProvider/index.tsx";
import { ToastContainer } from "react-toastify";
import AntdThemeProvider from "./components/AntdThemeProvider/index.tsx";
import ErrorBoundary from "./components/ErrorBoundary/index.tsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReduxProvider>
        <AntdThemeProvider>
          <ToastContainer />
          <App />
        </AntdThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  </StrictMode>
);
