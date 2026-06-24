import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Phone, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { BRAND } from '@/lib/constants'
import { ROUTES } from '@/constants/routes'
import { DEMO_OTP, DEMO_PHONE, useRequestOtpMutation, useVerifyOtpMutation } from '@/services/endpoints/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/authSlice'

/** Stocked aisle of varied categories — Chutkima delivers more than groceries. */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=80'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestOtp, { isLoading: sending }] = useRequestOtpMutation()
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState(DEMO_PHONE)
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.dashboard

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await requestOtp({ phone }).unwrap()
      setDevOtp(res.devOtp)
      setOtp('')
      setStep('otp')
    } catch (err) {
      setError((err as { data?: string })?.data ?? 'Could not send the code.')
    }
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await verifyOtp({ phone, otp }).unwrap()
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
              { icon: ShieldCheck, text: 'Secure OTP sign-in — no passwords' },
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

          {step === 'phone' ? (
            <>
              <h2 className="text-2xl font-extrabold text-slate-800">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Enter your admin phone number — we'll text you a one-time code.</p>

              <form onSubmit={sendCode} className="mt-8 space-y-4">
                <Input
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  placeholder="+977 98XXXXXXXX"
                  autoComplete="tel"
                  autoFocus
                  error={error}
                />
                <Button type="submit" size="lg" loading={sending} className="w-full">Send OTP</Button>
              </form>

              <p className="mt-6 rounded-xl bg-mint-50 px-4 py-3 text-center text-xs text-slate-500">
                Demo mode — use <span className="font-semibold text-brand-700">{DEMO_PHONE}</span>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setStep('phone'); setError('') }} className="focus-ring -ml-1 mb-3 flex items-center gap-1 rounded-lg px-1 py-0.5 text-sm font-medium text-slate-500 hover:text-brand-600">
                <ArrowLeft className="h-4 w-4" /> Change number
              </button>
              <h2 className="text-2xl font-extrabold text-slate-800">Enter code</h2>
              <p className="mt-1 text-sm text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-700">{phone}</span>.</p>

              <form onSubmit={verify} className="mt-8 space-y-4">
                <Input
                  label="One-time code"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  autoFocus
                  error={error}
                />
                <Button type="submit" size="lg" loading={verifying} disabled={otp.length < 6} className="w-full">Verify &amp; sign in</Button>
                <button type="button" onClick={sendCode} className="focus-ring block w-full rounded-lg py-1 text-center text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Resend code
                </button>
              </form>

              <p className="mt-6 rounded-xl bg-mint-50 px-4 py-3 text-center text-xs text-slate-500">
                Demo OTP — <span className="font-semibold text-brand-700">{devOtp || DEMO_OTP}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
