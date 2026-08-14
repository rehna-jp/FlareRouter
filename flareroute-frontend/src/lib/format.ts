import { formatUnits } from 'viem'

export const FXRP_DECIMALS = 6

export function formatFxrp(value: bigint | undefined, decimals = 2): string {
  if (value === undefined) return '0.00'
  const num = Number(formatUnits(value, FXRP_DECIMALS))
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

export function formatUsd(valueWei: bigint | undefined, decimals = 0): string {
  if (valueWei === undefined) return '$0'
  const num = Number(formatUnits(valueWei, 18))
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPrice(valueWei: bigint | undefined): string {
  if (valueWei === undefined) return '$0.00'
  const num = Number(formatUnits(valueWei, 18))
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

export function formatShares(value: bigint | undefined, decimals = 6): string {
  if (value === undefined) return '0.00'
  const num = Number(formatUnits(value, decimals))
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

export function impliedYieldLabel(sharePriceWei: bigint | undefined): {
  label: string
  pct: number
  isPositive: boolean
} {
  if (sharePriceWei === undefined) {
    return { label: '0.00%', pct: 0, isPositive: true }
  }
  const price = Number(formatUnits(sharePriceWei, 18))
  const pct = (price - 1) * 100
  const sign = pct >= 0 ? '+' : ''
  return {
    label: `${sign}${pct.toFixed(2)}%`,
    pct,
    isPositive: pct >= 0,
  }
}

export function truncateAddress(address: string | undefined): string {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
