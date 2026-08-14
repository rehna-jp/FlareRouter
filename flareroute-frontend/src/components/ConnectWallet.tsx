import { useState, useRef, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { truncateAddress } from '../lib/format'
import { coston2 } from '../wagmi'

export function ConnectWallet() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: c2flrBalance } = useBalance({
    address,
    query: { enabled: !!address },
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isConnected && address) {
    const isWrongNetwork = chainId !== coston2.id

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-mono-data border transition-all ${
            isWrongNetwork
              ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
              : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-white/20 text-[var(--color-text)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isWrongNetwork ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span>{truncateAddress(address)}</span>
          <svg
            className={`w-3.5 h-3.5 text-[var(--color-text-dim)] transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-xs text-[var(--color-text-dim)]">Connected Account</p>
                <p className="text-sm font-mono-data font-semibold text-[var(--color-text)]">
                  {truncateAddress(address)}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[var(--color-accent)] transition-colors"
                title="Copy Address"
              >
                {copied ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>

            <div className="py-3 border-b border-[var(--color-border)] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-dim)]">Network</span>
                <span className="font-medium text-emerald-400">Flare Coston2</span>
              </div>
              {c2flrBalance && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-dim)]">Gas Balance</span>
                  <span className="font-mono-data text-[var(--color-text)]">
                    {Number(formatUnits(c2flrBalance.value, c2flrBalance.decimals)).toFixed(3)} C2FLR
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 flex flex-col gap-2">
              <a
                href={`https://coston2-explorer.flare.network/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-center py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                View on Explorer ↗
              </a>
              <button
                onClick={() => {
                  disconnect()
                  setDropdownOpen(false)
                }}
                className="text-xs py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="btn-primary text-sm px-4 py-2.5 rounded-xl font-medium flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>{isPending ? 'Connecting…' : 'Connect Wallet'}</span>
    </button>
  )
}
