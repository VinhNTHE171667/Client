import { createBrowserRouter } from "react-router-dom";
import Homepage from "../pages/Homepage";
import HomeLayouts from "../layouts/Home";
import { configRoutes } from "@/constants/route";
import AboutPage from "@/pages/About/page";
import LoginPage from "@/pages/Auth/Login";
import RegisterPage from "@/pages/Auth/Register";
import { RoleEnum } from "@/common/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import SystemLayoutReposive from "@/layouts/System";
import AdminDashboardPage from "@/pages/Admin/Dashboard";
import AccountCustomer from "@/pages/Admin/AccountCustomer";
import Categories from "@/pages/Admin/Categories";
import AccountStaff from "@/pages/Admin/AccountStaff";

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
  {
    path: configRoutes.login,
    element: <HomeLayouts />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: configRoutes.register,
    element: <HomeLayouts />,
    children: [{ index: true, element: <RegisterPage /> }],
  },

  {
    path: configRoutes.adminDashboard,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminCustomers,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <AccountCustomer />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminCategories,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <Categories />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminInternals,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <AccountStaff />,
          },
        ],
      },
    ],
  },
]);

export default router;
