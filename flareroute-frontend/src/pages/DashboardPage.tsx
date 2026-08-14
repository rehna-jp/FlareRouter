import { useVenueData } from '../hooks/useVenueData'
import { StatsBar } from '../components/StatsBar'
import { VenueCard } from '../components/VenueCard'
import { VenueCardSkeleton } from '../components/Skeleton'
import { ComingSoonVenues } from '../components/ComingSoonVenues'
import { Link } from '../router'
import { VENUE_ROUTER_ADDRESS } from '../contracts'

export function DashboardPage() {
  const { venues, isLoading, isError, refetch } = useVenueData()

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              <span>Coston2 Testnet Live Deployment</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-text)] leading-tight">
              Where should your{' '}
              <span className="text-gradient-brand">FXRP</span> go?
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-xl">
              Compare real-time yield strategies, TVL, and share price metrics across Flare yield
              venues — and route single-click deposits directly on-chain.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <Link
                to="/route"
                className="btn-primary px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2"
              >
                <span>Start Routing FXRP</span>
                <span>⚡</span>
              </Link>

              <Link
                to="/portfolio"
                className="btn-ghost px-5 py-3.5 rounded-xl font-semibold text-sm"
              >
                View My Portfolio
              </Link>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full border-pink-500/20 bg-gradient-to-br from-pink-500/[0.04] to-transparent">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">
              <span>🛡️</span>
              <span>Enshrined Oracle Precision</span>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              All venue valuations and USD pricing are verified on-chain in real-time via{' '}
              <strong className="text-[var(--color-text)]">Flare FTSOv2</strong>. No off-chain indexing lag.
            </p>
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[var(--color-text-dim)] font-mono-data">
              <span>Router Contract</span>
              <a
                href={`https://coston2-explorer.flare.network/address/${VENUE_ROUTER_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Verified ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Statistics Bar */}
      <section>
        <StatsBar />
      </section>

      {/* Live Coston2 Yield Venues */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Live Yield Venues
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Live vaults deployed and active on Flare Coston2 testnet
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="text-xs text-[var(--color-text-dim)] hover:text-white flex items-center gap-1.5 self-start sm:self-auto py-1 px-2 rounded-lg hover:bg-white/5 transition-colors font-mono-data"
          >
            <span>🔄 Refresh feeds</span>
          </button>
        </div>

        {isError && (
          <div className="glass-card rounded-2xl p-6 border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            <p className="font-semibold mb-1">Failed to read VenueRouter contract</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Please ensure your wallet RPC or network connection to Coston2 is operational.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {isLoading
            ? [...Array(2)].map((_, i) => <VenueCardSkeleton key={i} />)
            : venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </div>
      </section>

      {/* Pipeline Expansion Section */}
      <section className="space-y-4 pt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
              Flare Mainnet Ecosystem Pipeline
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Additional venues currently live on Mainnet being integrated into FlareRoute
            </p>
          </div>
        </div>
        <ComingSoonVenues />
      </section>
    </div>
  )
}
