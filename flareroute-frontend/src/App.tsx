import { useAccount, useSwitchChain } from 'wagmi'
import { Navbar } from './components/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { RoutePage } from './pages/RoutePage'
import { PortfolioPage } from './pages/PortfolioPage'
import { useLocation } from './router'
import { VENUE_ROUTER_ADDRESS, FXRP_ADDRESS } from './contracts'
import { coston2 } from './wagmi'

function NetworkWarningBanner() {
  const { chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  if (!isConnected || chainId === coston2.id) return null

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-y border-amber-500/40 px-4 py-3 text-center text-xs sm:text-sm text-amber-200">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>
          ⚠️ You are connected to an unsupported network (Chain ID: {chainId}). Please switch to{' '}
          <strong>Flare Testnet Coston2 (114)</strong>.
        </span>
        {switchChain && (
          <button
            onClick={() => switchChain({ chainId: coston2.id })}
            className="px-3 py-1 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors"
          >
            Switch Network
          </button>
        )}
      </div>
    </div>
  )
}

export function App() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col relative text-[var(--color-text)]">
      {/* Ambient background glow orbs */}
      <div className="bg-ambient-layer">
        <div className="orb orb-primary" />
        <div className="orb orb-secondary" />
        <div className="orb orb-teal" />
      </div>

      {/* Top Navbar */}
      <Navbar />

      {/* Network Warning Banner */}
      <NetworkWarningBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {pathname === '/route' ? (
          <RoutePage />
        ) : pathname === '/portfolio' ? (
          <PortfolioPage />
        ) : (
          <DashboardPage />
        )}
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-[var(--color-border)] bg-[rgba(7,9,14,0.6)] backdrop-blur-md py-8 text-xs text-[var(--color-text-dim)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--color-text-muted)]">FlareRoute</span>
            <span>·</span>
            <span>Built on Flare Coston2</span>
            <span>·</span>
            <span>Powered by FTSOv2</span>
          </div>

          <div className="flex items-center gap-5 font-mono-data">
            <a
              href={`https://coston2-explorer.flare.network/address/${VENUE_ROUTER_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-text)] transition-colors"
            >
              Router: {VENUE_ROUTER_ADDRESS.slice(0, 6)}…{VENUE_ROUTER_ADDRESS.slice(-4)} ↗
            </a>
            <a
              href={`https://coston2-explorer.flare.network/address/${FXRP_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-text)] transition-colors"
            >
              FXRP Token ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App