import express from 'express';
import { config } from './config';
import { buildMerklAprResponse } from './handler';

const app = express();

// Merkl native APR endpoint – returns the APR data for all Balancer pools that
// have an active Merkl opportunity.
app.get('/', async (_, res) => {
    try {
        const data = await buildMerklAprResponse();
        res.json(data);
    } catch (error) {
        console.error('Error building Merkl APR response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/health', (_, res) => res.sendStatus(200));

app.listen(config.port, () => {
    console.log(`Merkl APR API listening on port ${config.port}`);
});
