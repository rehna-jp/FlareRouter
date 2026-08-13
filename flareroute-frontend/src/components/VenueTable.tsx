import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import {
  VENUE_ROUTER_ADDRESS,
  FXRP_ADDRESS,
  venueRouterAbi,
  erc20Abi,
  type VenueSnapshot,
} from '../contracts'

const FXRP_DECIMALS = 6

function formatFxrp(value: bigint) {
  return Number(formatUnits(value, FXRP_DECIMALS)).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

function formatUsd(valueWei: bigint) {
  return Number(formatUnits(valueWei, 18)).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function impliedYieldLabel(sharePriceWei: bigint) {
  // sharePriceWei is 1e18-scaled; 1e18 means 1:1 (no accrued yield yet).
  const price = Number(formatUnits(sharePriceWei, 18))
  const pct = (price - 1) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

type DepositTarget = 'firelight' | 'upshift'

function DepositAction({ target, vaultLabel }: { target: DepositTarget; vaultLabel: string }) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing'>('idle')

  const { data: balance } = useReadContract({
    address: FXRP_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  })

  const { data: allowance } = useReadContract({
    address: FXRP_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, VENUE_ROUTER_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  })

  const { writeContractAsync } = useWriteContract()
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: pendingHash })

  if (!isConnected) {
    return <p className="text-sm text-[var(--color-text-muted)]">Connect your wallet to deposit.</p>
  }

  const amountUnits = amount ? parseUnits(amount, FXRP_DECIMALS) : 0n
  const hasBalance = balance !== undefined && amountUnits > 0n && amountUnits <= balance
  const needsApproval = allowance === undefined || allowance < amountUnits

  async function handleDeposit() {
    if (!amountUnits) return
    try {
      if (needsApproval) {
        setStep('approving')
        const approveHash = await writeContractAsync({
          address: FXRP_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [VENUE_ROUTER_ADDRESS, amountUnits],
        })
        setPendingHash(approveHash)
        return // wait for approval confirmation; user clicks deposit again once approved
      }

      setStep('depositing')
      const depositHash = await writeContractAsync({
        address: VENUE_ROUTER_ADDRESS,
        abi: venueRouterAbi,
        functionName: target === 'firelight' ? 'depositToFirelight' : 'depositToUpshift',
        args: [amountUnits],
      })
      setPendingHash(depositHash)
    } catch (err) {
      console.error(err)
      setStep('idle')
    }
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Amount (FXRP)"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          className="font-mono-data flex-1 bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:border-[var(--color-positive)] outline-none"
        />
        <button
          onClick={handleDeposit}
          disabled={!hasBalance || step !== 'idle' || isConfirming}
          className="text-sm px-4 py-2 rounded-md bg-[var(--color-accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isConfirming ? 'Confirming…' : needsApproval ? 'Approve' : `Deposit to ${vaultLabel}`}
        </button>
      </div>
      {balance !== undefined && (
        <p className="font-mono-data text-xs text-[var(--color-text-muted)]">
          Balance: {formatFxrp(balance)} FXRP
        </p>
      )}
      {isSuccess && (
        <p className="text-xs text-[var(--color-positive)]">
          {step === 'approving' ? 'Approved — click Deposit to confirm.' : 'Deposit confirmed.'}
        </p>
      )}
    </div>
  )
}

function VenueRow({
  snapshot,
  ticker,
  target,
}: {
  snapshot: VenueSnapshot
  ticker: string
  target: DepositTarget
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono-data text-xs px-2 py-1 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            {ticker}
          </span>
          <h3 className="text-lg font-medium">{snapshot.name}</h3>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">Coston2 · live</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">TVL</p>
          <p className="font-mono-data text-base flash-on-update">{formatUsd(snapshot.tvlUsdWei)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total assets</p>
          <p className="font-mono-data text-base flash-on-update">{formatFxrp(snapshot.totalAssets)} FXRP</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Accrued yield</p>
          <p className="font-mono-data text-base text-[var(--color-positive)] flash-on-update">
            {impliedYieldLabel(snapshot.sharePriceWei)}
          </p>
        </div>
      </div>

      <DepositAction target={target} vaultLabel={snapshot.name} />
    </div>
  )
}

export function VenueTable() {
  const { data, isLoading, error } = useReadContract({
    address: VENUE_ROUTER_ADDRESS,
    abi: venueRouterAbi,
    functionName: 'getAllSnapshots',
    query: { refetchInterval: 20_000 },
  })

  if (isLoading) {
    return <p className="text-[var(--color-text-muted)]">Loading live venue data…</p>
  }

  if (error) {
    return (
      <p className="text-[var(--color-accent)]">
        Couldn't reach VenueRouter. Confirm your wallet is on Flare Testnet Coston2.
      </p>
    )
  }

  if (!data) return null

  const [firelight, upshift] = data as readonly [VenueSnapshot, VenueSnapshot]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <VenueRow snapshot={firelight} ticker="FIRE" target="firelight" />
      <VenueRow snapshot={upshift} ticker="UPSH" target="upshift" />
    </div>
  )
}
