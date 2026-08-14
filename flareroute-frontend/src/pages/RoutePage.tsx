import { useState, useEffect } from 'react'
import { useVenueData } from '../hooks/useVenueData'
import { DepositCard } from '../components/DepositCard'
import { WithdrawCard } from '../components/WithdrawCard'
import { Skeleton } from '../components/Skeleton'
import { useSearchParams } from '../router'
import { formatUsd, formatFxrp, formatPrice, impliedYieldLabel, truncateAddress } from '../lib/format'

export function RoutePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { firelight, upshift, priceWei, isLoading } = useVenueData()

  // URL state sync for venue & mode
  const venueParam = searchParams.get('venue')
  const modeParam = searchParams.get('mode')

  const [selectedVenueId, setSelectedVenueId] = useState<'firelight' | 'upshift'>(
    venueParam === 'upshift' ? 'upshift' : 'firelight'
  )
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(
    modeParam === 'withdraw' ? 'withdraw' : 'deposit'
  )

  useEffect(() => {
    if (venueParam === 'firelight' || venueParam === 'upshift') {
      setSelectedVenueId(venueParam)
    }
    if (modeParam === 'deposit' || modeParam === 'withdraw') {
      setMode(modeParam)
    }
  }, [venueParam, modeParam])

  const handleVenueChange = (id: 'firelight' | 'upshift') => {
    setSelectedVenueId(id)
    setSearchParams({ venue: id, mode })
  }

  const handleModeChange = (newMode: 'deposit' | 'withdraw') => {
    setMode(newMode)
    setSearchParams({ venue: selectedVenueId, mode: newMode })
  }

  const activeVenue = selectedVenueId === 'firelight' ? firelight : upshift

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Title & context */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
          Route <span className="text-gradient-brand">FXRP</span> Yield
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
          Single-transaction deposit or withdrawal through the VenueRouter contract
        </p>
      </div>

      {/* Main Uniswap-Style Swap Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className={`absolute top-0 right-0 w-48 h-48 rounded-full filter blur-3xl -mr-16 -mt-16 opacity-25 transition-all ${
            selectedVenueId === 'firelight' ? 'bg-pink-500' : 'bg-teal-400'
          }`}
        />

        {/* Header Controls: Venue Tabs + Deposit/Withdraw Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 mb-5 border-b border-[var(--color-border)]">
          {/* Venue Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => handleVenueChange('firelight')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedVenueId === 'firelight'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              <span>Firelight</span>
              <span className="text-[10px] font-mono-data opacity-75">FIRE</span>
            </button>
            <button
              onClick={() => handleVenueChange('upshift')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedVenueId === 'upshift'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              <span>Upshift</span>
              <span className="text-[10px] font-mono-data opacity-75">vFXRP</span>
            </button>
          </div>

          {/* Mode Pill Toggle (Deposit vs Withdraw) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => handleModeChange('deposit')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'deposit'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => handleModeChange('withdraw')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'withdraw'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading || !activeVenue ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : mode === 'deposit' ? (
          <DepositCard venue={activeVenue} priceWei={priceWei} />
        ) : (
          <WithdrawCard venue={activeVenue} />
        )}
      </div>

      {/* Live Venue Telemetry Drawer */}
      {activeVenue && (
        <div className="glass-card rounded-2xl p-5 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
              <span>📊</span>
              <span>{activeVenue.name} Telemetry</span>
            </span>
            <span className="font-mono-data text-emerald-400">
              {impliedYieldLabel(activeVenue.sharePriceWei).label} Accrued
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] font-mono-data">
            <div>
              <span className="text-[10px] text-[var(--color-text-dim)] block">Total TVL</span>
              <span className="font-semibold text-[var(--color-text)]">{formatUsd(activeVenue.tvlUsdWei)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-dim)] block">Vault Assets</span>
              <span className="font-semibold text-[var(--color-text)]">{formatFxrp(activeVenue.totalAssets)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--color-text-dim)] block">Share Price</span>
              <span className="font-semibold text-[var(--color-text)]">{formatPrice(activeVenue.sharePriceWei)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
            <span>Contract</span>
            <a
              href={`https://coston2-explorer.flare.network/address/${activeVenue.vaultAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] hover:underline font-mono-data"
            >
              {truncateAddress(activeVenue.vaultAddress)} ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
