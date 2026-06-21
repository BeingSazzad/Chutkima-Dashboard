import { NavLink } from 'react-router-dom'
import { X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'
import { Logo } from '@/components/shared/Logo'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSidebar } from '@/store/uiSlice'
import { NAV_SECTIONS } from './navConfig'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors',
                          isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function PromoCard() {
  return (
    <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
        <Zap className="h-4 w-4" />
      </div>
      <p className="text-sm font-bold">10-min delivery</p>
      <p className="mt-0.5 text-xs text-white/70">
        Dark store live in {BRAND.city}. Keep dispatch under target.
      </p>
    </div>
  )
}

export function Sidebar() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((s) => s.ui.sidebarOpen)
  const close = () => dispatch(setSidebar(false))

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white shadow-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <NavItems />
        <PromoCard />
      </aside>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', open ? '' : 'pointer-events-none')}>
        <div
          className={cn(
            'absolute inset-0 bg-brand-950/40 backdrop-blur-sm transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={close}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-card-hover transition-transform',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Logo />
            <button
              onClick={close}
              className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <NavItems onNavigate={close} />
          <PromoCard />
        </aside>
      </div>
    </>
  )
}
