import { useAccount, useConnect, useDisconnect } from 'wagmi'

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="font-mono-data text-sm px-4 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] hover:border-[var(--color-positive)] transition-colors"
      >
        {truncate(address)}
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending}
      className="text-sm px-4 py-2 rounded-md bg-[var(--color-accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {isPending ? 'Connecting…' : 'Connect wallet'}
    </button>
  )
}
