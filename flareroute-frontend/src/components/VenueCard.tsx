import { type VenueDetail } from '../hooks/useVenueData'
import { formatUsd, formatFxrp, formatPrice, impliedYieldLabel, truncateAddress } from '../lib/format'
import { useNavigate } from '../router'

export function VenueCard({ venue }: { venue: VenueDetail }) {
  const navigate = useNavigate()
  const yieldInfo = impliedYieldLabel(venue.sharePriceWei)
  const isFirelight = venue.id === 'firelight'

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
      {/* Glow border gradient on hover */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full filter blur-2xl -mr-10 -mt-10 opacity-20 group-hover:opacity-40 transition-opacity ${
          isFirelight ? 'bg-pink-500' : 'bg-teal-400'
        }`}
      />

      <div>
        {/* Header: Title & Badges */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg"
              style={{
                background: isFirelight
                  ? 'linear-gradient(135deg, #e62058 0%, #f43f5e 100%)'
                  : 'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
              }}
            >
              {venue.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[var(--color-text)]">
                  {venue.name}
                </h3>
                <span className="font-mono-data text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--color-text-muted)]">
                  {venue.ticker}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                {isFirelight ? 'ERC-4626 Standard Vault' : 'Custom Tokenized Vault'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
          {venue.tagline}
        </p>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-black/25 border border-[var(--color-border)] mb-6">
          <div>
            <span className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold block mb-1">
              TVL (USD)
            </span>
            <span className="font-mono-data text-base sm:text-lg font-bold text-[var(--color-text)] flash-on-update block">
              {formatUsd(venue.tvlUsdWei)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold block mb-1">
              Total FXRP
            </span>
            <span className="font-mono-data text-base sm:text-lg font-bold text-[var(--color-text)] flash-on-update block">
              {formatFxrp(venue.totalAssets)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-wider font-semibold block mb-1">
              Accrued Yield
            </span>
            <span
              className={`font-mono-data text-base sm:text-lg font-bold block flash-on-update ${
                yieldInfo.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {yieldInfo.label}
            </span>
          </div>
        </div>

        {/* Vault details pill */}
        <div className="space-y-2 text-xs text-[var(--color-text-dim)] font-mono-data mb-6">
          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <span>Share Price</span>
            <span className="text-[var(--color-text-muted)]">{formatPrice(venue.sharePriceWei)}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
            <span>Redemption Model</span>
            <span className="text-[var(--color-text-muted)]">{venue.withdrawalType === 'instant' ? 'Instant Exit' : 'Epoch Claim'}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Vault Address</span>
            <a
              href={`https://coston2-explorer.flare.network/address/${venue.vaultAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              {truncateAddress(venue.vaultAddress)} ↗
            </a>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={() => navigate(`/route?venue=${venue.id}`)}
        className="w-full py-3 px-4 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 group-hover:shadow-lg transition-all"
      >
        <span>Deposit into {venue.name}</span>
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
