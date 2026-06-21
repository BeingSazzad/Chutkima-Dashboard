import type { TrustBadge } from '@/types/common.types'

/** COD restriction policy for gray/red customers (SOW feature 94). */
export type CodMode = 'alert' | 'hidden' | 'manual'

export interface TrustConfig {
  enabled: boolean
  codMode: CodMode
  grayCod: number
  redCod: number
  grayNoResp: number
  redNoResp: number
}

export const DEFAULT_TRUST_CONFIG: TrustConfig = {
  enabled: true,
  codMode: 'manual',
  grayCod: 3,
  redCod: 5,
  grayNoResp: 2,
  redNoResp: 4,
}

export const COD_MODE_LABEL: Record<CodMode, string> = {
  alert: 'Mode A — alert only',
  hidden: 'Mode B — COD hidden',
  manual: 'Mode C — manual confirm',
}

/**
 * Derive the customer trust badge from behaviour counts + the configured
 * thresholds, so the badge always matches the numbers shown next to it.
 */
export function deriveTrustBadge(
  c: { codCancellations: number; notRespondingCount: number },
  cfg: TrustConfig = DEFAULT_TRUST_CONFIG,
): TrustBadge {
  if (!cfg.enabled) return 'green'
  if (c.codCancellations >= cfg.redCod || c.notRespondingCount >= cfg.redNoResp) return 'red'
  if (c.codCancellations >= cfg.grayCod || c.notRespondingCount >= cfg.grayNoResp) return 'gray'
  return 'green'
}
