// Deployed and verified on Coston2 — see DEPLOYMENTS.md in the contracts repo.
export const VENUE_ROUTER_ADDRESS = '0x85D76C148d2C4cDddDbcb93b97fbeD63ea86de4B' as const
export const FXRP_ADDRESS = '0x0b6A3645c240605887a5532109323A3E12273dc7' as const
export const FIRELIGHT_VAULT_ADDRESS = '0xC90D6847747b85d1fa2E07859869fb9fB72c0361' as const
export const UPSHIFT_VAULT_ADDRESS = '0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81' as const

// Minimal ABI — only what the frontend actually calls, matching the exact
// signatures confirmed working in VenueRouter's test suite (8/8 passing).
export const venueRouterAbi = [
  {
    type: 'function',
    name: 'getAllSnapshots',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'vaultAddress', type: 'address' },
          { name: 'totalAssets', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'sharePriceWei', type: 'uint256' },
          { name: 'tvlUsdWei', type: 'uint256' },
        ],
      },
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'vaultAddress', type: 'address' },
          { name: 'totalAssets', type: 'uint256' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'sharePriceWei', type: 'uint256' },
          { name: 'tvlUsdWei', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getXrpUsdPriceWei',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'valueWei', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'fxrpDecimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'depositToFirelight',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'depositToUpshift',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const

// Minimal ERC-20 ABI — balance, allowance, approve. FXRP requires an
// explicit approval to VenueRouter before either deposit function will
// succeed (VenueRouter calls transferFrom under the hood).
export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

export type VenueSnapshot = {
  name: string
  vaultAddress: `0x${string}`
  totalAssets: bigint
  totalSupply: bigint
  sharePriceWei: bigint
  tvlUsdWei: bigint
}
