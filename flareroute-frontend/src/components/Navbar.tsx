import { useState } from 'react'
import { Link, NavLink } from '../router'
import { ConnectWallet } from './ConnectWallet'
import { useVenueData } from '../hooks/useVenueData'
import { formatPrice } from '../lib/format'
import flareRouteLogo from '../assets/flareroute-icon.png'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { priceWei } = useVenueData()

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/route', label: 'Route & Yield' },
    { to: '/portfolio', label: 'Portfolio' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[rgba(7,9,14,0.75)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src={flareRouteLogo}
                  alt="FlareRoute"
                  className="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-xl bg-pink-500/20 filter blur-sm -z-10 group-hover:bg-pink-500/40 transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-[var(--color-text)] flex items-center gap-1.5">
                  Flare<span className="text-gradient-brand">Route</span>
                  <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-normal">
                    v1
                  </span>
                </span>
                <span className="text-[10px] text-[var(--color-text-dim)] font-medium tracking-wide">
                  FXRP YIELD ROUTER
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Actions: FTSO Ticker + Wallet */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Live XRP/USD FTSO Ticker */}
            {priceWei !== undefined && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-[var(--color-border)] text-xs font-mono-data text-[var(--color-text-muted)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span>XRP</span>
                <span className="text-[var(--color-text)] font-semibold flash-on-update">
                  {formatPrice(priceWei)}
                </span>
                <span className="text-[9px] text-[var(--color-text-dim)] border-l border-[var(--color-border)] pl-1.5">
                  FTSOv2
                </span>
              </div>
            )}

            <ConnectWallet />
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <ConnectWallet />
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white' : 'text-[var(--color-text-muted)]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {priceWei !== undefined && (
            <div className="px-3 py-2 text-xs font-mono-data text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3">
              XRP/USD: <span className="text-white">{formatPrice(priceWei)}</span> (FTSOv2)
            </div>
          )}
        </div>
      )}
    </header>
  )
}
