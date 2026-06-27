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
  KeyRound,
  LayoutTemplate,
  TicketPercent,
  Truck,
  MessageSquareWarning,
  Wallet,
  PackageCheck,
  Megaphone,
  Fuel,
  Store,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { StoreFeatureKey } from '@/types/common.types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Optional end-match for index route. */
  end?: boolean
  /**
   * Dark-store module this nav item belongs to. When a specific store is
   * selected and this module is disabled for it, the item is hidden.
   * Items with no feature (master/content tools) are always shown.
   */
  feature?: StoreFeatureKey
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
      { label: 'Analytics', to: ROUTES.analytics, icon: BarChart3, feature: 'reports' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', to: ROUTES.orders, icon: ShoppingBag, feature: 'orders' },
      { label: 'Drivers', to: ROUTES.drivers, icon: Bike, feature: 'delivery' },
      { label: 'Packers', to: ROUTES.packers, icon: PackageCheck, feature: 'staff' },
      { label: 'Reports & Reviews', to: ROUTES.reports, icon: MessageSquareWarning, feature: 'reports' },
      { label: 'Delivery & Zones', to: ROUTES.delivery, icon: Truck, feature: 'delivery' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Transactions', to: ROUTES.transactions, icon: Wallet, feature: 'cash' },
      { label: 'Rider Finance', to: ROUTES.riderFinance, icon: Fuel, feature: 'cash' },
      { label: 'Internal Billing', to: ROUTES.internalBilling, icon: ClipboardList, feature: 'cash' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: ROUTES.products, icon: Package, feature: 'products' },
      { label: 'Categories', to: ROUTES.categories, icon: LayoutGrid, feature: 'products' },
      { label: 'Coupons', to: ROUTES.coupons, icon: TicketPercent, feature: 'promotions' },
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
      { label: 'Customers', to: ROUTES.customers, icon: Users, feature: 'customers' },
      { label: 'Broadcast', to: ROUTES.broadcast, icon: Megaphone, feature: 'notifications' },
      { label: 'Dark Stores', to: ROUTES.stores, icon: Store },
      { label: 'Admins', to: ROUTES.admins, icon: ShieldCheck, feature: 'staff' },
      { label: 'Roles', to: ROUTES.roles, icon: KeyRound },
      { label: 'Settings', to: ROUTES.settings, icon: Settings, feature: 'settings' },
    ],
  },
]
