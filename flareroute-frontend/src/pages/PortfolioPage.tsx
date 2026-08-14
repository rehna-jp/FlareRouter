import { UserPosition } from '../components/UserPosition'
import { Link } from '../router'

export function PortfolioPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Your <span className="text-gradient-brand">Portfolio</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
            Track your active share positions, underlying FXRP values, and accrued yields
          </p>
        </div>

        <Link
          to="/route"
          className="btn-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Route New Deposit</span>
          <span>⚡</span>
        </Link>
      </div>

      {/* Portfolio Position Component */}
      <UserPosition />

      {/* Security & Non-Custodial Note */}
      <div className="glass-card rounded-2xl p-5 border-white/5 text-xs text-[var(--color-text-dim)] space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-[var(--color-text-muted)]">
          <span>🔒</span>
          <span>Non-Custodial Architecture</span>
        </div>
        <p className="leading-relaxed">
          FlareRoute never holds custody of your funds. When depositing, your FXRP is transferred
          directly into the respective vault smart contract (Firelight ERC-4626 or Upshift Tokenized Vault),
          and vault shares (FIRE or vFXRP) are minted straight to your wallet.
        </p>
      </div>
    </div>
  )
}
