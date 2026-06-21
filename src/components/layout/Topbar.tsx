import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Bike,
  CheckCheck,
  ChevronDown,
  CreditCard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/store/hooks'
import { toggleSidebar } from '@/store/uiSlice'

interface Notification {
  id: string
  icon: LucideIcon
  iconClass: string
  title: string
  desc: string
  time: string
  unread: boolean
  to: string
}

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', icon: ShoppingBag, iconClass: 'bg-brand-50 text-brand-600', title: 'New order #GF-48213-NP', desc: 'Bishnu Pokharel · NPR 390 · COD', time: '2m', unread: true, to: ROUTES.orders },
  { id: 'n2', icon: AlertTriangle, iconClass: 'bg-amber-50 text-amber-600', title: 'Low stock: Choco Delight', desc: 'Only 12 units left', time: '15m', unread: true, to: ROUTES.products },
  { id: 'n3', icon: Bike, iconClass: 'bg-violet-50 text-violet-600', title: 'Rider went offline', desc: 'Anil Karki ended his shift', time: '1h', unread: true, to: ROUTES.drivers },
  { id: 'n4', icon: CreditCard, iconClass: 'bg-green-50 text-green-600', title: 'Payment received', desc: 'eSewa · NPR 495', time: '2h', unread: false, to: ROUTES.orders },
]

export function Topbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS)
  const unreadCount = notifs.filter((n) => n.unread).length

  const openNotif = (n: Notification) => {
    setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
    setNotifOpen(false)
    navigate(n.to)
  }
  const markAllRead = () => setNotifs((list) => list.map((x) => ({ ...x, unread: false })))

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login, { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Store location pill */}
      <div className="hidden items-center gap-2 rounded-full bg-mint-100 px-3 py-1.5 sm:flex">
        <MapPin className="h-3.5 w-3.5 text-brand-600" />
        <span className="text-xs font-semibold text-brand-700">
          {BRAND.city} · Traffic Chowk Dark Store
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Open
        </span>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search orders, products, drivers…"
          className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm placeholder:text-slate-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="focus-ring relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card-hover">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotif(n)}
                      className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-mint-50', n.unread && 'bg-mint-50/60')}
                    >
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', n.iconClass)}>
                        <n.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{n.title}</p>
                        <p className="truncate text-xs text-slate-400">{n.desc}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] text-slate-400">{n.time}</span>
                        {n.unread && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setNotifOpen(false)
                    navigate(ROUTES.orders)
                  }}
                  className="block w-full border-t border-slate-100 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-slate-50"
                >
                  View all activity
                </button>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100"
          >
            <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-slate-800">
                {user?.name ?? 'Admin'}
              </span>
              <span className="block text-xs capitalize leading-tight text-slate-400">
                {user?.role ?? 'admin'}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 origin-top-right animate-scale-in rounded-2xl border border-slate-100 bg-white p-1.5 shadow-card-hover">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(ROUTES.settings)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
