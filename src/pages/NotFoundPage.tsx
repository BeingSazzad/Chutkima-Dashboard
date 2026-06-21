import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
import { ROUTES } from '@/constants/routes'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mint-50 px-6 text-center">
      <Logo className="mb-8" />
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button className="mt-6" leftIcon={<Home className="h-4 w-4" />} onClick={() => navigate(ROUTES.dashboard)}>
        Back to dashboard
      </Button>
    </div>
  )
}
