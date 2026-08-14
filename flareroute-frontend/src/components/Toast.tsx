export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  txHash?: `0x${string}`
}

export function ToastItem({
  notification,
  onDismiss,
}: {
  notification: ToastNotification
  onDismiss: (id: string) => void
}) {
  const isSuccess = notification.type === 'success'
  const isError = notification.type === 'error'

  return (
    <div
      className={`glass-card relative overflow-hidden rounded-xl p-4 shadow-2xl border transition-all duration-300 ${
        isSuccess
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : isError
            ? 'border-rose-500/40 bg-rose-950/20'
            : 'border-cyan-500/40 bg-cyan-950/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl">
            {isSuccess ? '✅' : isError ? '⚠️' : 'ℹ️'}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)]">
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {notification.message}
              </p>
            )}
            {notification.txHash && (
              <a
                href={`https://coston2-explorer.flare.network/tx/${notification.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline mt-1.5 font-mono-data"
              >
                View on Coston2 Explorer ↗
              </a>
            )}
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] text-xs p-1"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
