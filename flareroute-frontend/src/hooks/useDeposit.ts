import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import {
  VENUE_ROUTER_ADDRESS,
  FXRP_ADDRESS,
  venueRouterAbi,
  erc20Abi,
} from '../contracts'
import { FXRP_DECIMALS } from '../lib/format'

export type DepositStep = 'idle' | 'approving' | 'approved' | 'depositing' | 'success' | 'error'

export function useDeposit(target: 'firelight' | 'upshift') {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<DepositStep>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTxType, setActiveTxType] = useState<'approve' | 'deposit' | null>(null)

  // Balance & Allowance queries
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: FXRP_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: FXRP_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, VENUE_ROUTER_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const { writeContractAsync, isPending: isWriting } = useWriteContract()
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>()

  const {
    isLoading: isConfirming,
    isSuccess: isTxConfirmed,
    isError: isTxError,
  } = useWaitForTransactionReceipt({ hash: pendingHash })

  // Amount parsing
  const amountUnits =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, FXRP_DECIMALS)
      : 0n

  const hasSufficientBalance =
    balance !== undefined && amountUnits > 0n && amountUnits <= balance
  const needsApproval = allowance === undefined || allowance < amountUnits

  // Update step status on transaction confirmation
  useEffect(() => {
    if (isTxConfirmed) {
      if (activeTxType === 'approve') {
        setStep('approved')
        refetchAllowance()
      } else if (activeTxType === 'deposit') {
        setStep('success')
        refetchBalance()
        refetchAllowance()
      }
      setPendingHash(undefined)
    }
  }, [isTxConfirmed, activeTxType, refetchAllowance, refetchBalance])

  useEffect(() => {
    if (isTxError) {
      setStep('error')
      setErrorMessage('Transaction failed on-chain. Please check gas settings or try again.')
      setPendingHash(undefined)
    }
  }, [isTxError])

  const setMaxAmount = () => {
    if (balance !== undefined) {
      const formatted = (Number(balance) / 10 ** FXRP_DECIMALS).toString()
      setAmount(formatted)
      setStep('idle')
      setErrorMessage(null)
    }
  }

  const reset = () => {
    setAmount('')
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
        address: FXRP_ADDRESS,
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

  const executeDeposit = async () => {
    if (!amountUnits) return
    try {
      setErrorMessage(null)
      setStep('depositing')
      setActiveTxType('deposit')
      if (target === 'firelight') {
        const hash = await writeContractAsync({
          address: VENUE_ROUTER_ADDRESS,
          abi: venueRouterAbi,
          functionName: 'depositToFirelight',
          args: [amountUnits],
        })
        setPendingHash(hash)
      } else {
        const hash = await writeContractAsync({
          address: VENUE_ROUTER_ADDRESS,
          abi: venueRouterAbi,
          functionName: 'depositToUpshift',
          args: [amountUnits],
        })
        setPendingHash(hash)
      }
    } catch (err: unknown) {
      console.error('Deposit failed:', err)
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Deposit was rejected or failed.')
    }
  }

  return {
    amount,
    setAmount,
    amountUnits,
    balance,
    allowance,
    step,
    errorMessage,
    pendingHash,
    isBusy: isWriting || isConfirming,
    isConfirming,
    hasSufficientBalance,
    needsApproval,
    isConnected,
    isLoadingBalance: isLoadingBalance || isLoadingAllowance,
    setMaxAmount,
    executeApprove,
    executeDeposit,
    reset,
  }
}
