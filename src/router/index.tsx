import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ROUTES } from '@/constants/routes'

import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import OrderDetailPage from '@/pages/orders/OrderDetailPage'
import ProductsPage from '@/pages/products/ProductsPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import SuppliersPage from '@/pages/suppliers/SuppliersPage'
import DriversPage from '@/pages/drivers/DriversPage'
import DriverDetailPage from '@/pages/drivers/DriverDetailPage'
import ReportsPage from '@/pages/operations/ReportsPage'
import PackersPage from '@/pages/operations/PackersPage'
import TransactionsPage from '@/pages/finance/TransactionsPage'
import RiderFinancePage from '@/pages/finance/RiderFinancePage'
import InternalBillingPage from '@/pages/finance/InternalBillingPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage'
import BroadcastPage from '@/pages/customers/BroadcastPage'
import AdminsPage from '@/pages/admins/AdminsPage'
import StoresPage from '@/pages/stores/StoresPage'
import BannersPage from '@/pages/marketing/BannersPage'
import OnboardingPage from '@/pages/marketing/OnboardingPage'
import HomeFeedPage from '@/pages/marketing/HomeFeedPage'
import ContentPagesPage from '@/pages/content/ContentPagesPage'
import CouponsPage from '@/pages/promotions/CouponsPage'
import DeliveryZonesPage from '@/pages/operations/DeliveryZonesPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: <LoginPage />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.analytics, element: <AnalyticsPage /> },
          { path: ROUTES.orders, element: <OrdersPage /> },
          { path: ROUTES.orderDetail(), element: <OrderDetailPage /> },
          { path: ROUTES.products, element: <ProductsPage /> },
          { path: ROUTES.categories, element: <CategoriesPage /> },
          { path: ROUTES.suppliers, element: <SuppliersPage /> },
          { path: ROUTES.drivers, element: <DriversPage /> },
          { path: ROUTES.driverDetail(), element: <DriverDetailPage /> },
          { path: ROUTES.reports, element: <ReportsPage /> },
          { path: ROUTES.packers, element: <PackersPage /> },
          { path: ROUTES.transactions, element: <TransactionsPage /> },
          { path: ROUTES.riderFinance, element: <RiderFinancePage /> },
          { path: ROUTES.internalBilling, element: <InternalBillingPage /> },
          { path: ROUTES.customers, element: <CustomersPage /> },
          { path: ROUTES.customerDetail(), element: <CustomerDetailPage /> },
          { path: ROUTES.broadcast, element: <BroadcastPage /> },
          { path: ROUTES.stores, element: <StoresPage /> },
          { path: ROUTES.admins, element: <AdminsPage /> },
          // Roles now live as a tab inside Admins — keep the old path working.
          { path: ROUTES.roles, element: <Navigate to={ROUTES.admins} replace /> },
          { path: ROUTES.delivery, element: <DeliveryZonesPage /> },
          { path: ROUTES.coupons, element: <CouponsPage /> },
          { path: ROUTES.homeFeed, element: <HomeFeedPage /> },
          { path: ROUTES.banners, element: <BannersPage /> },
          { path: ROUTES.onboarding, element: <OnboardingPage /> },
          { path: ROUTES.content, element: <ContentPagesPage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
])
