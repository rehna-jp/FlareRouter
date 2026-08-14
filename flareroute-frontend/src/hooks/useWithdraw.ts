import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import {
  VENUE_ROUTER_ADDRESS,
  FIRELIGHT_VAULT_ADDRESS,
  UPSHIFT_LP_TOKEN_ADDRESS,
  venueRouterAbi,
  erc20Abi,
  firelightVaultAbi,
} from '../contracts'
import { FXRP_DECIMALS } from '../lib/format'

export type WithdrawStep = 'idle' | 'approving' | 'approved' | 'withdrawing' | 'claiming' | 'success' | 'error'

export interface WithdrawHookResult {
  amount: string
  setAmount: (val: string) => void
  claimPeriod: string
  setClaimPeriod: (val: string) => void
  amountUnits: bigint
  shareBalance: bigint | undefined
  allowance: bigint | undefined
  currentPeriod: bigint | undefined
  nextPeriodEnd: number | bigint | undefined
  step: WithdrawStep
  errorMessage: string | null
  pendingHash: `0x${string}` | undefined
  isBusy: boolean
  isConfirming: boolean
  hasSufficientShares: boolean
  needsApproval: boolean
  isConnected: boolean
  isLoadingShareBalance: boolean
  setMaxAmount: () => void
  executeApprove: () => Promise<void>
  executeWithdraw: () => Promise<void>
  executeClaim: () => Promise<void>
  reset: () => void
}

export function useWithdraw(target: 'firelight' | 'upshift'): WithdrawHookResult {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [claimPeriod, setClaimPeriod] = useState('')
  const [step, setStep] = useState<WithdrawStep>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTxType, setActiveTxType] = useState<'approve' | 'withdraw' | 'claim' | null>(null)

  const shareTokenAddress =
    target === 'firelight' ? FIRELIGHT_VAULT_ADDRESS : UPSHIFT_LP_TOKEN_ADDRESS

  // Share Balance & Allowance to VenueRouter
  const {
    data: shareBalance,
    isLoading: isLoadingShareBalance,
    refetch: refetchShareBalance,
  } = useReadContract({
    address: shareTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const {
    data: allowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: shareTokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, VENUE_ROUTER_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  // Firelight specific period data
  const { data: currentPeriod } = useReadContract({
    address: FIRELIGHT_VAULT_ADDRESS,
    abi: firelightVaultAbi,
    functionName: 'currentPeriod',
    query: { enabled: target === 'firelight', refetchInterval: 20_000 },
  })

  const { data: nextPeriodEnd } = useReadContract({
    address: FIRELIGHT_VAULT_ADDRESS,
    abi: firelightVaultAbi,
    functionName: 'nextPeriodEnd',
    query: { enabled: target === 'firelight', refetchInterval: 20_000 },
  })

  const { writeContractAsync, isPending: isWriting } = useWriteContract()
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>()

  const {
    isLoading: isConfirming,
    isSuccess: isTxConfirmed,
    isError: isTxError,
  } = useWaitForTransactionReceipt({ hash: pendingHash })

  const amountUnits =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, FXRP_DECIMALS)
      : 0n

  const hasSufficientShares =
    shareBalance !== undefined && amountUnits > 0n && amountUnits <= shareBalance
  const needsApproval = allowance === undefined || allowance < amountUnits

  useEffect(() => {
    if (isTxConfirmed) {
      if (activeTxType === 'approve') {
        setStep('approved')
        refetchAllowance()
      } else if (activeTxType === 'withdraw' || activeTxType === 'claim') {
        setStep('success')
        refetchShareBalance()
        refetchAllowance()
      }
      setPendingHash(undefined)
    }
  }, [isTxConfirmed, activeTxType, refetchAllowance, refetchShareBalance])

  useEffect(() => {
    if (isTxError) {
      setStep('error')
      setErrorMessage('Withdrawal transaction failed on-chain.')
      setPendingHash(undefined)
    }
  }, [isTxError])

  const setMaxAmount = () => {
    if (shareBalance !== undefined) {
      const formatted = (Number(shareBalance) / 10 ** FXRP_DECIMALS).toString()
      setAmount(formatted)
      setStep('idle')
      setErrorMessage(null)
    }
  }

  const reset = () => {
    setAmount('')
    setClaimPeriod('')
    setStep('idle')
    setErrorMessage(null)
    setActiveTxType(null)
    setPendingHash(undefined)
  }

  const executeApprove = async () => {
    if (!amountUnits) return
    try {
      setErrorMessage(null)
      setStep('approving')
      setActiveTxType('approve')
      const hash = await writeContractAsync({
        address: shareTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [VENUE_ROUTER_ADDRESS, amountUnits],
      })
      setPendingHash(hash)
    } catch (err: unknown) {
      console.error('Approve failed:', err)
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Approval was rejected or failed.')
    }
  }

  const executeWithdraw = async () => {
    if (!amountUnits) return
    try {
      setErrorMessage(null)
      setStep('withdrawing')
      setActiveTxType('withdraw')
      if (target === 'firelight') {
        const hash = await writeContractAsync({
          address: VENUE_ROUTER_ADDRESS,
          abi: venueRouterAbi,
          functionName: 'requestWithdrawFromFirelight',
          args: [amountUnits],
        })
        setPendingHash(hash)
      } else {
        const hash = await writeContractAsync({
          address: VENUE_ROUTER_ADDRESS,
          abi: venueRouterAbi,
          functionName: 'withdrawFromUpshift',
          args: [amountUnits],
        })
        setPendingHash(hash)
      }
    } catch (err: unknown) {
      console.error('Withdraw failed:', err)
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Withdrawal was rejected or failed.')
    }
  }

  const executeClaim = async () => {
    if (!claimPeriod || isNaN(Number(claimPeriod))) return
    try {
      setErrorMessage(null)
      setStep('claiming')
      setActiveTxType('claim')
      const hash = await writeContractAsync({
        address: FIRELIGHT_VAULT_ADDRESS,
        abi: firelightVaultAbi,
        functionName: 'claimWithdraw',
        args: [BigInt(claimPeriod)],
      })
      setPendingHash(hash)
    } catch (err: unknown) {
      console.error('Claim failed:', err)
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Claim failed.')
    }
  }

  return {
    amount,
    setAmount,
    claimPeriod,
    setClaimPeriod,
    amountUnits,
    shareBalance,
    allowance,
    currentPeriod,
    nextPeriodEnd,
    step,
    errorMessage,
    pendingHash,
    isBusy: isWriting || isConfirming,
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
  }
}
