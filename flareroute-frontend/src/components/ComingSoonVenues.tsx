const COMING_SOON_VENUES = [
  {
    ticker: 'KNTC',
    name: 'Kinetic Market',
    category: 'Lending & Borrowing',
    network: 'Flare Mainnet',
    description: 'Algorithmic money market on Flare. Direct supply & borrow markets for FXRP.',
    url: 'https://kinetic.market',
    color: '#3b82f6',
  },
  {
    ticker: 'ENSY',
    name: 'Enosys Loans',
    category: 'CDP & Collateral',
    network: 'Flare Mainnet',
    description: 'Decentralized stablecoin loans using FXRP collateral with zero interest rates.',
    url: 'https://enosys.global',
    color: '#8b5cf6',
  },
  {
    ticker: 'MYST',
    name: 'Mystic (Morpho)',
    category: 'Vault Infrastructure',
    network: 'Flare Mainnet',
    description: 'Next-generation peer-to-peer lending infrastructure powered by Morpho Blue.',
    url: 'https://mystic.finance',
    color: '#ec4899',
  },
]

export function ComingSoonVenues() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {COMING_SOON_VENUES.map((venue) => (
        <a
          key={venue.ticker}
          href={venue.url}
          target="_blank"
          rel="noreferrer"
          className="glass-card rounded-2xl p-5 flex flex-col justify-between border-dashed border-[var(--color-border)] hover:border-white/20 group transition-all"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[var(--color-text-muted)] font-semibold">
                  {venue.ticker}
                </span>
                <h4 className="text-sm font-bold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
                  {venue.name}
                </h4>
              </div>
              <span className="text-[10px] font-mono-data text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Pipeline
              </span>
            </div>

            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed mb-4">
              {venue.description}
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
            <span>{venue.network}</span>
            <span className="text-[var(--color-accent)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Visit Portal ↗
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
