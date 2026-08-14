# FlareRoute — FXRP Yield Venue Router

> **Real-time FXRP yield comparison & non-custodial deposit routing on Flare Network, powered by FTSOv2 enshrined oracles.**

[![Coston2 Testnet](https://img.shields.io/badge/Network-Flare_Coston2-E62058?style=flat-square)](https://coston2-explorer.flare.network)
[![Router Contract](https://img.shields.io/badge/Router_Verified-0xa97b...deb8-2DD4BF?style=flat-square)](https://coston2-explorer.flare.network/address/0xa97b42443afb6279936e0641e77143b67047deb8)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 🌟 Overview

**FlareRoute** solves liquidity fragmentation for FXRP yield on Flare. Instead of navigating multiple decentralized apps, verifying vault mechanisms, and manually calculating exchange rates, users can:

1. **Compare** real-time Total Value Locked (TVL), share prices, and accrued yield across all live yield venues in a single on-chain query.
2. **Route** deposits or withdrawals into their chosen venue in a single transaction with automatic token allowance management.
3. **Track** their entire cross-venue FXRP portfolio, share allocations, and implied asset values in one non-custodial interface.

---

## 🏛️ Live Deployed Contracts (Flare Coston2 Testnet)

| Component | Address | Explorer | Standard |
|-----------|---------|----------|----------|
| **VenueRouter** | `0xa97b42443afb6279936e0641e77143b67047deb8` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0xa97b42443afb6279936e0641e77143b67047deb8) | Core Aggregator |
| **FXRP Token** | `0x0b6A3645c240605887a5532109323A3E12273dc7` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x0b6A3645c240605887a5532109323A3E12273dc7) | ERC-20 (6 Decimals) |
| **Firelight Vault** | `0xC90D6847747b85d1fa2E07859869fb9fB72c0361` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0xC90D6847747b85d1fa2E07859869fb9fB72c0361) | ERC-4626 Vault |
| **Upshift Vault** | `0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81) | Tokenized Vault |
| **Upshift LP Token** | `0xe084F7328DDaB082a139b880782dCC424d20a1DB` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0xe084F7328DDaB082a139b880782dCC424d20a1DB) | ERC-20 (`vFXRP`) |

---

## ⚡ How It Works

```
                        ┌───────────────────────────────┐
                        │   Flare FTSOv2 Oracle (XRP)   │
                        └──────────────┬────────────────┘
                                       │ Real-time XRP/USD Feed
                                       ▼
 ┌────────────────┐         ┌─────────────────────────┐         ┌───────────────────────┐
 │                ├────────►│     VenueRouter.sol     ├────────►│ Firelight Vault       │
 │   User Wallet  │ Deposit │                         │ Deposit │ (ERC-4626 standard)   │
 │                │◄────────┤ - getAllSnapshots()     ├────────►├───────────────────────┤
 │                │ Shares  │ - depositToFirelight()  │ Deposit │ Upshift Vault         │
 └────────────────┘         │ - depositToUpshift()    │         │ (Tokenized LP shares) │
                            └─────────────────────────┘         └───────────────────────┘
```

1. **On-Chain Telemetry Aggregation**: `VenueRouter.getAllSnapshots()` reads total assets, total supply, share prices, and computes live USD TVL using Flare's enshrined **FTSOv2 XRP/USD oracle feed**.
2. **Single-Transaction Routing**:
   - `depositToFirelight(amount)`: Pulls FXRP, approves Firelight vault, deposits, and mints `FIRE` shares directly to caller.
   - `depositToUpshift(amount)`: Pulls FXRP, deposits into Upshift vault, and mints `vFXRP` shares directly to caller.
3. **Decoupled Redemptions**:
   - **Upshift**: Single-transaction instant exit via `withdrawFromUpshift(shares)`.
   - **Firelight**: Two-step epoch queue (`requestWithdrawFromFirelight` -> wait for epoch end -> direct on-vault `claimWithdraw`).

---

## 🖥️ Frontend Architecture

The frontend is built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS 4**, and **Wagmi v3**:

- **🎨 Premium DeFi Aesthetic**: Dark obsidian background with animated floating ambient glow orbs, glassmorphism panels (`backdrop-filter: blur(20px)`), and micro-animations on telemetry refresh.
- **🧭 Multi-Page Client Routing**:
  - **`/` (Dashboard)**: Protocol statistics bar (TVL, FXRP in Vaults, Oracle Price, Active Venues), live venue cards, and ecosystem roadmap.
  - **`/route` (Route & Yield)**: Uniswap-inspired centered swap card with venue selectors, deposit/withdraw tabs, MAX balance autofill, and 2-step approval guidance.
  - **`/portfolio` (Portfolio)**: User position breakdown, share holdings, implied FXRP equivalent valuations, and quick deep-links.
- **⚡ Reactive On-Chain State Machines**: Dedicated custom hooks (`useVenueData`, `useDeposit`, `useWithdraw`) managing contract calls, pending states, allowance approvals, and error handling.
- **🔍 Wallet Experience**: Modal with address copy, C2FLR native gas balance display, Coston2 network badge, and Blockscout explorer links.

---

## 📁 Repository Structure

```
FlareRoute/
├── flareroute-frontend/           # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI & DeFi Components
│   │   │   ├── ConnectWallet.tsx  # Wallet modal & dropdown
│   │   │   ├── DepositCard.tsx    # Uniswap-style swap card
│   │   │   ├── Navbar.tsx         # Sticky glass navigation & live ticker
│   │   │   ├── Skeleton.tsx       # Shimmer loading placeholders
│   │   │   ├── StatsBar.tsx       # Protocol statistics bar
│   │   │   ├── Toast.tsx          # Transaction notification toasts
│   │   │   ├── UserPosition.tsx   # Portfolio holdings summary
│   │   │   ├── VenueCard.tsx      # Venue showcase card
│   │   │   └── WithdrawCard.tsx   # Instant & epoch withdraw card
│   │   ├── hooks/                 # Web3 state machine hooks
│   │   │   ├── useDeposit.ts      # 2-step approval & deposit logic
│   │   │   ├── useVenueData.ts    # Telemetry snapshot & FTSO oracle hook
│   │   │   └── useWithdraw.ts     # Instant & epoch redemption hook
│   │   ├── pages/                 # Route pages
│   │   │   ├── DashboardPage.tsx  # Main dashboard
│   │   │   ├── PortfolioPage.tsx  # Portfolio manager
│   │   │   └── RoutePage.tsx      # Route swap interface
│   │   ├── contracts.ts           # Deployed addresses & minimal ABIs
│   │   ├── index.css              # Design tokens & glassmorphism CSS
│   │   ├── router.tsx             # Zero-dependency client-side SPA router
│   │   └── wagmi.ts               # Wagmi & Viem Coston2 configuration
│   └── package.json
│
├── flare-foundry-starter/         # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── venueRouter/
│   │   │   ├── VenueRouter.sol    # Core router contract
│   │   │   └── ITokenizedVault.sol# Upshift vault interface
│   │   └── firelight/
│   │       └── IFirelightVault.sol# Firelight ERC-4626 interface
│   ├── script/
│   │   └── venueRouter/
│   │       └── Deploy.s.sol       # Coston2 broadcast deployment script
│   └── test/
│       └── venueRouter/
│           └── VenueRouter.t.sol  # Fork integration tests
└── README.md
```

---

## 🚀 Getting Started

### 1. Frontend Development

```bash
cd flareroute-frontend
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

### 2. Smart Contracts (Foundry)

```bash
cd flare-foundry-starter
forge build
```

Run fork tests against Coston2 live state:
```bash
forge test --match-contract VenueRouterTest --fork-url https://coston2-api.flare.network/ext/C/rpc -vvv
```

Deploy to Coston2:
```bash
source .env && forge script script/venueRouter/Deploy.s.sol:Deploy \
  --rpc-url coston2 --private-key $PRIVATE_KEY --broadcast \
  --verify --verifier blockscout \
  --verifier-url https://coston2-explorer.flare.network/api/
```

---

## 🗺️ Ecosystem Pipeline (Coming to FlareRoute)

| Venue | Protocol Type | Status |
|-------|---------------|--------|
| **Kinetic Market** | Algorithmic Lending & Borrowing | Mainnet Live · Router Integration in Progress |
| **Enosys Loans** | CDP & FXRP Collateralized Minting | Mainnet Live · Router Integration in Progress |
| **Mystic (Morpho)** | P2P Vault Infrastructure | Mainnet Live · Router Integration in Progress |

---

## 🛡️ Security & Design Principles

- **Non-Custodial**: `VenueRouter` does not hold user funds. It immediately deposits into target vaults and issues shares directly to the caller.
- **Dynamic Decimals**: FXRP's 6 decimals and share decimals are read dynamically on-chain to eliminate precision mismatch bugs.
- **Enshrined Oracles**: TVL computations rely directly on Flare's enshrined FTSOv2 price feeds without third-party dependencies.

---

## 📜 License

MIT License. Built for the Flare ecosystem.
