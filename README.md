# FlareRoute — FXRP Yield Venue Router

A smart contract router that **compares FXRP yield venues** on [Flare](https://flare.network/) and lets users deposit into their preferred venue in a single transaction.

Currently scoped to the two yield venues confirmed live on **Coston2 testnet**:

| Venue | Vault Address | Type |
|-------|--------------|------|
| **Firelight** | `0xC90D6847747b85d1fa2E07859869fb9fB72c0361` | ERC-4626 |
| **Upshift** | `0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81` | Tokenized Vault |

## How It Works

1. **Compare** — `getAllSnapshots()` returns both venues' total assets, share price, and TVL in USD (via Flare's FTSOv2 XRP/USD price feed) in a single call.
2. **Route** — `depositToFirelight(amount)` or `depositToUpshift(amount)` pulls FXRP from the user, approves the chosen vault, and deposits — minting vault shares directly to the caller.

The router cross-checks that both vaults reference the **same FXRP token** at deploy time, and reads FXRP's decimals on-chain rather than hardcoding them.

## Deployed Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **VenueRouter** | `0x85D76C148d2C4cDddDbcb93b97fbeD63ea86de4B` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x85d76c148d2c4cddddbcb93b97fbed63ea86de4b) |
| FXRP | `0x0b6A3645c240605887a5532109323A3E12273dc7` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x0b6A3645c240605887a5532109323A3E12273dc7) |

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed

### Installation

```bash
git clone https://github.com/rehna-jp/FlareRouter.git
cd FlareRouter
forge soldeer install
```

### Configuration

```bash
cp .env.example .env
```

Set `PRIVATE_KEY` to a funded wallet on Coston2. The `.env.example` contains all available configuration options including RPC URLs, API keys, and explorer endpoints.

### Build

```bash
forge build
```

### Test

The tests fork Coston2 to read live vault state and FTSO prices:

```bash
forge test --match-contract VenueRouterTest --fork-url coston2 -vvv
```

### Deploy

```bash
source .env && forge script script/venueRouter/Deploy.s.sol:Deploy \
  --rpc-url coston2 --private-key $PRIVATE_KEY --broadcast \
  --verify --verifier blockscout \
  --verifier-url https://coston2-explorer.flare.network/api/
```

## Project Structure

```
src/
├── venueRouter/
│   ├── VenueRouter.sol       # Core router: compare venues + route deposits
│   └── ITokenizedVault.sol   # Upshift vault interface (non-ERC-4626)
├── firelight/
│   └── IFirelightVault.sol   # Firelight vault interface (ERC-4626)
└── utils/                    # Shared utilities

script/
└── venueRouter/
    └── Deploy.s.sol          # Deployment script for VenueRouter

test/
└── venueRouter/
    └── VenueRouter.t.sol     # Fork tests against live Coston2 state
```

## Architecture Decisions

- **No hardcoded FXRP address** — resolved at deploy time from the vaults' `asset()` calls, with a cross-check that both vaults agree.
- **FXRP decimals read on-chain** — FXRP uses 6 decimals (not 18). The router reads `decimals()` at deploy time to correctly normalize TVL and share price calculations.
- **FTSOv2 price feed** — XRP/USD price for TVL calculation comes from Flare's enshrined oracle, not a third-party feed.
- **Two confirmed venues only** — other venues (Kinetic, Enosys Loans, Mystic) are referenced in project docs but not routed through this contract because they are either mainnet-only or read-only on Coston2.

## License

MIT
