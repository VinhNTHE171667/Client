export const configRoutes = {
  home: "/",
  about: "/about",
  login: "/login",
  register: "/register",
  services: "/services",
  serviceDetail: "/services/:id",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  profile: "/profile",
  cart: "/cart",
  bookings: "/bookings",
  doctorProfile: "/services/doctor/:id",
  doctocList: "/services/doctors",
  customerOrders: "/customer/orders",
  customerPayments: "/customer/payments",
  customerVouchers: "/customer/vouchers",

  paymentSuccessPaid: "/casher/payments/success-paid",
  paymentFailPaid: "/casher/payments/fail-paid",
  paymentSuccessDeposit: "/customer/payments/success-deposit",
  paymentFailDeposit: "/customer/payments/fail-deposit",

  adminDashboard: "/admin/dashboard",
  adminCustomers: "/admin/customers",
  adminCategories: "/admin/categories",
  adminInternals: "/admin/internals",
  adminDoctors: "/admin/doctors",
  adminServices: "/admin/services",
  adminVouchers: "/admin/vouchers",
  adminMemberships: "/admin/memberships",
  adminSpaProfile: "/admin/spa-profile",

  staffOrders: "/staff/orders",
  staffFeedback: "/staff/feedback",
  staffProfile: "/staff/profile",

  doctorDashboard: "/doctor/dashboard",
  doctorOrderManagement: "/doctor/orders",
  doctorProfileManagement: "/doctor/profile",

  // casherDashboard: "/casher/dashboard",
  casherOrderManagement: "/casher/orders",
  casherProfile: "/casher/profile",
  casherInvoice: "/casher/invoices",
};

export const configError = {
  NotFound: "/notfound",
  UnAuthorize: "/unauthorize",
  Network: "/network",
};
