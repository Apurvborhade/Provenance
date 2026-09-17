import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('file:./dev.db'),
  RPC_URL: z.string().url().default('https://sepolia.base.org'),
  CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .default('0x0000000000000000000000000000000000000000'),
  CONTRACT_DEPLOY_BLOCK: z.coerce.number().int().nonnegative().default(0),
  INDEXER_POLL_MS: z.coerce.number().int().positive().default(10_000),
  INDEXER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
});

export const env = schema.parse(process.env);
export const CONTRACT_ADDRESS = env.CONTRACT_ADDRESS as `0x${string}`;
export const CONTRACT_CONFIGURED = CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
