import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { healthRouter } from './routes/health.js';
import { statsRouter, donorsRouter } from './routes/stats.js';
import { orgsRouter } from './routes/orgs.js';
import { startIndexer, stopIndexer } from './services/indexer.js';
import { prisma } from './lib/prisma.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/stats', statsRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/orgs', orgsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const server = app.listen(env.PORT, () => {
  console.log(`[api] http://localhost:${env.PORT}/api/health`);
  startIndexer();
});

const shutdown = async () => {
  stopIndexer();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
