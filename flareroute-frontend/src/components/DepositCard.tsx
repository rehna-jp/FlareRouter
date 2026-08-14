import { useDeposit } from '../hooks/useDeposit'
import { type VenueDetail } from '../hooks/useVenueData'
import { formatFxrp, formatPrice, impliedYieldLabel } from '../lib/format'
import { formatUnits } from 'viem'

interface DepositCardProps {
  venue: VenueDetail
  priceWei?: bigint
}

export function DepositCard({ venue, priceWei }: DepositCardProps) {
  const {
    amount,
    setAmount,
    amountUnits,
    balance,
    step,
    errorMessage,
    pendingHash,
    isBusy,
    isConfirming,
    hasSufficientBalance,
    needsApproval,
    isConnected,
    isLoadingBalance,
    setMaxAmount,
    executeApprove,
    executeDeposit,
    reset,
  } = useDeposit(venue.id)

  const isFirelight = venue.id === 'firelight'
  const yieldInfo = impliedYieldLabel(venue.sharePriceWei)

  // Compute USD value of input
  const usdValue =
    amount && Number(amount) > 0 && priceWei
      ? (Number(amount) * Number(formatUnits(priceWei, 18))).toLocaleString(undefined, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
        })
      : '$0.00'

  // Estimate shares to be received
  const sharePriceRatio = venue.sharePriceWei > 0n ? Number(formatUnits(venue.sharePriceWei, 18)) : 1
  const estimatedShares =
    amount && Number(amount) > 0 ? (Number(amount) / sharePriceRatio).toFixed(4) : '0.00'

  return (
    <div className="flex flex-col gap-5">
      {/* Input container */}
      <div className="rounded-2xl bg-black/35 border border-[var(--color-border)] p-4 focus-within:border-[var(--color-primary)] transition-colors">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] mb-2">
          <span>You Deposit</span>
          <div className="flex items-center gap-1.5 font-mono-data">
            <span>Balance:</span>
            {isLoadingBalance ? (
              <span className="text-xs">Loading…</span>
            ) : (
              <span className="text-[var(--color-text)] font-medium">
                {formatFxrp(balance)} FXRP
              </span>
            )}
            {isConnected && balance && balance > 0n && (
              <button
                type="button"
                onClick={setMaxAmount}
                className="ml-1 px-1.5 py-0.5 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-[10px] font-bold uppercase transition-colors"
              >
                MAX
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              setAmount(val)
            }}
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono-data text-[var(--color-text)] placeholder-[var(--color-text-dim)] outline-none"
          />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
              ✕
            </div>
            <span className="font-semibold text-sm text-[var(--color-text)]">FXRP</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] font-mono-data mt-2">
          <span>≈ {usdValue}</span>
          <span>Coston2 Native Asset</span>
        </div>
      </div>

      {/* Yield & Output Summary */}
      <div className="rounded-xl p-3.5 bg-white/[0.02] border border-[var(--color-border)] space-y-2 text-xs">
        <div className="flex items-center justify-between text-[var(--color-text-muted)]">
          <span>Target Venue</span>
          <span className="font-semibold text-[var(--color-text)] flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: isFirelight ? '#e62058' : '#2dd4bf' }}
            />
            {venue.name} ({venue.ticker})
          </span>
        </div>

        <div className="flex items-center justify-between text-[var(--color-text-muted)]">
          <span>Accrued Yield</span>
          <span className="font-mono-data text-emerald-400 font-semibold">
            {yieldInfo.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-[var(--color-text-muted)]">
          <span>Estimated Shares Minted</span>
          <span className="font-mono-data text-[var(--color-text)]">
            ≈ {estimatedShares} {venue.ticker}
          </span>
        </div>

        <div className="flex items-center justify-between text-[var(--color-text-muted)]">
          <span>Current Share Price</span>
          <span className="font-mono-data text-[var(--color-text-dim)]">
            {formatPrice(venue.sharePriceWei)}
          </span>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <p className="font-semibold mb-0.5">Transaction Error</p>
          <p className="line-clamp-2">{errorMessage}</p>
        </div>
      )}

      {/* Success state */}
      {step === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <span>🎉</span>
            <span>Deposit Completed Successfully!</span>
          </div>
          <p className="text-[var(--color-text-muted)]">
            Your FXRP has been deposited into {venue.name}. Your {venue.ticker} vault shares are now in your wallet.
          </p>
          {pendingHash && (
            <a
              href={`https://coston2-explorer.flare.network/tx/${pendingHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] hover:underline font-mono-data"
            >
              View on Explorer ↗
            </a>
          )}
          <button
            onClick={reset}
            className="mt-1 py-1.5 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 self-start transition-colors"
          >
            Make Another Deposit
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!isConnected ? (
        <div className="p-3 text-center text-xs text-[var(--color-text-dim)] border border-dashed border-[var(--color-border)] rounded-xl">
          Connect your wallet above to deposit FXRP.
        </div>
      ) : step !== 'success' && (
        <div className="space-y-2">
          {needsApproval ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={executeApprove}
                disabled={!hasSufficientBalance || isBusy}
                className="w-full py-3.5 px-4 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
              >
                {step === 'approving' || (isConfirming && step === 'idle') ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming Approval…</span>
                  </>
                ) : (
                  <span>1. Approve FXRP for FlareRoute</span>
                )}
              </button>
              <p className="text-[11px] text-center text-[var(--color-text-dim)]">
                Step 1 of 2: One-time token allowance approval to the VenueRouter contract.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={executeDeposit}
                disabled={!hasSufficientBalance || isBusy}
                className="w-full py-3.5 px-4 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
              >
                {step === 'depositing' || (isConfirming && step === 'approved') ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Deposit…</span>
                  </>
                ) : (
                  <span>Deposit to {venue.name}</span>
                )}
              </button>
              <p className="text-[11px] text-center text-[var(--color-text-dim)]">
                Step 2 of 2: Routing deposit through FlareRoute into {venue.name}.
              </p>
            </div>
          )}

          {!amountUnits && (
            <p className="text-center text-[11px] text-[var(--color-text-dim)]">
              Enter an amount to get started.
            </p>
          )}

          {amountUnits > 0n && !hasSufficientBalance && (
            <p className="text-center text-[11px] text-rose-400">
              Insufficient FXRP balance.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
