import { useEffect, useState } from 'react'

/**
 * Live mm:ss countdown to the promised delivery time (placedAt + etaMinutes) —
 * the same ETA the customer sees. Counts up as "+mm:ss late" once overdue.
 */
export function EtaCountdown({ placedAt, etaMinutes }: { placedAt: string; etaMinutes: number }) {
  const target = Date.parse(placedAt) + etaMinutes * 60_000
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = target - now
  const overdue = diff <= 0
  const secs = Math.floor(Math.abs(diff) / 1000)
  const text = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  return <span className="tabular-nums">{overdue ? `+${text} late` : text}</span>
}
