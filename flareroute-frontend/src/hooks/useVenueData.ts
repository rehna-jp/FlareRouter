import { useReadContract } from 'wagmi'
import {
  VENUE_ROUTER_ADDRESS,
  venueRouterAbi,
  type VenueSnapshot,
} from '../contracts'

export interface VenueDetail extends VenueSnapshot {
  id: 'firelight' | 'upshift'
  ticker: string
  color: string
  tagline: string
  withdrawalType: '2-step' | 'instant'
  withdrawalDescription: string
}

export function useVenueData() {
  const {
    data: snapshotsRaw,
    isLoading: isLoadingSnapshots,
    isError: isErrorSnapshots,
    refetch: refetchSnapshots,
  } = useReadContract({
    address: VENUE_ROUTER_ADDRESS,
    abi: venueRouterAbi,
    functionName: 'getAllSnapshots',
    query: { refetchInterval: 15_000 },
  })

  const {
    data: priceWei,
    isLoading: isLoadingPrice,
    refetch: refetchPrice,
  } = useReadContract({
    address: VENUE_ROUTER_ADDRESS,
    abi: venueRouterAbi,
    functionName: 'getXrpUsdPriceWei',
    query: { refetchInterval: 15_000 },
  })

  const snapshots = snapshotsRaw as readonly [VenueSnapshot, VenueSnapshot] | undefined

  const firelightData: VenueDetail | undefined = snapshots?.[0]
    ? {
        ...snapshots[0],
        id: 'firelight',
        ticker: 'FIRE',
        color: '#e62058',
        tagline: 'ERC-4626 vault optimized for consistent FXRP compounding.',
        withdrawalType: '2-step',
        withdrawalDescription: 'Epoch-based redemption (Request → Claim on epoch close)',
      }
    : undefined

  const upshiftData: VenueDetail | undefined = snapshots?.[1]
    ? {
        ...snapshots[1],
        id: 'upshift',
        ticker: 'vFXRP',
        color: '#2dd4bf',
        tagline: 'Tokenized yield vault with instant liquidation availability.',
        withdrawalType: 'instant',
        withdrawalDescription: 'Instant single-tx withdrawal (small exit fee applies)',
      }
    : undefined

  const venues: VenueDetail[] = [firelightData, upshiftData].filter(Boolean) as VenueDetail[]

  const totalTvlUsd = venues.reduce((acc, v) => acc + v.tvlUsdWei, 0n)
  const totalAssets = venues.reduce((acc, v) => acc + v.totalAssets, 0n)

  const refetch = () => {
    refetchSnapshots()
    refetchPrice()
  }

  return {
    venues,
    firelight: firelightData,
    upshift: upshiftData,
    totalTvlUsd,
    totalAssets,
    priceWei,
    isLoading: isLoadingSnapshots || isLoadingPrice,
    isError: isErrorSnapshots,
    refetch,
  }
}
