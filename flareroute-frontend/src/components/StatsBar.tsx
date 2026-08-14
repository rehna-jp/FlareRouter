import { useVenueData } from '../hooks/useVenueData'
import { formatUsd, formatFxrp, formatPrice } from '../lib/format'
import { Skeleton } from './Skeleton'

export function StatsBar() {
  const { totalTvlUsd, totalAssets, priceWei, venues, isLoading } = useVenueData()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 sm:p-5">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-8">
      {/* Stat 1: Total TVL */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full filter blur-xl -mr-6 -mt-6 group-hover:bg-pink-500/20 transition-all" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
            Aggregated TVL
          </span>
        </div>
        <p className="font-mono-data text-xl sm:text-2xl font-bold text-[var(--color-text)] flash-on-update">
          {formatUsd(totalTvlUsd)}
        </p>
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
          Across Coston2 vaults
        </span>
      </div>

      {/* Stat 2: Total FXRP in vaults */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full filter blur-xl -mr-6 -mt-6 group-hover:bg-teal-500/20 transition-all" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
            Total FXRP Locked
          </span>
        </div>
        <p className="font-mono-data text-xl sm:text-2xl font-bold text-[var(--color-text)] flash-on-update">
          {formatFxrp(totalAssets)} <span className="text-xs text-[var(--color-text-muted)] font-normal">FXRP</span>
        </p>
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
          Under active management
        </span>
      </div>

      {/* Stat 3: Oracle Price */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl -mr-6 -mt-6 group-hover:bg-indigo-500/20 transition-all" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
            XRP/USD (FTSOv2)
          </span>
        </div>
        <p className="font-mono-data text-xl sm:text-2xl font-bold text-[var(--color-text)] flash-on-update">
          {formatPrice(priceWei)}
        </p>
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
          Flare Enshrined Oracle
        </span>
      </div>

      {/* Stat 4: Live Venues */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full filter blur-xl -mr-6 -mt-6 group-hover:bg-purple-500/20 transition-all" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
            Live Venues
          </span>
        </div>
        <p className="font-mono-data text-xl sm:text-2xl font-bold text-[var(--color-text)]">
          {venues.length} <span className="text-xs text-[var(--color-accent)] font-normal">+ 3 coming</span>
        </p>
        <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
          Coston2 Testnet Live
        </span>
      </div>
    </div>
  )
}
