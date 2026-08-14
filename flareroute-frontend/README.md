# FlareRoute — Frontend Application

Modern, non-custodial DeFi dashboard and routing interface for Flare Network's FXRP yield ecosystem.

## 🚀 Features

- **Protocol Dashboard**: Real-time Aggregated TVL, Total FXRP Locked, and FTSOv2 XRP/USD Oracle Price feeds.
- **Venue Comparison**: Live side-by-side performance metrics for Firelight (ERC-4626) and Upshift (`vFXRP` LP) vaults.
- **Uniswap-Inspired Route Card**: Clean, focused deposit and withdrawal workflows with token allowance automation.
- **Portfolio Manager**: Non-custodial tracking of vault share balances and underlying FXRP asset valuations.
- **Glassmorphism UI**: High-end dark theme design system with animated ambient background lighting and micro-animations.

## 🛠️ Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + Custom Glassmorphism Design Tokens
- **Web3**: Wagmi v3 + Viem
- **State & Queries**: TanStack Query v5
- **Network**: Flare Testnet Coston2 (Chain ID: `114`)

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript type check
npx tsc -b --noEmit

# Build for production
npm run build
```
