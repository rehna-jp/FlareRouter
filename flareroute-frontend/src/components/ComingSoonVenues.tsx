const COMING_SOON = [
  { ticker: 'KNTC', name: 'Kinetic', network: 'Flare Mainnet', url: 'https://kinetic.market' },
  { ticker: 'ENSY', name: 'Enosys Loans', network: 'Flare Mainnet', url: 'https://enosys.global' },
  { ticker: 'MYST', name: 'Mystic (Morpho)', network: 'Flare Mainnet', url: 'https://mystic.finance' },
]

export function ComingSoonVenues() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {COMING_SOON.map((venue) => (
        <a
          key={venue.ticker}
          href={venue.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-dashed border-[var(--color-border)] p-4 flex flex-col gap-2 hover:border-[var(--color-text-muted)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono-data text-xs px-2 py-1 rounded bg-[var(--color-bg-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
              {venue.ticker}
            </span>
            <span className="text-sm font-medium">{venue.name}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {venue.network} · live comparison coming next — view directly for now ↗
          </p>
        </a>
      ))}
    </div>
  )
}
