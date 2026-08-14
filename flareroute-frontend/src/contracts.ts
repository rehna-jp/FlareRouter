// Deployed and verified on Coston2 — see DEPLOYMENTS.md in the contracts repo.
export const VENUE_ROUTER_ADDRESS = '0xa97b42443afb6279936e0641e77143b67047deb8' as const
export const FXRP_ADDRESS = '0x0b6A3645c240605887a5532109323A3E12273dc7' as const
export const FIRELIGHT_VAULT_ADDRESS = '0xC90D6847747b85d1fa2E07859869fb9fB72c0361' as const
export const UPSHIFT_VAULT_ADDRESS = '0x24c1a47cD5e8473b64EAB2a94515a196E10C7C81' as const
// Upshift's share token is a SEPARATE LP token contract, not the vault
// itself — confirmed via lpTokenAddress() on Coston2. Symbol: vFXRP.
export const UPSHIFT_LP_TOKEN_ADDRESS = '0xe084F7328DDaB082a139b880782dCC424d20a1DB' as const

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
  {
    type: 'function',
    name: 'requestWithdrawFromFirelight',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdrawFromUpshift',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
] as const

// Firelight-specific reads/writes called DIRECTLY against the vault, not
// through VenueRouter. claimWithdraw() has no owner parameter — it's keyed
// to msg.sender — so it must be called by the user's own wallet, never
// proxied through the router (see VenueRouter.sol's doc comment on
// requestWithdrawFromFirelight for the full explanation).
export const firelightVaultAbi = [
  {
    type: 'function',
    name: 'currentPeriod',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'nextPeriodEnd',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint48' }],
  },
  {
    type: 'function',
    name: 'withdrawalsOf',
    stateMutability: 'view',
    inputs: [
      { name: 'period', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isWithdrawClaimed',
    stateMutability: 'view',
    inputs: [
      { name: 'period', type: 'uint256' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'claimWithdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'period', type: 'uint256' }],
    outputs: [{ name: 'assets', type: 'uint256' }],
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