import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { BRAND } from '@/lib/constants'
import { ROUTES } from '@/constants/routes'
import { DEMO_EMAIL, DEMO_PASSWORD, useLoginMutation } from '@/services/endpoints/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/authSlice'

/** Stocked aisle of varied categories — Chutkima delivers more than groceries. */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.dashboard

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login({ email, password }).unwrap()
      dispatch(setCredentials(res))
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as { data?: string })?.data ?? 'Could not sign in.')
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        {/* Hero photo of a varied store aisle + a green brand overlay so text stays readable */}
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/85 via-brand-700/88 to-brand-950/95" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <Logo onDark className="relative z-10" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">Run your {BRAND.city} dark store from one screen.</h1>
          <p className="mt-4 text-white/70">Track live orders, dispatch riders, and manage your catalog — built for 10-minute delivery across {BRAND.city}.</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, text: 'Real-time order & dispatch board' },
              { icon: ShieldCheck, text: 'Secure email & password sign-in' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/50">© {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline}</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>

          <h2 className="text-2xl font-extrabold text-slate-800">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use your admin email and password to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="you@chutkima.com"
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
              autoComplete="current-password"
              error={error}
            />
            <Button type="submit" size="lg" loading={isLoading} className="w-full">Sign in</Button>
          </form>

          <p className="mt-6 rounded-xl bg-mint-50 px-4 py-3 text-center text-xs text-slate-500">
            Demo mode — <span className="font-semibold text-brand-700">{DEMO_EMAIL}</span> / <span className="font-semibold text-brand-700">{DEMO_PASSWORD}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
