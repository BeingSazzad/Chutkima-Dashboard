import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LayoutGrid,
  Bike,
  Users,
  BarChart3,
  Settings,
  Image,
  Sparkles,
  FileText,
  ShieldCheck,
  LayoutTemplate,
  TicketPercent,
  Truck,
  MessageSquareWarning,
  Wallet,
  Megaphone,
  Fuel,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Optional end-match for index route. */
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard, end: true },
      { label: 'Analytics', to: ROUTES.analytics, icon: BarChart3 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', to: ROUTES.orders, icon: ShoppingBag },
      { label: 'Drivers', to: ROUTES.drivers, icon: Bike },
      { label: 'Reports & Reviews', to: ROUTES.reports, icon: MessageSquareWarning },
      { label: 'Delivery & Zones', to: ROUTES.delivery, icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Transactions', to: ROUTES.transactions, icon: Wallet },
      { label: 'Rider Finance', to: ROUTES.riderFinance, icon: Fuel },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: ROUTES.products, icon: Package },
      { label: 'Categories', to: ROUTES.categories, icon: LayoutGrid },
      { label: 'Coupons', to: ROUTES.coupons, icon: TicketPercent },
    ],
  },
  {
    // Everything dynamic shown on the app/website lives here.
    title: 'Content Management',
    items: [
      { label: 'Home Feed', to: ROUTES.homeFeed, icon: LayoutTemplate },
      { label: 'Banners', to: ROUTES.banners, icon: Image },
      { label: 'Onboarding', to: ROUTES.onboarding, icon: Sparkles },
      { label: 'Pages & FAQ', to: ROUTES.content, icon: FileText },
    ],
  },
  {
    title: 'People & Stores',
    items: [
      { label: 'Customers', to: ROUTES.customers, icon: Users },
      { label: 'Broadcast', to: ROUTES.broadcast, icon: Megaphone },
      { label: 'Dark Stores', to: ROUTES.stores, icon: Store },
      { label: 'Admins', to: ROUTES.admins, icon: ShieldCheck },
      { label: 'Settings', to: ROUTES.settings, icon: Settings },
    ],
  },
]
