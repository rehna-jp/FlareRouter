import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { ConnectWallet } from './components/ConnectWallet'
import { VenueTable } from './components/VenueTable'
import { ComingSoonVenues } from './components/ComingSoonVenues'
import { VENUE_ROUTER_ADDRESS, venueRouterAbi } from './contracts'
import flareRouteIcon from './assets/flareroute-icon.png'
import { coston2 } from './wagmi'

function XrpPriceTicker() {
  const { data } = useReadContract({
    address: VENUE_ROUTER_ADDRESS,
    abi: venueRouterAbi,
    functionName: 'getXrpUsdPriceWei',
    query: { refetchInterval: 20_000 },
  })

  if (data === undefined) return null

  const price = Number(formatUnits(data, 18)).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
  })

  return (
    <div className="font-mono-data text-sm text-[var(--color-text-muted)] flash-on-update">
      XRP/USD <span className="text-[var(--color-text)]">{price}</span>
      <span className="ml-2 text-xs">via Flare FTSOv2</span>
    </div>
  )
}

function NetworkWarning() {
  const { chainId, isConnected } = useAccount()
  if (!isConnected || chainId === coston2.id) return null
  return (
    <div className="mb-6 rounded-md border border-[var(--color-caution)] bg-[var(--color-caution)]/10 px-4 py-3 text-sm text-[var(--color-caution)]">
      Wrong network — switch your wallet to Flare Testnet Coston2 (chain ID 114) to see live data and deposit.
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-10">
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <img src={flareRouteIcon} alt="FlareRoute" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-semibold leading-tight">FlareRoute</h1>
            <p className="text-xs text-[var(--color-text-muted)]">Where should your FXRP go?</p>
          </div>
        </div>
        <ConnectWallet />
      </header>

      <NetworkWarning />

      <section className="mb-8 flex items-center justify-between">
        <p className="text-[var(--color-text-muted)] max-w-md text-sm">
          Live comparison across FXRP yield venues on Flare — deposit directly into
          whichever fits, no venue-hopping required.
        </p>
        <XrpPriceTicker />
      </section>

      <section className="mb-10">
        <VenueTable />
      </section>

      <section>
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wide">
          More venues
        </h2>
        <ComingSoonVenues />
      </section>

      <footer className="mt-16 pt-6 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        Built for the Flare Summer Signal hackathon. VenueRouter contract verified on{' '}
        <a
          href={`https://coston2-explorer.flare.network/address/${VENUE_ROUTER_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-[var(--color-text)]"
        >
          Coston2 Explorer
        </a>
        .
      </footer>
    </div>
  )
}

export default App
