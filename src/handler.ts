import { fetchPoolsWithAprs, hasMerklApr, sumNonMerklApr } from './balancer';
import { fetchMerklOpportunities, MerklOpportunity } from './merkl';

// Matches the chain strings returned by the Balancer API to Merkl chainIds
const CHAIN_TO_CHAIN_ID: Record<string, number> = {
    MAINNET: 1,
    OPTIMISM: 10,
    GNOSIS: 100,
    POLYGON: 137,
    ZKEVM: 1101,
    BASE: 8453,
    ARBITRUM: 42161,
    AVALANCHE: 43114,
    FRAXTAL: 252,
    MODE: 34443,
    SONIC: 146,
    HYPEREVM: 999,
    PLASMA: 9745,
    XLAYER: 196,
    MONAD: 143,
};

export interface MerklNativeAprItem {
    title: string;
    opportunityId: string;
    timestamp: number;
    value: number;
    description: string;
}

const TITLE = 'Balancer Pool APR';
const DESCRIPTION =
    'Balancer protocol APR consists of swap fees, captured yield and additional rewards. See Balancer for details';

export async function buildMerklAprResponse(): Promise<MerklNativeAprItem[]> {
    const [pools, opportunities] = await Promise.all([fetchPoolsWithAprs(), fetchMerklOpportunities()]);

    // Only consider pools that have at least one Merkl APR item (i.e. Merkl tracks them)
    const merklPools = pools.filter(hasMerklApr);

    // Build a lookup map: `${poolAddress}-${chainId}` -> opportunity
    const opportunityByKey = new Map<string, MerklOpportunity>();
    for (const opp of opportunities) {
        const key = `${opp.identifier.toLowerCase()}-${opp.chainId}`;
        opportunityByKey.set(key, opp);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const result: MerklNativeAprItem[] = [];

    for (const pool of merklPools) {
        const chainId = CHAIN_TO_CHAIN_ID[pool.chain];
        if (chainId === undefined) continue;

        const key = `${pool.address.toLowerCase()}-${chainId}`;
        const opportunity = opportunityByKey.get(key);
        if (!opportunity) continue;

        // Sum all non-Merkl APR items (swap fees, yield, staking rewards, etc.)
        const nativeApr = sumNonMerklApr(pool);

        result.push({
            title: TITLE,
            opportunityId: opportunity.id,
            timestamp,
            // Balancer API returns APR as a fraction (0.2 = 20%); Merkl expects a percentage number
            value: nativeApr * 100,
            description: DESCRIPTION,
        });
    }

    return result;
}
