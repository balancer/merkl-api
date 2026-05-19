import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    responseCacheTtlMs: parseInt(process.env.RESPONSE_CACHE_TTL_MS || '30000', 10),
    balancerApiUrl: process.env.BALANCER_API_URL || 'https://api-v3.balancer.fi/graphql',
    merklApiKey: process.env.MERKL_API_KEY,
    merklOpportunitiesUrl:
        'https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&mainProtocolId=balancer&page=0&items=100',
};
