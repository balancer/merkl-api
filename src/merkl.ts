import { config } from './config';

export interface MerklOpportunity {
    id: string;
    chainId: number;
    identifier: string;
    apr: number;
    campaigns: {
        params: {
            whitelist: string[];
        };
    }[];
}

export async function fetchMerklOpportunities(): Promise<MerklOpportunity[]> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (config.merklApiKey) {
        headers['X-API-Key'] = config.merklApiKey;
    }

    const response = await fetch(config.merklOpportunitiesUrl, { headers });

    if (!response.ok) {
        throw new Error(`Merkl API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as MerklOpportunity[];

    // Filter out opportunities that are restricted to a whitelist of addresses
    return data.filter((opp) => opp.campaigns.every((campaign) => campaign.params.whitelist.length === 0));
}
