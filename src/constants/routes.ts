/**
 * Centralised route definitions. Always reference ROUTES.* instead of
 * hard-coding path strings so links stay in sync with the router.
 */
export const ROUTES = {
  login: '/login',

  dashboard: '/',
  analytics: '/analytics',

  orders: '/orders',
  orderDetail: (id = ':orderId') => `/orders/${id}`,

  products: '/products',
  categories: '/categories',

  drivers: '/drivers',
  driverDetail: (id = ':driverId') => `/drivers/${id}`,
  reports: '/reports',
  packers: '/packers',
  transactions: '/transactions',
  riderFinance: '/rider-finance',
  internalBilling: '/internal-billing',

  customers: '/customers',
  customerDetail: (id = ':customerId') => `/customers/${id}`,
  broadcast: '/broadcast',
  stores: '/stores',
  admins: '/admins',
  roles: '/roles',

  // Content management
  homeFeed: '/home-feed',
  banners: '/banners',
  onboarding: '/onboarding',
  content: '/content',

  // Promotions & configuration
  coupons: '/coupons',
  delivery: '/delivery',

  settings: '/settings',
} as const
