export const configRoutes = {
  home: "/",
  about: "/about",
  login: "/login",
  register: "/register",
  services: "/services",
  serviceDetail: "/services/:id",

  profile: "/profile",
  cart: "/cart",
  bookings: "/bookings",
  doctorProfile: "/services/doctor/:id",
  customerOrders: "/customer/orders",
  customerPayments: "/customer/payments",

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

  staffDashboard: "/staff/dashboard",
  staffOrders: "/staff/orders",

  doctorDashboard: "/doctor/dashboard",
  doctorOrderManagement: "/doctor/orders",

  // casherDashboard: "/casher/dashboard",
  casherOrderManagement: "/casher/orders",
};

export const configError = {
  NotFound: "/notfound",
  UnAuthorize: "/unauthorize",
  Network: "/network",
};
