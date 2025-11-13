import {
  MdCardMembership,
  MdCategory,
  // MdCardMembership,
  // MdCategory,
  MdDashboard,
  MdFeedback,
  MdPeopleAlt,
  // MdScheduleSend,
  // MdSpa,
} from "react-icons/md";
// import { RiAdminFill, RiTeamFill } from "react-icons/ri";
import { RoleEnum } from "@/common/types/auth";
// import { FaChalkboardTeacher, FaUser } from "react-icons/fa";
import { configRoutes } from "@/constants/route";
import { RiUser3Fill } from "react-icons/ri";
import { FaFileInvoiceDollar, FaTags, FaUserDoctor } from "react-icons/fa6";
import { GiFlowerEmblem } from "react-icons/gi";
// import { IoChatboxEllipses } from "react-icons/io5";

export type SiderItem = {
  name: string;
  icon: React.ReactNode;
  link: string;
  activeLink: string[];
};

export const getSidebarItemsByRole = (role: string): SiderItem[] => {
  const AdminSidebar = (): SiderItem[] => [
    {
      name: "Dashboard",
      link: configRoutes.adminDashboard,
      icon: <MdDashboard />,
      activeLink: [configRoutes.adminDashboard],
    },
    {
      name: "Khách hàng",
      link: configRoutes.adminCustomers,
      icon: <RiUser3Fill className="ml-3" />,
      activeLink: [configRoutes.adminCustomers],
    },
    {
      name: "Nhân viên",
      link: configRoutes.adminInternals,
      icon: <MdPeopleAlt className="ml-3" />,
      activeLink: [configRoutes.adminInternals],
    },
    {
      name: "Bác sĩ",
      link: configRoutes.adminDoctors,
      icon: <FaUserDoctor className="ml-3" />,
      activeLink: [configRoutes.adminDoctors],
    },
    {
      name: "Danh mục",
      link: configRoutes.adminCategories,
      icon: <MdCategory className="ml-3" />,
      activeLink: [configRoutes.adminCategories],
    },
    {
      name: "Dịch vụ",
      link: configRoutes.adminServices,
      icon: <GiFlowerEmblem className="ml-3" />,
      activeLink: [configRoutes.adminServices],
    },
    {
      name: "Khuyến mãi",
      link: configRoutes.adminVouchers,
      icon: <FaTags className="ml-3" />,
      activeLink: [configRoutes.adminVouchers],
    },
    {
      name: "Hạng thành viên",
      link: configRoutes.adminMemberships,
      icon: <MdCardMembership className="ml-3" />,
      activeLink: [configRoutes.adminMemberships],
    },
    {
      name: "Hoá đơn",
      link: configRoutes.casherInvoice,
      icon: <FaFileInvoiceDollar className="ml-3" />,
      activeLink: [configRoutes.casherInvoice],
    },
    {
      name: "Đơn hàng",
      link: configRoutes.staffOrders,
      icon: <MdPeopleAlt className="ml-3" />,
      activeLink: [configRoutes.staffOrders],
    },
    {
      name: "Feedback",
      link: configRoutes.staffFeedback,
      icon: <MdFeedback className="ml-3" />,
      activeLink: [configRoutes.staffFeedback],
    },
  ];

  const StaffSidebar = (): SiderItem[] => [
    {
      name: "Đơn hàng",
      link: configRoutes.staffOrders,
      icon: <MdPeopleAlt className="ml-3" />,
      activeLink: [configRoutes.staffOrders],
    },
    {
      name: "Feedback",
      link: configRoutes.staffFeedback,
      icon: <MdFeedback className="ml-3" />,
      activeLink: [configRoutes.staffFeedback],
    },
    // {
    //   name: "Khách hàng",
    //   link: configRoutes.staffCustomers,
    //   icon: <RiUser3Fill className="ml-3" />,
    //   activeLink: [configRoutes.staffCustomers],
    // },
    // {
    //   name: "Bác sĩ",
    //   link: configRoutes.staffDoctors,
    //   icon: <FaUserDoctor className="ml-3" />,
    //   activeLink: [configRoutes.staffDoctors],
    // },
  ];

  const DoctorSidebar = (): SiderItem[] => [
    {
      name: "Đơn hàng",
      link: configRoutes.doctorOrderManagement,
      icon: <MdPeopleAlt className="ml-3" />,
      activeLink: [configRoutes.doctorOrderManagement],
    },
  ];

  const CashierSidebar = (): SiderItem[] => [
    {
      name: "Quản lý đơn hàng",
      link: configRoutes.casherOrderManagement,
      icon: <MdDashboard />,
      activeLink: [configRoutes.casherOrderManagement],
    },
    {
      name: "Hoá đơn",
      link: configRoutes.casherInvoice,
      icon: <FaFileInvoiceDollar className="ml-3" />,
      activeLink: [configRoutes.casherInvoice],
    },
  ];

  // const SpaAdminSidebar = (): SiderItem[] => [
  //   {
  //     name: "Dashboard",
  //     link: configRoutes.spaDashboard,
  //     icon: <MdDashboard />,
  //     activeLink: [configRoutes.spaDashboard],
  //   },
  //   {
  //     name: "Quản trị viên",
  //     link: configRoutes.spaAdmin,
  //     icon: <RiAdminFill className="ml-3" />,
  //     activeLink: [configRoutes.spaAdmin],
  //   },
  //   {
  //     name: "Nhân viên",
  //     link: configRoutes.spaStaff,
  //     icon: <RiTeamFill className="ml-3" />,
  //     activeLink: [configRoutes.spaStaff],
  //   },
  //   {
  //     name: "Chuyên viên",
  //     link: configRoutes.spaSpecialist,
  //     icon: <FaChalkboardTeacher className="ml-3" />,
  //     activeLink: [configRoutes.spaSpecialist],
  //   },
  //   {
  //     name: "Dịch vụ",
  //     link: configRoutes.serviceManagement,
  //     icon: <FaSprayCanSparkles className="ml-3" />,
  //     activeLink: [configRoutes.serviceManagement],
  //   },
  //   {
  //     name: "Lịch hẹn",
  //     link: configRoutes.spaBooking,
  //     icon: <MdScheduleSend className="ml-3" />,
  //     activeLink: [configRoutes.spaBooking],
  //   },
  //   {
  //     name: "Gói dịch vụ Spa",
  //     link: configRoutes.spaMembership,
  //     icon: <MdCardMembership className="ml-3" />,
  //     activeLink: [configRoutes.spaMembership],
  //   },
  //   {
  //     name: "Chat Bot",
  //     link: configRoutes.spaChatBot,
  //     icon: <IoChatboxEllipses className="ml-3" />,
  //     activeLink: [configRoutes.spaChatBot],
  //   },
  // ];

  // const SpaStaffSidebar = (): SiderItem[] => [
  //   // {
  //   //   name: "Dashboard",
  //   //   link: configRoutes.staffDashboard,
  //   //   icon: <MdDashboard />,
  //   //   activeLink: [configRoutes.staffDashboard],
  //   // },
  //   {
  //     name: "Lịch hẹn",
  //     link: configRoutes.staffBooking,
  //     icon: <MdScheduleSend className="ml-3" />,
  //     activeLink: [configRoutes.staffBooking],
  //   },
  // ];

  switch (role) {
    case RoleEnum.Admin:
      return AdminSidebar();
    case RoleEnum.Staff:
      return StaffSidebar();
    case RoleEnum.Doctor:
      return DoctorSidebar();
    case RoleEnum.Casher:
      return CashierSidebar();
    default:
      return [];
  }
};
