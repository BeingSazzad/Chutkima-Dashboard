import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { BRAND } from '@/lib/constants'
import { ROUTES } from '@/constants/routes'
import { useRequestOtpMutation, useVerifyOtpMutation } from '@/services/endpoints/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/authSlice'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [requestOtp, { isLoading: sending }] = useRequestOtpMutation()
  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('+977 9800000001')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.dashboard

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await requestOtp({ phone }).unwrap()
      setStep('otp')
    } catch (err) {
      setError((err as { data?: string })?.data ?? 'Could not send OTP.')
    }
  }

  const confirm = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await verifyOtp({ phone, code }).unwrap()
      dispatch(setCredentials(res))
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as { data?: string })?.data ?? 'Invalid OTP.')
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
        <Logo onDark />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">Run your {BRAND.city} dark store from one screen.</h1>
          <p className="mt-4 text-white/70">Track live orders, dispatch riders, and manage your catalog — all built for 10-minute grocery delivery.</p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Zap, text: 'Real-time order & dispatch board' },
              { icon: ShieldCheck, text: 'Secure OTP sign-in' },
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
              <p className="mt-1 text-sm text-slate-500">Enter your admin phone number to get a one-time code.</p>
              <form onSubmit={sendOtp} className="mt-8 space-y-4">
                <Input
                  label="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  placeholder="+977 98XXXXXXXX"
                  error={error}
                  autoFocus
                />
                <Button type="submit" size="lg" loading={sending} className="w-full">Send OTP</Button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => { setStep('phone'); setError('') }} className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600">
                <ArrowLeft className="h-4 w-4" /> Change number
              </button>
              <h2 className="text-2xl font-extrabold text-slate-800">Enter the code</h2>
              <p className="mt-1 text-sm text-slate-500">Sent to {phone}.</p>
              <form onSubmit={confirm} className="mt-8 space-y-4">
                <Input
                  label="6-digit OTP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  className="text-center text-xl tracking-[0.4em]"
                  error={error}
                  autoFocus
                />
                <Button type="submit" size="lg" loading={verifying} disabled={code.length !== 6} className="w-full">Verify & sign in</Button>
              </form>
            </>
          )}

          <p className="mt-6 rounded-xl bg-mint-50 px-4 py-3 text-center text-xs text-slate-500">
            Demo mode — phone is pre-filled. OTP is <span className="font-semibold text-brand-700">123456</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
