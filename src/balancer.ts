import { config } from './config';

export interface PoolAprItem {
    id: string;
    apr: number;
    type: string | null;
}

export interface Pool {
    id: string;
    address: string;
    chain: string;
    dynamicData: {
        totalLiquidity: string;
        aprItems: PoolAprItem[];
    };
}

// APR types excluded from the native APR sum to avoid double-counting or stale data.
// Mirrors the exclusion logic used in the backend total APR calculation, plus MERKL itself.
const EXCLUDED_APR_TYPES = new Set([
    'MERKL',
    'SWAP_FEE', // deprecated alias for SWAP_FEE_24H
    'SWAP_FEE_7D', // 7-day rolling window
    'SWAP_FEE_30D', // 30-day rolling window
    'SURPLUS', // deprecated alias for SURPLUS_24H
    'SURPLUS_7D', // 7-day rolling window
    'SURPLUS_30D', // 30-day rolling window
    'DYNAMIC_SWAP_FEE_24H', // variant of swap fee
]);

const POOLS_QUERY = `
  query PoolsWithAprs($first: Int!, $skip: Int!) {
    poolGetPools(
      first: $first
      skip: $skip
      where: { minTvl: 10 }
    ) {
      id
      address
      chain
      dynamicData {
        totalLiquidity
        aprItems {
          id
          apr
          type
        }
      }
    }
  }
`;

export async function fetchPoolsWithAprs(): Promise<Pool[]> {
    const pageSize = 1000;
    let skip = 0;
    const allPools: Pool[] = [];

    while (true) {
        const response = await fetch(config.balancerApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: POOLS_QUERY,
                variables: { first: pageSize, skip },
            }),
        });

        if (!response.ok) {
            throw new Error(`Balancer API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as { data: { poolGetPools: Pool[] } };
        const pools = data.data.poolGetPools;

        allPools.push(...pools);

        if (pools.length < pageSize) break;
        skip += pageSize;
    }

    return allPools;
}

export function hasMerklApr(pool: Pool): boolean {
    return pool.dynamicData.aprItems.some((item) => item.type === 'MERKL');
}

export function sumNonMerklApr(pool: Pool): number {
    return pool.dynamicData.aprItems
        .filter((item) => item.type === null || !EXCLUDED_APR_TYPES.has(item.type))
        .reduce((sum, item) => sum + item.apr, 0);
}
