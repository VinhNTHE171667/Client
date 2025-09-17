import { createBrowserRouter } from "react-router-dom";
import Homepage from "../pages/Homepage";
import HomeLayouts from "../layouts/Home";
import { configError, configRoutes } from "@/constants/route";
import AboutPage from "@/pages/About/page";

const router = createBrowserRouter([
  {
    path: configRoutes.home,
    element: <HomeLayouts />,
    children: [{ index: true, element: <Homepage /> }],
  },
  {
    path: configRoutes.about,
    element: <HomeLayouts />,
    children: [{ index: true, element: <AboutPage /> }],
  },

  ]);

export default router;