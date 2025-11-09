import { createBrowserRouter } from "react-router-dom";
import Homepage from "../pages/Homepage";
import HomeLayouts from "../layouts/Home";
import { configError, configRoutes } from "@/constants/route";
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
import Services from "@/pages/Admin/Service";
import AccountDoctor from "@/pages/Admin/AccountDoctor";
import ServicesComp from "@/pages/Services";
import ServiceDetail from "@/pages/Services/ServiceDetail";
import CartPage from "@/pages/Customer/Cart";
import Booking from "@/pages/Customer/Bookings";
import Profile from "@/pages/Customer/Profile";
import DoctorPublicProfile from "@/pages/Services/DoctorProfile";
import CustomerOrders from "@/pages/Customer/Order";
import OrderManagementStaff from "@/pages/Staff/OrderManagement";
import OrderManagementDoctor from "@/pages/Doctor/OrderManagement";
import DoctorDashboard from "@/pages/Doctor/Dashboard";
import OrderManagementCasher from "@/pages/Casher/OrderManagement";
import SuccessPaymentDeposited from "@/pages/Customer/Payment/Deposited/success";
import FailPaymentDeposited from "@/pages/Customer/Payment/Deposited/fail";
import SuccessPaymentPaid from "@/pages/Customer/Payment/Paid/success";
import FailPaymentPaid from "@/pages/Customer/Payment/Paid/fail";
import Vouchers from "@/pages/Admin/Voucher";
import Membership from "@/pages/Admin/Membership";
import ForgotPasswordPage from "@/pages/Auth/ForgotPassword";
import ForbiddenPage from "@/pages/Error/ForbiddenPage";
import NotFoundPage from "@/pages/Error/NotFound";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import FeedbackManagementStaff from "@/pages/Staff/Feedback";

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
    element: <LoginPage />,
    // children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: configRoutes.register,
    element: <RegisterPage />,
  },

  {
    path: configRoutes.services,
    element: <HomeLayouts />,
    children: [
      {
        element: <ServicesComp />,
        index: true,
      },
    ],
  },
  {
    path: configRoutes.serviceDetail,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <ServiceDetail />,
      },
    ],
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

  {
    path: configRoutes.adminDoctors,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <AccountDoctor />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminServices,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <Services />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.cart,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <CartPage />,
      },
    ],
  },

  {
    path: configRoutes.bookings,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <Booking />,
      },
    ],
  },

  {
    path: configRoutes.profile,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <Profile />,
      },
    ],
  },

  {
    path: configRoutes.doctorProfile,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <DoctorPublicProfile />,
      },
    ],
  },

  {
    path: configRoutes.customerOrders,
    element: <HomeLayouts />,
    children: [
      {
        index: true,
        element: <CustomerOrders />,
      },
    ],
  },

  {
    path: configRoutes.paymentSuccessDeposit,
    element: <SuccessPaymentDeposited />,
  },

  {
    path: configRoutes.paymentFailDeposit,
    element: <FailPaymentDeposited />,
  },

  {
    path: configRoutes.paymentSuccessPaid,
    element: <SuccessPaymentPaid />,
  },

  {
    path: configRoutes.paymentFailPaid,
    element: <FailPaymentPaid />,
  },

  {
    path: configRoutes.staffOrders,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Staff]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <OrderManagementStaff />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.doctorDashboard,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Doctor]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <DoctorDashboard />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.doctorOrderManagement,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Doctor]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <OrderManagementDoctor />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.casherOrderManagement,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Casher]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <OrderManagementCasher />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminVouchers,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <Vouchers />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.adminMemberships,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Admin]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <Membership />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.staffFeedback,
    element: <ProtectedRoute allowedRoles={[RoleEnum.Staff]} />,
    children: [
      {
        element: <SystemLayoutReposive />,
        children: [
          {
            index: true,
            element: <FeedbackManagementStaff />,
          },
        ],
      },
    ],
  },

  {
    path: configRoutes.forgotPassword,
    element: <ForgotPasswordPage />,
  },
  {
    path: configRoutes.resetPassword,
    element: <ResetPasswordPage />,
  },

  {
    path: configError.UnAuthorize,
    element: <ForbiddenPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
