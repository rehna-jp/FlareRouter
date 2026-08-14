import { useWithdraw } from '../hooks/useWithdraw'
import { type VenueDetail } from '../hooks/useVenueData'
import { formatShares, formatPrice } from '../lib/format'

export interface WithdrawCardProps {
  venue: VenueDetail
}

export function WithdrawCard({ venue }: WithdrawCardProps) {
  const isFirelight = venue.id === 'firelight'
  const {
    amount,
    setAmount,
    claimPeriod,
    setClaimPeriod,
    amountUnits,
    shareBalance,
    currentPeriod,
    nextPeriodEnd,
    step,
    errorMessage,
    pendingHash,
    isBusy,
    isConfirming,
    hasSufficientShares,
    needsApproval,
    isConnected,
    isLoadingShareBalance,
    setMaxAmount,
    executeApprove,
    executeWithdraw,
    executeClaim,
    reset,
  } = useWithdraw(venue.id)

  const periodEndDate = nextPeriodEnd ? new Date(Number(nextPeriodEnd) * 1000) : null

  return (
    <div className="flex flex-col gap-5">
      {/* Withdraw Description Banner */}
      <div className="rounded-xl p-3.5 bg-white/[0.02] border border-[var(--color-border)] text-xs">
        <div className="flex items-center gap-2 font-medium text-[var(--color-text)] mb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>{venue.withdrawalType === 'instant' ? 'Instant Exit Vault' : 'Epoch Queue Vault'}</span>
        </div>
        <p className="text-[var(--color-text-muted)] leading-relaxed">
          {venue.withdrawalDescription}
        </p>
      </div>

      {/* Share Input Container */}
      <div className="rounded-2xl bg-black/35 border border-[var(--color-border)] p-4 focus-within:border-[var(--color-primary)] transition-colors">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] mb-2">
          <span>{isFirelight ? 'Request Withdrawal (Shares)' : 'Redeem Shares'}</span>
          <div className="flex items-center gap-1.5 font-mono-data">
            <span>Your Shares:</span>
            {isLoadingShareBalance ? (
              <span className="text-xs">Loading…</span>
            ) : (
              <span className="text-[var(--color-text)] font-medium">
                {formatShares(shareBalance)} {venue.ticker}
              </span>
            )}
            {isConnected && shareBalance && shareBalance > 0n && (
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
            <span className="font-semibold text-sm text-[var(--color-text)]">{venue.ticker}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] font-mono-data mt-2">
          <span>Share Price: {formatPrice(venue.sharePriceWei)}</span>
          <span>{venue.name}</span>
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <p className="font-semibold mb-0.5">Withdrawal Error</p>
          <p className="line-clamp-2">{errorMessage}</p>
        </div>
      )}

      {/* Success notification */}
      {step === 'success' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <span>🎉</span>
            <span>Transaction Executed!</span>
          </div>
          <p className="text-[var(--color-text-muted)]">
            {isFirelight
              ? 'Withdrawal request logged. When the epoch concludes, claim your FXRP below.'
              : 'Withdrawal complete. FXRP is now in your wallet.'}
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
            Done
          </button>
        </div>
      )}

      {/* Action Buttons for Request / Instant Withdraw */}
      {!isConnected ? (
        <div className="p-3 text-center text-xs text-[var(--color-text-dim)] border border-dashed border-[var(--color-border)] rounded-xl">
          Connect your wallet above to withdraw.
        </div>
      ) : step !== 'success' && (
        <div className="space-y-2">
          {needsApproval ? (
            <button
              type="button"
              onClick={executeApprove}
              disabled={!hasSufficientShares || isBusy}
              className="w-full py-3.5 px-4 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
            >
              {step === 'approving' || (isConfirming && step === 'idle') ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Approving Shares…</span>
                </>
              ) : (
                <span>1. Approve {venue.ticker} Shares</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={executeWithdraw}
              disabled={!hasSufficientShares || isBusy}
              className="w-full py-3.5 px-4 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
            >
              {step === 'withdrawing' || (isConfirming && step === 'approved') ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Withdrawal…</span>
                </>
              ) : (
                <span>
                  {isFirelight ? 'Request Withdrawal (Step 1)' : 'Withdraw from Upshift (Instant)'}
                </span>
              )}
            </button>
          )}

          {amountUnits > 0n && !hasSufficientShares && (
            <p className="text-center text-[11px] text-rose-400">
              Insufficient {venue.ticker} share balance.
            </p>
          )}
        </div>
      )}

      {/* Firelight Stage 2: Claim Epoch Withdrawals */}
      {isFirelight && (
        <div className="mt-2 pt-5 border-t border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)]">
                Step 2: Claim Epoch Redemption
              </h4>
              <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
                Current Period: <span className="font-mono-data text-[var(--color-text)] font-semibold">#{currentPeriod?.toString() || '—'}</span>
                {periodEndDate && (
                  <span> · Next epoch ends: {periodEndDate.toLocaleDateString()} {periodEndDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder={currentPeriod !== undefined ? `Period ID (e.g. ${currentPeriod})` : 'Period ID'}
              value={claimPeriod}
              onChange={(e) => setClaimPeriod(e.target.value.replace(/[^0-9]/g, ''))}
              className="glass-input font-mono-data flex-1 rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-text)]"
            />
            <button
              type="button"
              onClick={executeClaim}
              disabled={!claimPeriod || isBusy || !isConnected}
              className="py-2.5 px-4 rounded-xl border border-[var(--color-accent)] text-[var(--color-accent)] font-semibold hover:bg-[var(--color-accent)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              {step === 'claiming' && isConfirming ? 'Claiming…' : 'Claim FXRP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
