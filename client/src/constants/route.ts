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
  paymentSuccess: "/customer/payments/success",
  paymentFail: "/customer/payments/fail",

  adminDashboard: "/admin/dashboard",
  adminCustomers: "/admin/customers",
  adminCategories: "/admin/categories",
  adminInternals: "/admin/internals",
  adminDoctors: "/admin/doctors",
  adminServices: "/admin/services",
  adminVouchers: "/admin/vouchers",

  staffDashboard: "/staff/dashboard",
  staffOrders: "/staff/orders",
};

export const configError = {
  NotFound: "/notfound",
  UnAuthorize: "/unauthorize",
  Network: "/network",
};
