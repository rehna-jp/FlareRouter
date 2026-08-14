import { useAccount, useReadContract } from 'wagmi'
import {
  FIRELIGHT_VAULT_ADDRESS,
  UPSHIFT_LP_TOKEN_ADDRESS,
  erc20Abi,
} from '../contracts'
import { useVenueData } from '../hooks/useVenueData'
import { formatShares, formatFxrp, formatPrice, impliedYieldLabel } from '../lib/format'
import { useNavigate } from '../router'
import { formatUnits } from 'viem'

export function UserPosition() {
  const { address, isConnected } = useAccount()
  const { firelight, upshift, priceWei, isLoading: isLoadingVenues } = useVenueData()
  const navigate = useNavigate()

  // Read Firelight shares
  const { data: firelightShares, isLoading: isLoadingFire } = useReadContract({
    address: FIRELIGHT_VAULT_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  })

  // Read Upshift shares
  const { data: upshiftShares, isLoading: isLoadingUp } = useReadContract({
    address: UPSHIFT_LP_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  })

  if (!isConnected) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border-dashed border-[var(--color-border)]">
        <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-xl mb-3">
          💼
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">
          Connect Your Wallet
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
          Connect your wallet to inspect your active FXRP positions, share balances, and accrued yield.
        </p>
      </div>
    )
  }

  const fireUnits = firelightShares ?? 0n
  const upUnits = upshiftShares ?? 0n

  const firePriceWei = firelight?.sharePriceWei ?? 10n ** 18n
  const upPriceWei = upshift?.sharePriceWei ?? 10n ** 18n

  // Implied FXRP values
  const fireImpliedFxrp = (fireUnits * firePriceWei) / 10n ** 18n
  const upImpliedFxrp = (upUnits * upPriceWei) / 10n ** 18n
  const totalImpliedFxrp = fireImpliedFxrp + upImpliedFxrp

  const xrpPriceNum = priceWei ? Number(formatUnits(priceWei, 18)) : 0
  const totalPortfolioUsd = (Number(formatUnits(totalImpliedFxrp, 6)) * xrpPriceNum).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

  const hasAnyPosition = fireUnits > 0n || upUnits > 0n

  return (
    <div className="space-y-6">
      {/* Portfolio Top Bar */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider font-semibold">
              Total Portfolio Value
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl font-bold font-mono-data text-[var(--color-text)]">
                {totalPortfolioUsd}
              </h2>
              <span className="text-sm font-mono-data text-[var(--color-text-muted)]">
                ≈ {formatFxrp(totalImpliedFxrp)} FXRP
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/route')}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold self-start sm:self-auto flex items-center gap-2"
          >
            <span>Deposit More</span>
            <span>⚡</span>
          </button>
        </div>
      </div>

      {/* Position Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Firelight Position */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center">
                  FIRE
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--color-text)]">Firelight Vault</h4>
                  <span className="text-xs text-[var(--color-text-dim)] font-mono-data">ERC-4626</span>
                </div>
              </div>
              <span className="text-xs font-mono-data px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {impliedYieldLabel(firelight?.sharePriceWei).label}
              </span>
            </div>

            <div className="space-y-2 py-3 border-y border-[var(--color-border)] text-xs font-mono-data">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Vault Shares</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {isLoadingFire || isLoadingVenues ? '…' : `${formatShares(fireUnits)} FIRE`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Underlying Value</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {isLoadingFire || isLoadingVenues ? '…' : `≈ ${formatFxrp(fireImpliedFxrp)} FXRP`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Share Price</span>
                <span className="text-[var(--color-text-muted)]">{formatPrice(firelight?.sharePriceWei)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => navigate('/route?venue=firelight&mode=deposit')}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-text)] transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => navigate('/route?venue=firelight&mode=withdraw')}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-text)] transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Upshift Position */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center">
                  UPSH
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--color-text)]">Upshift Vault</h4>
                  <span className="text-xs text-[var(--color-text-dim)] font-mono-data">vFXRP LP</span>
                </div>
              </div>
              <span className="text-xs font-mono-data px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {impliedYieldLabel(upshift?.sharePriceWei).label}
              </span>
            </div>

            <div className="space-y-2 py-3 border-y border-[var(--color-border)] text-xs font-mono-data">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Vault Shares</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {isLoadingUp || isLoadingVenues ? '…' : `${formatShares(upUnits)} vFXRP`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Underlying Value</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {isLoadingUp || isLoadingVenues ? '…' : `≈ ${formatFxrp(upImpliedFxrp)} FXRP`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-dim)]">Share Price</span>
                <span className="text-[var(--color-text-muted)]">{formatPrice(upshift?.sharePriceWei)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => navigate('/route?venue=upshift&mode=deposit')}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-text)] transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => navigate('/route?venue=upshift&mode=withdraw')}
              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--color-text)] transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {!hasAnyPosition && (
        <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20 text-center text-xs text-[var(--color-text-muted)]">
          You don&apos;t have any active positions yet. Explore venues on the{' '}
          <button
            onClick={() => navigate('/')}
            className="text-pink-400 font-semibold underline hover:text-pink-300 ml-1"
          >
            Dashboard
          </button>{' '}
          or start routing on the{' '}
          <button
            onClick={() => navigate('/route')}
            className="text-pink-400 font-semibold underline hover:text-pink-300 ml-1"
          >
            Route page
          </button>.
        </div>
      )}
    </div>
  )
}